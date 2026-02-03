from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import cv2
import numpy as np
import base64
from backend.app.database.mongo import get_db
from backend.app.biometric.hand_detector import HandDetector
from backend.app.biometric.feature_extractor import FeatureExtractor
from backend.app.biometric.matcher import Matcher
from backend.app.auth.utils import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/biometric", tags=["biometric"])
detector = HandDetector(mode=True)

@router.post("/register-hand")
async def register_hand(images: list[UploadFile] = File(...), current_user = Depends(get_current_user), db = Depends(get_db)):
    if len(images) < 5:
        raise HTTPException(status_code=400, detail="Minimum 5 hand images required for high-security enrollment")
    
    vectors = []
    hand_types = []
    
    for image_file in images:
        contents = await image_file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            continue
            
        detector.find_hands(img)
        landmarks, h_type = detector.find_position(img)
        
        if landmarks and h_type:
            features = FeatureExtractor.extract_features(landmarks)
            if features:
                vectors.append(features)
                hand_types.append(h_type)
            
    if len(vectors) < 5:
        raise HTTPException(status_code=400, detail=f"Could not capture 5 valid hand samples. Landmarks detected in {len(vectors)} images.")

    if len(set(hand_types)) > 1:
        raise HTTPException(status_code=400, detail="Inconsistent hand types. Use only one hand for all samples (left or right).")
        
    await db.biometrics.update_one(
        {"user_id": str(current_user["_id"])},
        {"$set": {
            "feature_vectors": vectors,
            "hand_type": hand_types[0],
            "updated_at": ObjectId().generation_time
        }},
        upsert=True
    )
    
    return {"message": "Hand biometrics registered successfully"}

@router.post("/verify-hand")
async def verify_hand(
    image: UploadFile = File(...), 
    current_user = Depends(get_current_user), 
    db = Depends(get_db)
):
    try:
        print(f"DEBUG: Starting hand verification for user {current_user['email']}")
        
        # 1. Fetch biometric data
        biometric_data = await db.biometrics.find_one({"user_id": str(current_user["_id"])})
        if not biometric_data:
            print(f"DEBUG: No biometric data found for user {current_user['email']}")
            raise HTTPException(status_code=404, detail="Biometric profile not found. Please register your hand first.")

        # 2. Read and decode image
        contents = await image.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty image file received")
            
        print(f"DEBUG: Received image, size: {len(contents)} bytes")
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            print("DEBUG: OpenCV failed to decode image")
            raise HTTPException(status_code=400, detail="Invalid image format or corrupted file")

        # 3. Detect Landmarks
        try:
            detector.find_hands(img)
            landmarks, h_type = detector.find_position(img)
        except Exception as e:
            print(f"DEBUG: Hand detector crash: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal hand detection error")
        
        if not landmarks:
            print("DEBUG: No hand landmarks detected in image")
            raise HTTPException(status_code=422, detail="Hand not detected. Please ensure your hand is clearly visible.")
            
        print(f"DEBUG: Detected {len(landmarks)} landmarks")

        # 4. Extract and Match Features
        try:
            new_vector = FeatureExtractor.extract_features(landmarks)
            if not new_vector:
                 raise HTTPException(status_code=422, detail="Could not extract reliable biometric features.")
                 
            is_verified, score = Matcher.verify(new_vector, biometric_data["feature_vectors"])
            # Ensure native Python types for JSON serialization
            is_verified = bool(is_verified)
            score = float(score)
            
            # Log the verification attempt for the dashboard
            log_data = {
                "user_id": str(current_user["_id"]),
                "user_email": current_user["email"],
                "type": "biometric_verification",
                "status": "success" if is_verified else "failed",
                "score": score,
                "timestamp": ObjectId().generation_time
            }
            await db.verification_logs.insert_one(log_data)
            
            print(f"DEBUG: Verification Result: {is_verified} (Score: {score:.4f})")
            
            return {
                "verified": is_verified,
                "score": score,
                "message": "Verification successful" if is_verified else "Verification failed: Biometric mismatch"
            }
        except Exception as e:
            print(f"DEBUG: Matching error: {str(e)}")
            raise HTTPException(status_code=500, detail="Error during biometric comparison")

    except HTTPException as e:
        # Log the specific failure (e.g., Hand not detected)
        log_data = {
            "user_id": str(current_user["_id"]) if current_user else "anonymous",
            "user_email": current_user["email"] if current_user else "anonymous",
            "type": "biometric_verification",
            "status": "error",
            "detail": e.detail,
            "timestamp": ObjectId().generation_time
        }
        await db.verification_logs.insert_one(log_data)
        raise e
    except Exception as e:
        print(f"DEBUG: UNEXPECTED ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="A server-side error occurred during verification")
