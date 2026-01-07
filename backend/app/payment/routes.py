from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from backend.app.database.mongo import get_db
from backend.app.payment.razorpay_service import RazorpayService
from backend.app.auth.utils import get_current_user
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

class PaymentVerifyRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    biometric_verified: bool

class OTPVerifyRequest(BaseModel):
    otp: str
    amount: float

@router.post("/create-order")
async def create_secure_order(
    image: UploadFile = File(...),
    amount: float = Form(...),
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

    # 3. Biometric Verification
    detector.find_hands(img)
    landmarks, h_type = detector.find_position(img) # Unpack hand type
    
    if not landmarks:
        raise HTTPException(status_code=422, detail="Hand not detected")
        
    new_vector = FeatureExtractor.extract_features(landmarks)
    
    # Strictly Enforce Identity Logic (Enrolled Type vs Current Type)
    match_result, scores = Matcher.verify(
        new_vector, 
        biometric_data["feature_vectors"],
        current_hand_type=h_type,
        enrolled_hand_type=biometric_data.get("hand_type")
    )
    
    # Log verification attempt
    log_data = {
        "user_id": str(current_user["_id"]),
        "user_email": current_user["email"],
        "type": "payment_auth",
        "status": match_result["status"],
        "score": match_result.get("confidence_score", 0.0),
        "amount": amount,
        "timestamp": ObjectId().generation_time
    }
    await db.verification_logs.insert_one(log_data)

    if match_result == "re-register":
        raise HTTPException(status_code=400, detail="Security update: Biometric profile outdated. Please re-register.")
    
    if match_result["status"] != "VERIFIED":
        # Return strict failure response
        raise HTTPException(
            status_code=401, 
            detail={
                "status": match_result["status"],
                "reason": match_result["reason"],
                "confidence_score": match_result["confidence_score"]
            }
        )

    # 4. High-Value Payment Gate (OTP)
    if amount >= 20000:
        # Check if an OTP was recently verified for this user and amount
        # We look for a verified OTP record created in the last 10 minutes
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
            # OTP is verified, mark it as used so it can't be reused for another order
            await db.otps.update_one({"_id": verified_otp["_id"]}, {"$set": {"used": True}})

    # 5. Create Razorpay Order only after verification (Biometric + OTP if needed)
    order = razorpay_service.create_order(amount)
    if order is None:
        raise HTTPException(status_code=500, detail="Failed to create Razorpay order")

    # 6. Save pending order
    payment_data = {
        "user_id": str(current_user["_id"]),
        "amount": amount,
        "razorpay_order_id": order["id"],
        "payment_status": "pending",
        "biometric_verified": True,
        "otp_verified": True if amount >= 20000 else False,
        "created_at": ObjectId().generation_time
    }
    await db.payments.insert_one(payment_data)
    
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
