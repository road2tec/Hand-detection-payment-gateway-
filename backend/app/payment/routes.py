from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from backend.app.database.mongo import get_db
from backend.app.payment.razorpay_service import RazorpayService
from backend.app.auth.utils import get_current_user
from backend.app.utils.security import decrypt_template, mask_account_number
from backend.app.utils.audit_logger import AuditLogger
from bson import ObjectId
import os
import cv2
import numpy as np
from backend.app.biometric.hand_detector import HandDetector
from backend.app.biometric.feature_extractor import FeatureExtractor
from backend.app.biometric.matcher import Matcher
from backend.app.utils.otp_handler import generate_otp, hash_otp, verify_otp_hash
from backend.app.utils.email import send_otp_email
from datetime import datetime, timedelta

router = APIRouter(prefix="/payment", tags=["payment"])
razorpay_service = RazorpayService()
detector = HandDetector(mode=True)
extractor = FeatureExtractor() # Initialize global instance

class PaymentVerifyRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    biometric_verified: bool

class OTPVerifyRequest(BaseModel):
    otp: str
    amount: float

class PINVerifyRequest(BaseModel):
    pin: str
    amount: float

@router.post("/create-order")
async def create_secure_order(
    image: UploadFile = File(...),
    amount: float = Form(...),
    recipient_name: str = Form(...),
    account_number: str = Form(...),
    ifsc_code: str = Form(...),
    bank_name: str = Form(None),
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Zero-Trust Order Creation:
    Only creates a Razorpay order if the hand biometric is verified.
    """
    print(f"DEBUG: SECURE Order request for {current_user['email']} - Amount: ₹{amount}")
    
    # 1. Fetch user biometric profile
    biometric_data = await db.biometrics.find_one({"user_id": str(current_user["_id"])})
    if not biometric_data:
        raise HTTPException(status_code=404, detail="Biometric profile not found. Please register your hand first.")

    # 2. Process image
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image")

    # 3. Quality Check
    is_good, issues = detector.check_image_quality(img)
    if not is_good:
        await AuditLogger.log_event(db, current_user["_id"], "biometric_auth", "FAILED", {"reason": "Quality check failed", "issues": issues}, {"amount": amount})
        raise HTTPException(status_code=422, detail={"message": "Image quality issues detected.", "issues": issues})

    # 4. Biometric Verification
    detector.find_hands(img)
    landmarks, h_type = detector.find_position(img) # Unpack hand type
    
    if not landmarks:
        raise HTTPException(status_code=422, detail="Hand not detected")
        
    new_vector = FeatureExtractor.extract_features(landmarks)
    new_cnn_vector = extractor.extract_cnn_features(img)
    
    # Decrypt stored features on-the-fly
    stored_geo = biometric_data["feature_vectors"]
    if isinstance(stored_geo, str):
        stored_geo = decrypt_template(stored_geo)
        
    stored_cnn = biometric_data.get("cnn_features")
    if stored_cnn and isinstance(stored_cnn, str):
        stored_cnn = decrypt_template(stored_cnn)
    
    # Strictly Enforce Identity Logic (Enrolled Type vs Current Type)
    match_result, scores = Matcher.verify(
        new_geo=new_vector, 
        stored_geo=stored_geo,
        new_cnn=new_cnn_vector,
        stored_cnn=stored_cnn,
        current_hand_type=h_type,
        enrolled_hand_type=biometric_data.get("hand_type")
    )
    
    # Log verification attempt
    await AuditLogger.log_event(db, current_user["_id"], "biometric_auth", match_result["status"], {
        "score": match_result.get("confidence_score", 0.0),
        "geo_score": scores.get("geo_score", 0.0),
        "cnn_score": scores.get("cnn_score", 0.0),
        "reason": match_result["reason"],
        "amount": amount
    })

    if match_result == "re-register":
        raise HTTPException(status_code=400, detail="Security update: Biometric profile outdated. Please re-register.")
    
    if match_result["status"] != "VERIFIED":
        # Return strict failure response
        raise HTTPException(
            status_code=401, 
            detail={
                "message": "Biometric verification failed",
                "reason": match_result["reason"],
                "confidence_score": match_result["confidence_score"]
            }
        )

    # 4. Multi-Tier Risk-Based Gate
    # Tier 1: < 2000 -> Palm Only (Already completed if we are here)
    
    # Tier 2: 2000 - 10000 -> Palm + PIN
    if 2000 <= amount <= 10000:
        verified_pin = await db.pin_verifications.find_one({
            "user_id": str(current_user["_id"]),
            "amount": amount,
            "verified": True,
            "used": False,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if not verified_pin:
            return {
                "pin_required": True,
                "message": "Secure PIN verification required for this transaction level."
            }
        else:
            await db.pin_verifications.update_one({"_id": verified_pin["_id"]}, {"$set": {"used": True}})

    # Tier 3: > 10000 -> Palm + Email OTP
    elif amount > 10000:
        # Check if an OTP was recently verified for this user and amount
        verified_otp = await db.otps.find_one({
            "user_id": str(current_user["_id"]),
            "amount": amount,
            "verified": True,
            "used": False,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if not verified_otp:
            # Generate and send new OTP
            otp = generate_otp()
            hashed_otp = hash_otp(otp)
            
            # Save to DB
            expires_at = datetime.utcnow() + timedelta(minutes=5)
            await db.otps.delete_many({"user_id": str(current_user["_id"]), "used": False}) # Clear old pending OTPs
            await db.otps.insert_one({
                "user_id": str(current_user["_id"]),
                "hashed_otp": hashed_otp,
                "amount": amount,
                "expires_at": expires_at,
                "verified": False,
                "used": False,
                "attempts": 0
            })
            
            # Send Email
            email_sent = send_otp_email(current_user["email"], otp)
            if not email_sent:
                raise HTTPException(status_code=500, detail="Failed to send OTP email. Please try again.")
            
            return {
                "otp_required": True,
                "message": "High-value payment detected. A 6-digit OTP has been sent to your registered email."
            }
        else:
            # OTP is verified, mark it as used
            await db.otps.update_one({"_id": verified_otp["_id"]}, {"$set": {"used": True}})

    # 5. Create Razorpay Order only after verification (Biometric + OTP if needed)
    order = razorpay_service.create_order(amount)
    if order is None:
        raise HTTPException(status_code=500, detail="Failed to create Razorpay order")

    # 6. Save pending order with recipient details
    payment_data = {
        "user_id": str(current_user["_id"]),
        "amount": amount,
        "recipient_details": {
            "name": recipient_name,
            "account_masked": mask_account_number(account_number),
            "ifsc": ifsc_code,
            "bank": bank_name or "Standard Bank"
        },
        "razorpay_order_id": order["id"],
        "payment_status": "pending",
        "biometric_verified": True,
        "pin_verified": True if 2000 <= amount <= 10000 else False,
        "otp_verified": True if amount > 10000 else False,
        "created_at": datetime.utcnow() # Use standard datetime
    }
    await db.payments.insert_one(payment_data)

    # SECURE AUDIT: Log the initiation event for Admin visibility
    await AuditLogger.log_event(db, current_user["_id"], "payment_initiated", "SUCCESS", {
        "amount": amount,
        "recipient": recipient_name,
        "account": mask_account_number(account_number),
        "order_id": order["id"]
    })
    
    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": os.getenv("RAZORPAY_KEY_ID")
    }

@router.post("/verify-otp")
async def verify_otp(
    request: OTPVerifyRequest,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Verify the 6-digit OTP for high-value transactions.
    """
    otp_record = await db.otps.find_one({
        "user_id": str(current_user["_id"]),
        "amount": request.amount,
        "used": False,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="OTP expired or not found. Please initiate the payment again.")
    
    if otp_record["attempts"] >= 3:
        raise HTTPException(status_code=400, detail="Maximum attempts exceeded. Please request a new OTP.")
    
    # Verify OTP
    if verify_otp_hash(request.otp, otp_record["hashed_otp"]):
        await db.otps.update_one(
            {"_id": otp_record["_id"]},
            {"$set": {"verified": True}}
        )
        return {"message": "OTP verified successfully. You can now proceed with the payment."}
    else:
        await db.otps.update_one(
            {"_id": otp_record["_id"]},
            {"$inc": {"attempts": 1}}
        )
        remaining = 3 - (otp_record["attempts"] + 1)
        raise HTTPException(status_code=400, detail=f"Invalid OTP. {remaining} attempts remaining.")

@router.post("/verify-pin")
async def verify_pin(
    request: PINVerifyRequest,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Verify the user's PIN for Tier 2 payments.
    """
    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    if not user or "hashed_pin" not in user:
        raise HTTPException(status_code=400, detail="PIN not set for this account.")
    
    # Use verify_password since we used get_password_hash for PIN
    from backend.app.utils.security import verify_password
    if not verify_password(request.pin, user["hashed_pin"]):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    # Store verification record
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    await db.pin_verifications.delete_many({"user_id": str(current_user["_id"]), "used": False})
    await db.pin_verifications.insert_one({
        "user_id": str(current_user["_id"]),
        "amount": request.amount,
        "verified": True,
        "used": False,
        "expires_at": expires_at
    })
    
    return {"message": "PIN verified successfully."}

@router.post("/verify-payment")
async def verify_payment(
    request: PaymentVerifyRequest,
    current_user = Depends(get_current_user), 
    db = Depends(get_db)
):
    print(f"DEBUG: Verifying Razorpay payment for {current_user['email']}")
    
    if not request.biometric_verified:
        raise HTTPException(status_code=403, detail="Biometric verification required")
        
    is_valid = razorpay_service.verify_payment(
        request.razorpay_payment_id,
        request.razorpay_order_id,
        request.razorpay_signature
    )
    
    if is_valid:
        await db.payments.update_one(
            {"razorpay_order_id": request.razorpay_order_id},
            {"$set": {
                "payment_status": "completed",
                "razorpay_payment_id": request.razorpay_payment_id
            }}
        )
        return {"message": "Payment successful"}
    else:
        await db.payments.update_one(
            {"razorpay_order_id": request.razorpay_order_id},
            {"$set": {"payment_status": "failed"}}
        )
        raise HTTPException(status_code=400, detail="Payment verification failed")
