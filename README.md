# Secure Biometric Payment System (Hand Geometry & CNN Fusion)

## 🚀 Project Overview
A production-grade biometric authentication system aimed at securing high-value transactions. This project implements a **Hybrid Scoring Engine** (Geometric + Deep Learning), **Risk-Based Multi-Factor Authentication (M MFA)**, and a **Military-Grade Audit Trail**.

It is designed to simulate a bank-grade environment where security scales with transaction risk, featuring a sleek, immersive "Command Interface" UI.

---

## 🔑 Key Features

1.  **Hybrid Biometric Engine (Bio-Fuse Layer)**:
    *   **Geometric Analysis (70%)**: Extracts 51-point skeletal vectors (finger lengths, joint ratios) using MediaPipe.
    *   **Deep Feature Extraction (30%)**: Uses **MobileNetV2 (CNN)** to extract 1280-dimensional textural/spatial embeddings.
    *   **Intelligent Diagnostics**: Provides real-time feedback (Lighting, Distance, Blur) to ensure high-fidelity scans.

2.  **5-Step Secure Payment Wizard**:
    *   **Step 1: Recipient Verification**: Validation of name, account number, and IFSC.
    *   **Step 2: Value Definition**: Dynamic amount entry with tiered security alerts.
    *   **Step 3: Protocol Review**: Immersive summary of the transaction commitment.
    *   **Step 4: Biometric/OTP Auth**: Multi-layered authentication based on risk.
    *   **Step 5: Digital Receipt**: Instant finalization with secure tracking IDs.

3.  **Risk-Based Authentication (Dynamic Security)**:
    *   **Tier 1 (< ₹2,000)**: Biometric Only (Fast Path).
    *   **Tier 2 (₹2,000 - ₹10,000)**: Biometric + **PIN Verification**.
    *   **Tier 3 (> ₹10,000)**: Biometric + **Email OTP** (Maximum Security).

4.  **Bank-Grade Security & Privacy**:
    *   **Data Masking**: Strict masking of bank accounts and emails (e.g., ****4455) for all administrative views.
    *   **AES-256 Encryption**: Biometric templates are encrypted at rest.
    *   **Argon2 Hashing**: Passwords and PINs use memory-hard hashing.

5.  **Admin Command Center**:
    *   **Live Transaction Monitor**: Real-time audit of all successful and filtered attempts.
    *   **Biometric Pulse**: Visual metrics for matching accuracy and incident rates.
    *   **Identity Registry**: Management of verified biometric nodes.

---

## 🛠️ Technology Stack
*   **Frontend**: React.js, TailwindCSS (Vanilla Custom Tokens), Framer Motion (3D HUD), Electron.
*   **Backend**: FastAPI (Python), MongoDB (Motor Async), MediaPipe, PyTorch (CNN Extraction).
*   **Integration**: Razorpay (Payment Gateway), Gmail SMTP (Secure OTP Transmission).

---

## ⚙️ Setup Instructions

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Activate venv: venv\Scripts\activate (Windows)
pip install -r requirements.txt
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

**Environment Variables (.env)**:
```env
MONGODB_URL=mongodb://localhost:27017
SECRET_KEY=your_super_secret_key_change_this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
```

**Run Server**:
```bash
uvicorn app.main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📂 Project Structure
*   `backend/app/biometric`: Neural Core (Detector, Extractor, Matcher).
*   `backend/app/payment`: Financial Logic, Tiered MFA, and Razorpay Sync.
*   `backend/app/admin`: Security Monitoring and Masked Audit Routes.
*   `frontend/src/components`: UI Elements (PaymentModal, AutoHandCapture).
*   `frontend/src/pages`: Views (Immersive Dashboard, Admin Command Center).
