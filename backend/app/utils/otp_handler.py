import secrets
import string
from passlib.context import CryptContext

otp_context = CryptContext(schemes=["argon2"], deprecated="auto")

def generate_otp(length: int = 6) -> str:
    """Generate a cryptographically secure numeric OTP."""
    digits = string.digits
    return "".join(secrets.choice(digits) for _ in range(length))

def hash_otp(otp: str) -> str:
    """Hash the OTP using Argon2."""
    return otp_context.hash(otp)

def verify_otp_hash(plain_otp: str, hashed_otp: str) -> bool:
    """Verify the plain OTP against the hashed version."""
    return otp_context.verify(plain_otp, hashed_otp)
