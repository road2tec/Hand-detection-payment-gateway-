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

router = APIRouter(prefix="/payment", tags=["payment"])
razorpay_service = RazorpayService()
detector = HandDetector(mode=True)

class PaymentVerifyRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    biometric_verified: bool

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

    # 4. Create Razorpay Order only after verification
    order = razorpay_service.create_order(amount)
    if order is None:
        raise HTTPException(status_code=500, detail="Failed to create Razorpay order")

    # 5. Save pending order
    payment_data = {
        "user_id": str(current_user["_id"]),
        "amount": amount,
        "razorpay_order_id": order["id"],
        "payment_status": "pending",
        "biometric_verified": True,
        "created_at": ObjectId().generation_time
    }
    await db.payments.insert_one(payment_data)
    
    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": os.getenv("RAZORPAY_KEY_ID")
    }

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
