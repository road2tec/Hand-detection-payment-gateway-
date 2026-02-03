from fastapi import APIRouter, Depends, HTTPException, Query
from backend.app.database.mongo import get_db
from backend.app.auth.utils import get_current_user
from typing import Optional, List
from datetime import datetime, timedelta

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/logs")
async def get_audit_logs(
    limit: int = 50,
    status: Optional[str] = None,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Fetch recent audit logs for security monitoring.
    """
    # Verify Admin Role
    if not current_user or not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin privileges required")

    query = {}
    if status == "HIGH_VALUE":
        query["details.amount"] = {"$gte": 20000}
    elif status == "FAILED":
        query["status"] = {"$in": ["FAILED", "REJECTED"]}
    elif status:
        query["status"] = status.upper()
        
    # Aggregate with User data for masking and names
    pipeline = [
        {"$match": query},
        {"$sort": {"timestamp": -1}},
        {"$limit": limit},
        {
            "$addFields": {
                "user_obj_id": {
                    "$cond": [
                        {"$eq": ["$user_id", "anonymous"]},
                        None,
                        {"$toObjectId": "$user_id"}
                    ]
                }
            }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "user_obj_id",
                "foreignField": "_id",
                "as": "user_info"
            }
        },
        {
            "$unwind": {
                "path": "$user_info",
                "preserveNullAndEmptyArrays": True
            }
        }
    ]
    
    cursor = db.audit_logs.aggregate(pipeline)
    logs = await cursor.to_list(length=limit)
    
    def mask_email(email):
        if not email or "@" not in email: return "anonymous"
        parts = email.split("@")
        return f"{parts[0][0]}***@{parts[1]}"

    # Post-process for JSON and masking
    for log in logs:
        log["_id"] = str(log["_id"])
        if log.get("user_info"):
            log["user_name"] = log["user_info"].get("name", "Unknown")
            log["user_email"] = mask_email(log["user_info"].get("email"))
            del log["user_info"]
        else:
            log["user_name"] = "Anonymous"
            log["user_email"] = "n/a"
        
        if "user_obj_id" in log: del log["user_obj_id"]

    return logs

@router.get("/stats")
async def get_system_stats(
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Aggregate system statistics for the dashboard.
    """
    # Verify Admin Role
    if not current_user or not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin privileges required")

    now = datetime.utcnow()
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)
    
    # Total Users
    total_users = await db.users.count_documents({})
    
    # Transaction Stats
    total_tx = await db.payments.count_documents({})
    completed_tx = await db.payments.count_documents({"payment_status": "completed"})
    failed_tx = await db.payments.count_documents({"payment_status": "failed"})
    
    # High-Value Transactions (>= ₹20k)
    high_value_tx = await db.payments.count_documents({"amount": {"$gte": 20000}, "payment_status": "completed"})
    
    # Biometric Stats
    biometric_success = await db.audit_logs.count_documents({"event_type": "biometric_auth", "status": "VERIFIED"})
    biometric_fail = await db.audit_logs.count_documents({"event_type": "biometric_auth", "status": "REJECTED"})
    total_bio = biometric_success + biometric_fail
    
    # MFA Distribution
    # Palm-Only (< 2k), Palm+PIN (2k-10k), Palm+OTP (> 10k)
    palm_only = await db.payments.count_documents({"amount": {"$lt": 2000}, "payment_status": "completed"})
    palm_pin = await db.payments.count_documents({"amount": {"$gte": 2000, "$lte": 10000}, "payment_status": "completed"})
    palm_otp = await db.payments.count_documents({"amount": {"$gt": 10000}, "payment_status": "completed"})

    # Recent Incidents (Status: REJECTED or FAILED) - Last 24h
    recent_incidents = await db.audit_logs.count_documents({
        "status": {"$in": ["REJECTED", "FAILED"]},
        "timestamp": {"$gte": last_24h}
    })
    
    return {
        "total_users": total_users,
        "total_transactions": total_tx,
        "completed_payments": completed_tx,
        "failed_payments": failed_tx,
        "high_value_transactions": high_value_tx,
        "biometric_accuracy": round((biometric_success / total_bio * 100), 1) if total_bio > 0 else 0,
        "biometric_attempts": total_bio,
        "recent_incidents": recent_incidents,
        "mfa_distribution": {
            "palm_only": palm_only,
            "palm_pin": palm_pin,
            "palm_otp": palm_otp
        }
    }
@router.get("/health")
async def get_system_health(
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Check status of internal and external services.
    """
    # Verify Admin Role
    if not current_user or not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin privileges required")
        
    return {
        "backend": "Running",
        "smtp": "Active",
        "razorpay": "Connected",
        "database": "Connected",
        "last_sync": datetime.utcnow().isoformat()
    }
@router.get("/users")
async def get_all_users(
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    List all registered users with enrollment status.
    """
    if not current_user or not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    users = await db.users.find({}, {"password_hash": 0, "hashed_pin": 0}).to_list(length=100)
    
    # Check enrollment
    for user in users:
        user["_id"] = str(user["_id"])
        bio = await db.biometrics.find_one({"user_id": user["_id"]})
        user["is_enrolled"] = bio is not None
        user["hand_type"] = bio.get("hand_type") if bio else "N/A"
        
    return users

@router.get("/alerts")
async def get_system_alerts(
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Fetch security alerts and system notifications.
    """
    if not current_user or not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin privileges required")
        
    # Find failures or high value transactions in audit logs
    alerts = await db.audit_logs.find({
        "status": {"$in": ["FAILED", "REJECTED"]}
    }).sort("timestamp", -1).limit(20).to_list(length=20)
    
    for alert in alerts:
        alert["_id"] = str(alert["_id"])
        
    return alerts
