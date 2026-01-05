import hashlib
import sys
from pathlib import Path

# Add project root to path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(root_dir))

from backend.app.utils.security import get_password_hash, verify_password

password = "A" * 100 # Very long password
print(f"Original Password length: {len(password)}")

hashed = get_password_hash(password)
print(f"Hashed length: {len(hashed)}")

match = verify_password(password, hashed)
print(f"Matches: {match}")

# Second test with complex characters
password = "🔥" * 50
print(f"Original complex Password length: {len(password)}")
hashed = get_password_hash(password)
match = verify_password(password, hashed)
print(f"Complex Matches: {match}")
