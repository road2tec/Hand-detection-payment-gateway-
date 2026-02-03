from datetime import datetime
from bson import ObjectId

class AuditLogger:
    @staticmethod
    async def log_event(db, user_id, event_type, status, details=None, context=None):
        """
        Log security and transaction events for audit trail.
        
        Args:
            db: Database connection name
            user_id: ID of the user (or None if anonymous)
            event_type: Category (e.g., "biometric_auth", "payment", "mfa")
            status: "SUCCESS", "FAILED", "WARNING"
            details: Dictionary containing error messages, scores, or transaction IDs
            context: Additional context like IP address or Device info (optional)
        """
        try:
            log_entry = {
                "user_id": str(user_id) if user_id else "anonymous",
                "event_type": event_type,
                "status": status,
                "details": details or {},
                "context": context or {},
                "timestamp": datetime.utcnow()
            }
            
            await db.audit_logs.insert_one(log_entry)
            print(f"[AUDIT] {event_type} - {status}: {details}")
            
        except Exception as e:
            print(f"FAILED TO WRITE AUDIT LOG: {e}")
