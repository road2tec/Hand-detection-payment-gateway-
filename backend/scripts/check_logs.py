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

async def analyze_logs():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client.hand_biometrics_db
    
    print("\n" + "="*50)
    print("🔐 --- SENIOR SECURITY AUDIT LOGS ---")
    cursor = db.verification_logs.find().sort("timestamp", -1).limit(10)
    async for log in cursor:
        status_icon = "✅" if log.get('status') == "success" else "❌"
        print(f"{status_icon} Time: {log.get('timestamp')}")
        print(f"   User:    {log.get('user_email')}")
        print(f"   Cosine:  {log.get('score', 'N/A')}")
        print(f"   Avg Z:   {log.get('avg_z', 'N/A')}")
        print(f"   Outliers: {log.get('outliers', 'N/A')}")
        print(f"   Amount:  ₹{log.get('amount', '0')}")
        print("-" * 40)

if __name__ == "__main__":
    asyncio.run(analyze_logs())
