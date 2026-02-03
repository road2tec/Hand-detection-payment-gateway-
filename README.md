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
*   **Backend**: FastAPI (Async Python), MongoDB (Motor), MediaPipe (Hand Detection), PyTorch (CNN Features).
*   **Services**: Razorpay (Payment Gateway), Gmail SMTP (OTP Delivery).

---

## ⚙️ Installation & Setup

### 1. Requirements
*   Python 3.10+
*   Node.js 18+
*   MongoDB Atlas (or local)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Activate venv: venv\Scripts\activate
pip install -r requirements.txt
python seed_admin.py  # Create default high-security admin
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Environment Configuration (`.env`)
```env
MONGODB_URL=your_mongodb_connection_string
SECRET_KEY=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
EMAIL_USER=your_smtp_email
EMAIL_PASS=your_smtp_app_password
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

## 🏆 Default Admin Credentials
*   **Email**: `admin@biometricpay.com`
*   **Password**: `admin123`
*   **PIN**: `1234`
