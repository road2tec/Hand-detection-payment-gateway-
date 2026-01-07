from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.auth.routes import router as auth_router
from backend.app.biometric.routes import router as biometric_router
from backend.app.payment.routes import router as payment_router
from backend.app.dashboard.routes import router as dashboard_router

app = FastAPI(title="Secure Biometric Payment API")

# Add CORS middleware - MUST be before route includes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(biometric_router)
app.include_router(payment_router)
app.include_router(dashboard_router)

@app.get("/")
async def root():
    return {"message": "Secure Biometric Payment API is running"}
