import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
import io
from pathlib import Path
from dotenv import load_dotenv

# Add project root to path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(root_dir))

# Fix for Windows console emoji issues
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv(root_dir / ".env")

async def check_db():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client.hand_biometrics_db
    
    users = await db.users.find().to_list(100)
    print(f"Total users: {len(users)}")
    user_ids = []
    for user in users:
        uid = str(user.get('_id'))
        email = user.get('email')
        user_ids.append(uid)
        print(f"User: {email} - ID: {uid}")
        
    biometrics = await db.biometrics.find().to_list(100)
    print(f"\nTotal biometric records: {len(biometrics)}")
    bio_uids = [b.get('user_id') for b in biometrics]
    
    for bio in biometrics:
        print(f"Bio found for user_id: {bio.get('user_id')} - Vectors: {len(bio.get('feature_vectors', []))}")

    print("\nUsers MISSING biometrics:")
    for uid in user_ids:
        if uid not in bio_uids:
            # Find email for this uid
            u = next((u for u in users if str(u['_id']) == uid), None)
            print(f"- {u['email']} ({uid})")

if __name__ == "__main__":
    asyncio.run(check_db())
