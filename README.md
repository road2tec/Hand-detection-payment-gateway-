# Secure Payment Authentication using Hand Geometry Biometrics

This project is a secure biometric payment system that uses hand geometry for authentication. It utilizes MediaPipe for hand landmark detection and Razorpay for payment processing.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Framer Motion
- **Backend**: FastAPI, JWT, MongoDB Atlas
- **ML/CV**: OpenCV, MediaPipe Hands
- **Payment**: Razorpay API

## Features
- User registration with biometric capture (3-5 hand images).
- Secure JWT-based authentication.
- Hand geometry feature extraction (finger lengths, inter-finger distances, etc.).
- Biometric verification before payment.
- Razorpay integration for transactions.

## Setup Instructions

### Backend
1. Create a virtual environment: `python -m venv venv`
2. Activate it: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
3. Install dependencies: `pip install -r requirements.txt`
4. Configure `.env` with your MongoDB and Razorpay credentials.
5. Run the server: `uvicorn backend.app.main:app --reload`

### Frontend
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Add Tailwind CSS: `npm install -D tailwindcss postcss autoprefixer; npx tailwindcss init -p`
4. Run the development server: `npm run dev`

## Biometric Logic
- **Detection**: MediaPipe Hands detects 21 landmarks.
- **Extraction**: Calculates Euclidean distances between specific landmarks and scale-invariant ratios.
- **Verification**: Uses cosine similarity between the current scan and stored feature vectors.
