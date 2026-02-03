import asyncio
import sys
import os
from datetime import datetime

# Add project root to path
sys.path.append(os.getcwd())

from backend.app.database.mongo import db
from backend.app.utils.security import get_password_hash

async def seed_admin():
    print("🚀 Seeding Default Admin User...")
    
    admin_email = "admin@biometricpay.com"
    
    # Check if admin exists
    existing = await db.users.find_one({"email": admin_email})
    
    if existing:
        print(f"⚠️  Admin {admin_email} already exists. Updating to ensure is_admin=True...")
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"is_admin": True}}
        )
    else:
        admin_user = {
            "name": "System Admin",
            "email": admin_email,
            "password_hash": get_password_hash("admin123"),
            "hashed_pin": get_password_hash("1234"),
            "is_admin": True,
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(admin_user)
        print(f"✅ Created Default Admin: {admin_email}")

    print("\n--- ADMIN CREDENTIALS ---")
    print(f"Email: {admin_email}")
    print("Password: admin123")
    print("Security PIN: 1234")
    print("-------------------------\n")

if __name__ == "__main__":
    asyncio.run(seed_admin())
