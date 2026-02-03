import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add project root to path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(root_dir))

load_dotenv(root_dir / ".env")

async def wipe_all_data():
    """
    Clears all collections in the database.
    This is used for final project resetting.
    """
    print("\n" + "="*50)
    print("🧹 MEGA CLEANUP: WIPING ALL DATABASE RECORDS")
    print("="*50)

    try:
        # Get DB name from URL or use default
        mongo_url = os.getenv("MONGODB_URL")
        client = AsyncIOMotorClient(mongo_url)
        db = client.hand_biometrics_db
            
        print(f"Target Database: {db.name}\n")
        
        collections = [
            'users', 
            'biometrics', 
            'verification_logs', 
            'audit_trail', 
            'otps', 
            'payments', 
            'pin_verifications'
        ]
        
        for coll in collections:
            count = await db[coll].count_documents({})
            if count > 0:
                result = await db[coll].delete_many({})
                print(f"✅ DELETED {result.deleted_count} records from '{coll}'")
            else:
                print(f"➖ Collection '{coll}' is already empty.")

        print("\n✨ ALL DATA WIPED CLEAN.")
        print("⚠️  You must run 'python seed_admin.py' to restore access.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(wipe_all_data())
