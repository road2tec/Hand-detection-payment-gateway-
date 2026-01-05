from fastapi import APIRouter, Depends, HTTPException
from backend.app.database.mongo import get_db
from backend.app.auth.utils import get_current_user
from datetime import datetime, timedelta
from bson import ObjectId

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/metrics")
async def get_metrics(current_user = Depends(get_current_user), db = Depends(get_db)):
    # Total Users
    total_users = await db.users.count_documents({})
    
    # Total Payments
    successful_payments = await db.payments.count_documents({"payment_status": "completed"})
    
    # Total Amount
    pipeline = [
        {"$match": {"payment_status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    amount_cursor = db.payments.aggregate(pipeline)
    amount_result = await amount_cursor.to_list(length=1)
    total_amount = amount_result[0]["total"] if amount_result else 0
    
    # Biometric Stats Today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    verifications_today = await db.verification_logs.count_documents({
        "timestamp": {"$gte": today_start}
    })
    
    failed_attempts = await db.verification_logs.count_documents({
        "status": {"$in": ["failed", "error"]}
    })
    
    return {
        "totalUsers": total_users,
        "successfulPayments": successful_payments,
        "totalAmount": total_amount,
        "verificationsToday": verifications_today,
        "failedAttempts": failed_attempts
    }

@router.get("/activity-feed")
async def get_activity(current_user = Depends(get_current_user), db = Depends(get_db)):
    # Get latest 10 verification logs
    verification_cursor = db.verification_logs.find().sort("timestamp", -1).limit(10)
    verifications = await verification_cursor.to_list(length=10)
    
    # Get latest 10 payments
    payment_cursor = db.payments.find().sort("created_at", -1).limit(10)
    payments = await payment_cursor.to_list(length=10)
    
    feed = []
    
    for v in verifications:
        msg = f"Biometric {v['status']}"
        if 'detail' in v:
            msg += f": {v['detail']}"
        feed.append({
            "id": str(v["_id"]),
            "type": "biometric",
            "message": f"User {v['user_email']} - {msg}",
            "status": v["status"],
            "timestamp": v["timestamp"].isoformat()
        })
        
    for p in payments:
        user = await db.users.find_one({"_id": ObjectId(p["user_id"])})
        email = user["email"] if user else "Unknown"
        feed.append({
            "id": str(p["_id"]),
            "type": "payment",
            "message": f"Payment of ₹{p['amount']} by {email} {p['payment_status']}",
            "status": p["payment_status"],
            "timestamp": p["created_at"].isoformat()
        })
        
    # Sort by timestamp
    feed.sort(key=lambda x: x["timestamp"], reverse=True)
    return feed[:15]

@router.get("/payments")
async def get_payments(current_user = Depends(get_current_user), db = Depends(get_db)):
    cursor = db.payments.find().sort("created_at", -1).limit(20)
    payments = await cursor.to_list(length=20)
    
    result = []
    for p in payments:
        user = await db.users.find_one({"_id": ObjectId(p["user_id"])})
        result.append({
            "email": user["email"] if user else "Unknown",
            "amount": p["amount"],
            "biometric_verified": p.get("biometric_verified", False),
            "status": p["payment_status"],
            "timestamp": p["created_at"].isoformat()
        })
    return result

@router.get("/biometric-stats")
async def get_biometric_stats(current_user = Depends(get_current_user), db = Depends(get_db)):
    # Success vs Failure over last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    pipeline = [
        {"$match": {"timestamp": {"$gte": seven_days_ago}}},
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1}
        }}
    ]
    
    cursor = db.verification_logs.aggregate(pipeline)
    stats = await cursor.to_list(length=10)
    
    success = next((s["count"] for s in stats if s["_id"] == "success"), 0)
    failed = next((s["count"] for s in stats if s["_id"] == "failed"), 0)
    error = next((s["count"] for s in stats if s["_id"] == "error"), 0)
    
    total = success + failed + error
    accuracy = (success / total * 100) if total > 0 else 0
    
    return {
        "success": success,
        "failed": failed + error,
        "accuracy": round(accuracy, 2),
        "total": total
    }
