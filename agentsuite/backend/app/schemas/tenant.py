from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class TenantCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: Optional[str] = None
    plan: str = "free"
    settings: Dict[str, Any] = {}

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

class TenantResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    plan: str
    settings: Dict[str, Any]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}