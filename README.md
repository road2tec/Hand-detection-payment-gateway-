# 🛡️ BiometricPay: Secure Hand Geometry Payment System

![Security V2](https://img.shields.io/badge/Security-V2.0-blueviolet?style=for-the-badge&logo=shield)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-2024-61DAFB?style=for-the-badge&logo=react)

**BiometricPay** is a high-security biometric authentication and payment gateway that replaces traditional PINs and passwords with a "Digital Twin" of your hand. Using advanced computer vision and skeletal landmarking, it authorizes transactions only when your unique hand geometry is verified.

---

## 🔥 Key Features

- **Skeletal Mapping**: High-fidelity detection of 21 unique hand landmarks using MediaPipe.
- **Triple-Gate Security**: Multi-layered verification process (Hand Type + Geometry + Variance).
- **Zero-Trust Payment Flow**: Razorpay orders are only created *after* successful biometric validation.
- **Premium Dashboard**: Real-time analytics, biometric telemetry, and interactive transaction history.
- **Scale-Invariant Extraction**: Recognizes your hand regardless of distance or camera resolution.
- **Anti-Spoofing Engine**: Statistical Z-Score analysis to detect and reject static image replicas.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | FastAPI (High-Performance Async), JWT, Python |
| **Biometric Engine** | MediaPipe, OpenCV, NumPy |
| **AI/Similarity** | Scikit-learn (Cosine Similarity), Z-Score Variance |
| **Database** | MongoDB Atlas (NoSQL) |
| **Payments** | Razorpay Gateway |

---

## 🚀 Setup & Installation

### 1. Backend Configuration
```bash
# Clone and navigate
cd backend

# Create & activate environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install core dependencies
pip install -r requirements.txt

# Run server from PROJECT ROOT
cd ..
python -m uvicorn backend.app.main:app --reload
```

### 2. Frontend Configuration
```bash
cd frontend
npm install
npm run dev
```

### 3. Environment Variables (`.env`)
Create a `.env` file in the root with:
```env
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_secret_key
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

---

## 🔐 Advanced Security Logic

The engine uses a **Triple-Gate** check for every transaction:

1.  **Gate 0 (Hand Verification)**: Identifies if you are using your registered Left or Right hand.
2.  **Gate 1 (Similarity)**: Uses Cosine Similarity to compare your live 51-dimension vector against your 5 enrolled templates (Requires >94% match).
3.  **Gate 2 (Variance)**: Measures the statistical deviation of your hand landmarks to ensure a "living" human match (Z-Score < 1.8).

---

## 📂 Project Organization

```text
├── backend/
│   ├── app/                # Core logic (Auth, Biometric, Payment)
│   └── scripts/            # 🛠️ Maintenance & Audit Tools
├── frontend/
│   ├── src/
│   │   ├── components/     # UI Components (PaymentModal, HandCapture)
│   │   ├── pages/          # Dashboard, Landing, Register
│   │   └── services/       # API Integration
├── .gitignore              # Protected environment secrets
└── README.md               # You are here
```

---

## 🛠️ Maintenance Tools
We've included a suite of tools for system administrators:
- `python backend/scripts/check_logs.py`: View security audit telemetry.
- `python backend/scripts/check_db_state.py`: Audit user and biometric counts.
- `python backend/scripts/clear_database.py`: Safe utility to reset user data.

---

**Developed with ❤️ for Advanced Secure Payments.**
