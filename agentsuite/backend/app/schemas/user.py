from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    tenant_id: Optional[UUID] = None
    is_active: bool = True
    is_verified: bool = False
    avatar_url: Optional[str] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True