from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class PaymentBase(BaseModel):
    amount: float
    biometric_verified: bool = False
    payment_status: str = "pending"
    transaction_id: Optional[str] = None

class PaymentCreate(PaymentBase):
    user_id: str

class PaymentInDB(PaymentBase):
    id: str = Field(alias="_id")
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True
    }
