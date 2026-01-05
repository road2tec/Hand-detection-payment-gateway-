import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add project root to path for robust imports
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(root_dir))

load_dotenv(root_dir / ".env")

async def clear_database():
    print("\n" + "!"*50)
    print("⚠️  DATABASE CLEANUP UTILITY  ⚠️")
    print("!"*50)
    print("\nThis will DELETE all records from:")
    print("- Users Collection")
    print("- Biometrics Collection")
    print("- Verification Logs")
    print("\nThis does NOT affect your code, only the data in MongoDB.")
    
    confirm = input("\nAre you absolutely sure you want to proceed? (type 'yes' to confirm): ")
    
    if confirm.lower() != 'yes':
        print("\n❌ Operation cancelled. No data was deleted.")
        return

    try:
        client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
        db = client.hand_biometrics_db
        
        # Define collections to clear
        collections = ['users', 'biometrics', 'verification_logs']
        
        for coll in collections:
            count = await db[coll].count_documents({})
            if count > 0:
                result = await db[coll].delete_many({})
                print(f"✅ Cleared {result.deleted_count} records from '{coll}'")
            else:
                print(f"ℹ️  Collection '{coll}' is already empty.")

        print("\n✨ Database cleared successfully. You can now start fresh registrations.")
        
    except Exception as e:
        print(f"\n❌ Error connecting to database: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(clear_database())
