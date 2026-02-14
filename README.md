# Secure Biometric Payment System (Hand Geometry & CNN Fusion) 🦾🏦

## 🚀 Project Overview
This is a production-grade biometric authentication system designed to secure high-value financial transactions. It utilizes a **Hybrid Scoring Engine** (combining Geometric Skeletal Analysis with Deep Learning CNNs) to provide military-grade security. The system features a **3-Tier Risk-Based Authentication** model, ensuring that as transaction value increases, security protocols tighten dynamically.

---

## 🔑 Key Features

### 1. **Bio-Fuse Hybrid Engine**
*   **Geometric Skeletal Analysis (70%)**: Extracts 51-point vectors (finger lengths, thicknesses, and joint ratios) via MediaPipe.
*   **Deep Texture Embedding (30%)**: Uses a **MobileNetV2 CNN** to extract 1280-dimensional textural and spatial embeddings of the palm.
*   **High-Security Thresholds**: Calibrated at **95% similarity** to prevent "False Acceptance" while maintaining user reliability.

### 2. **3-Tier Risk-Based Authentication (MFA)**
*   **Tier 1 (< ₹2,000)**: **Palm Biometric Only**. Fast, secure checkout for everyday small payments.
*   **Tier 2 (₹2,000 - ₹10,000)**: **Biometric + Secure PIN**. Requires a secondary 6-digit security PIN for medium-risk transactions.
*   **Tier 3 (> ₹10,000)**: **Biometric + Email OTP**. Maximum security protocol sending a transient 6-digit code to the user's verified identity node (Email).

### 3. **Premium Executive Dashboards**
*   **User Command Center**: Includes a **3D Biometric HUD**, transaction history with data masking, and a **Verified Node Registry** for quick payments.
*   **Admin Monitoring Suite**: Real-time audit trails showing biometric match scores, success rates, and security incident alerts.

### 4. **Bank-Grade Data Privacy**
*   **Financial Redaction**: Bank account numbers and sensitive emails are masked (e.g., `****4455`) throughout the UI.
*   **Encrypted Templates**: Biometric signatures are encrypted using **AES-256** before being stored in the database.

---

## 🛠️ Technology Stack
*   **Frontend**: React.js, Framer Motion (HUD Animations), Lucide Icons, Tailwind CSS.
*   **Backend**: FastAPI (Async Python), MongoDB (Local + Compass), MediaPipe (Hand Detection), PyTorch (CNN Features).
*   **Services**: Razorpay (Payment Gateway), Gmail SMTP (OTP Delivery).

---

## ⚙️ Installation & Setup

### 1. Requirements
*   Python 3.10+
*   Node.js 18+
*   **MongoDB Compass & Community Server** (Required for Database)

### 2. Database Setup (MongoDB Compass)
1.  Download & Install **MongoDB Community Server** from [mongodb.com](https://www.mongodb.com/try/download/community).
2.  Install **MongoDB Compass** (GUI).
3.  Open Compass and connect to: `mongodb://localhost:27017`
4.  Create a new database named: `hand_biometrics_db`

### 3. Backend Setup
```bash
cd backend
python -m venv venv
# Activate venv:
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt

# Initial Admin Setup
python seed_admin.py

# 🚀 START BACKEND SERVER
python -m uvicorn backend.app.main:app --port 8000 --reload
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 5. Environment Configuration (`.env`)
Create a `.env` file in the root directory:
```env
# Local MongoDB Connection
MONGODB_URL=mongodb://localhost:27017/hand_biometrics_db

# Security & Secrets
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Razorpay (Test Mode)
RAZORPAY_KEY_ID=rzp_test_RzISTxVyZ1l3Pr
RAZORPAY_KEY_SECRET=eIco6L2xvGHf2H32RuKhG20G

# Email (SMTP)
EMAIL_USER=secure.transaction.pay@gmail.com
EMAIL_PASS=sixkghdmihsooiwv
```

---

## 📂 Project Structure Breakdown

### **Backend (`/backend`)**
*   `app/biometric/`: The core brain containing `matcher.py` (Hybrid Logic) and `hand_detector.py`.
*   `app/payment/`: Manages Razorpay orders and Tiered MFA (PIN/OTP) logic.
*   `app/admin/`: Security monitoring routes and transaction audit logging.
*   `scripts/`: Utility tools like `wipe_all_data.py` for database sanitization.

### **Frontend (`/frontend`)**
*   `src/components/PaymentModal.jsx`: The 5-step interactive payment wizard.
*   `src/pages/Dashboard.jsx`: The premium user interface with 3D HUD visuals.
*   `src/services/api.js`: All authenticated service calls to the backend.

---

## 🎓 Viva & Evaluation Quick-Reference

*   **How does the system distinguish different hands?**
    It calculates the ratios of 51 distinct skeletal points. Even if two hands have similar lengths, the "joint-to-wrist" ratio and "inter-finger angles" are unique to every individual.
*   **Why use a Hybrid (CNN + Geometry) model?**
    Geometry measures bone structure, while CNN measures texture. A spoof (like a prosthetic hand) might match geometry but will fail the CNN texture analysis.
*   **What happens if the scan is poor?**
    The system includes **Intelligent Diagnostics**. It warns the user if lighting is too low, the hand is too far, or the image is blurry, preventing unnecessary re-registrations.

---

## 🏆 Default Admin Credentials
*   **Email**: `admin@biometricpay.com`
*   **Password**: `admin123`
*   **PIN**: `1234`
