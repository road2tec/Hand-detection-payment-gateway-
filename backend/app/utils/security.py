from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
import os
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- BIOMETRIC TEMPLATE ENCRYPTION ---
from cryptography.fernet import Fernet
import base64
import hashlib
import json

# Derive a 32-byte Fernet-compatible key from the SECRET_KEY
_encryption_key = base64.urlsafe_b64encode(hashlib.sha256(SECRET_KEY.encode()).digest())
_cipher_suite = Fernet(_encryption_key)

def encrypt_template(data: list) -> str:
    """Encrypts a list of features (floats) to a secure string."""
    json_str = json.dumps(data)
    encrypted_bytes = _cipher_suite.encrypt(json_str.encode())
    return encrypted_bytes.decode()

def decrypt_template(token: str) -> list:
    """Decrypts a secure string back to a list of features."""
    if not token: return []
    try:
        decrypted_bytes = _cipher_suite.decrypt(token.encode())
        return json.loads(decrypted_bytes.decode())
    except Exception as e:
        print(f"Decryption Error: {e}")
        return []

def mask_account_number(account_number: str) -> str:
    """Masks a bank account number, keeping only last 4 digits."""
    if not account_number or len(account_number) < 4:
        return "********"
    visible_digits = account_number[-4:]
    return "*" * (len(account_number) - 4) + visible_digits
