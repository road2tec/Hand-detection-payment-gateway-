from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    pin: Optional[str] = Field(None, min_length=4, max_length=6)

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    password_hash: str
    hashed_pin: Optional[str] = None
    is_admin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True
    }

class UserResponse(UserBase):
    id: str
    is_admin: bool = False

    model_config = {
        "populate_by_name": True
    }
