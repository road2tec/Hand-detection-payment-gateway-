from pydantic import BaseModel, Field
from datetime import datetime
from typing import List

class BiometricBase(BaseModel):
    user_id: str
    feature_vectors: List[List[float]]

class BiometricCreate(BiometricBase):
    pass

class BiometricInDB(BiometricBase):
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True
    }
