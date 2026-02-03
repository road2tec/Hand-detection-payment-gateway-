from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm
from backend.app.database.mongo import get_db
from backend.app.models.user_model import UserCreate, UserResponse, UserInDB
from backend.app.utils.security import get_password_hash, verify_password, create_access_token, encrypt_template
from backend.app.biometric.hand_detector import HandDetector
from backend.app.biometric.feature_extractor import FeatureExtractor
import numpy as np
import cv2
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["auth"])
detector = HandDetector(mode=True)
extractor = FeatureExtractor() # Initialize global instance (loads model)

@router.post("/secure-register")
async def secure_register(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    pin: str = Form(...),
    images: list[UploadFile] = File(...),
    db = Depends(get_db)
):
    try:
        print(f"DEBUG: secure_register called for {email}. Images received: {len(images)}")
        
        # 1. Check if user exists
        existing_user = await db.users.find_one({"email": email})
        if existing_user:
            print(f"DEBUG: Email {email} already exists.")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # 2. Extract Biometric Features FIRST (Validate before creating user)
        if len(images) < 5:
            print(f"DEBUG: Insufficient images. Got {len(images)}, need 5.")
            raise HTTPException(status_code=400, detail="Minimum 5 hand images required for high-security enrollment")
            
        feature_vectors = []
        cnn_feature_vectors = []
        hand_types = [] 
        for i, image in enumerate(images):
            contents = await image.read()
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None: 
                print(f"DEBUG: Image {i} failed to decode.")
                continue

            # Quality Check
            is_good, issues = detector.check_image_quality(img)
            if not is_good:
                print(f"DEBUG: Image {i} rejected due to quality: {issues}")
                continue
            
            detector.find_hands(img)
            landmarks, h_type = detector.find_position(img) 
            
            if landmarks and h_type: 
                # Geometric Features
                features = FeatureExtractor.extract_features(landmarks)
                
                # CNN Features (Deep Feature Extraction)
                cnn_feat = extractor.extract_cnn_features(img)
                
                if features and cnn_feat:
                    feature_vectors.append(features)
                    cnn_feature_vectors.append(cnn_feat)
                    hand_types.append(h_type)
                    print(f"DEBUG: Image {i} -> OK ({h_type}) | CNN: {len(cnn_feat)} dims")
                else:
                    print(f"DEBUG: Image {i} -> Feature extraction failed.")
            else:
                print(f"DEBUG: Image {i} -> No hand/landmarks detected.")
                
        print(f"DEBUG: Final samples: {len(feature_vectors)}. Hand Types: {hand_types}")
        
        if len(feature_vectors) < 5:
            # Get specific counts for why it failed
            raise HTTPException(status_code=422, detail=f"Extracted {len(feature_vectors)}/5 samples. Please ensure your hand is fully visible, fingers are spread, and lighting is good.")

        # Ensure all samples are of the same hand type
        if len(set(hand_types)) > 1:
            print(f"DEBUG: Inconsistent hand types: {set(hand_types)}")
            raise HTTPException(status_code=400, detail="Inconsistent hand types detected. Please use ONLY one hand (Left or Right) for all 5 samples.")

        # 3. Create User
        user_dict = {
            "name": name,
            "email": email,
            "password_hash": get_password_hash(password),
            "hashed_pin": get_password_hash(pin),
            "created_at": datetime.utcnow()
        }
        
        result = await db.users.insert_one(user_dict)
        user_id = str(result.inserted_id)
        
        # 4. Store Biometrics linked to this User ID
        await db.biometrics.insert_one({
            "user_id": user_id,
            "feature_vectors": encrypt_template(feature_vectors), # AES-256 Encrypted
            "cnn_features": encrypt_template(cnn_feature_vectors), # AES-256 Encrypted
            "hand_type": hand_types[0],
            "created_at": datetime.utcnow()
        })
        
        return {"message": "User and biometrics registered successfully", "user_id": user_id}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Secure Registration Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate, db = Depends(get_db)):
    try:
        existing_user = await db.users.find_one({"email": user_in.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user_dict = user_in.model_dump() # Pydantic V2
        password = user_dict.pop("password")
        pin = user_dict.pop("pin", None)
        user_dict["password_hash"] = get_password_hash(password)
        if pin:
            user_dict["hashed_pin"] = get_password_hash(pin)
        user_dict["created_at"] = datetime.utcnow()
        
        result = await db.users.insert_one(user_dict)
        user_dict["id"] = str(result.inserted_id)
        return user_dict
    except Exception as e:
        print(f"Registration Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user["email"]})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user": {
            "id": str(user["_id"]), 
            "name": user["name"], 
            "email": user["email"],
            "is_admin": user.get("is_admin", False)
        }
    }
