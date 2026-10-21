from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.api.deps import get_db, get_current_user, require_role
from app.models.tenant import Tenant
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/tenants", tags=["Tenants"])

class TenantResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    plan: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None

@router.get("/", response_model=list[TenantResponse])
def list_tenants(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """List all tenants (admin only)."""
    tenants = db.query(Tenant).all()
    return [TenantResponse.model_validate(t) for t in tenants]

@router.get("/{tenant_id}", response_model=TenantResponse)
def get_tenant(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific tenant."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return TenantResponse.model_validate(tenant)

@router.put("/{tenant_id}", response_model=TenantResponse)
def update_tenant(
    tenant_id: UUID,
    tenant_data: TenantUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Update a tenant (admin only)."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    update_data = tenant_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tenant, key, value)
    
    db.commit()
    db.refresh(tenant)
    return TenantResponse.model_validate(tenant)