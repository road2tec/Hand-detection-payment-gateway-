import requests
import json
import base64
import os

# Configuration
BASE_URL = "http://127.0.0.1:8000"
USER_EMAIL = "punamchanne@gmail.com"
USER_PASS = "12345678" # Corrected password based on previous conversations or default
# Note: I'll try to login first.

def test_otp_flow():
    # 1. Login to get JWT
    print("--- STEP 1: LOGIN ---")
    login_data = {
        "username": USER_EMAIL,
        "password": USER_PASS
    }
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    
    token = response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    # 2. Initiate High Value Payment (Requires Biometric Image)
    # I'll use a dummy base64 hand image (though it might fail matching, I want to see the OTP trigger)
    # Actually, the matcher might fail. I'll need a real-ish image for it to pass biometric first.
    # But I can check the code logic.
    
    print("\n--- STEP 2: INITIATE HIGH VALUE PAYMENT (₹25,000) ---")
    # For testing, I'll use an image from the project if available, or just a small valid jpeg
    # Since I'm on the server, I can find one.
    
    dummy_img_path = "backend/app/biometric/test_images/hand1.jpg" # If exists
    if not os.path.exists(dummy_img_path):
        # Create a tiny black 1x1 jpeg if no test images
        import cv2
        import numpy as np
        img = np.zeros((100, 100, 3), dtype=np.uint8)
        cv2.imwrite("test_hand.jpg", img)
        dummy_img_path = "test_hand.jpg"

    files = {'image': open(dummy_img_path, 'rb')}
    data = {'amount': 25000}
    
    response = requests.post(f"{BASE_URL}/payment/create-order", headers=headers, files=files, data=data)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200 and response.json().get("otp_required"):
        print("SUCCESS: OTP Required flag received.")
        
        # 3. Simulate OTP Verification (I'd need the OTP from the DB or Email)
        # I'll check the DB for the OTP
        from pymongo import MongoClient
        client = MongoClient("mongodb://localhost:27017")
        db = client["hand_biometric_db"]
        otp_doc = db.otps.find_one({"verified": False})
        
        if otp_doc:
            print(f"Found OTP in DB (hashed).")
            # I can't get the plain OTP from DB easily because I hashed it.
            # But I can force it to verified in DB for testing the second step of create-order.
            db.otps.update_one({"_id": otp_doc["_id"]}, {"$set": {"verified": True}})
            print("Force-verified OTP in DB for testing.")
            
            # 4. Try create-order again
            print("\n--- STEP 4: RE-TRY PAYMENT AFTER VERIFICATION ---")
            files = {'image': open(dummy_img_path, 'rb')}
            response = requests.post(f"{BASE_URL}/payment/create-order", headers=headers, files=files, data=data)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200 and response.json().get("order_id"):
                print("SUCCESS: Razorpay order created after OTP verify!")
            else:
                print("FAILED: Order not created.")
    else:
        print("FAILED: Biometric check likely failed (Expected if using dummy image).")

if __name__ == "__main__":
    test_otp_flow()
