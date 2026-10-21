from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_role
from app.models.user import User
from app.models.tenant import Tenant
from app.models.bot import Bot
from app.models.workflow import Workflow
from app.models.task import HumanTask
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["Admin"])

class AdminStats(BaseModel):
    total_users: int
    total_tenants: int
    total_bots: int
    total_workflows: int
    total_tasks: int
    active_bots: int
    completed_tasks: int

class AdminUserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

class AdminTenantResponse(BaseModel):
    id: str
    name: str
    slug: str
    plan: str
    is_active: bool
    user_count: int

@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Get admin dashboard statistics."""
    return AdminStats(
        total_users=db.query(User).count(),
        total_tenants=db.query(Tenant).count(),
        total_bots=db.query(Bot).count(),
        total_workflows=db.query(Workflow).count(),
        total_tasks=db.query(HumanTask).count(),
        active_bots=db.query(Bot).filter(Bot.status == "running").count(),
        completed_tasks=db.query(HumanTask).filter(HumanTask.status == "completed").count()
    )

@router.get("/users", response_model=List[AdminUserResponse])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """List all users (admin only)."""
    users = db.query(User).all()
    return [
        AdminUserResponse(
            id=str(u.id),
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at
        )
        for u in users
    ]

@router.get("/tenants", response_model=List[AdminTenantResponse])
def list_all_tenants(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """List all tenants (admin only)."""
    tenants = db.query(Tenant).all()
    return [
        AdminTenantResponse(
            id=str(t.id),
            name=t.name,
            slug=t.slug,
            plan=t.plan,
            is_active=t.is_active,
            user_count=db.query(User).filter(User.tenant_id == t.id).count()
        )
        for t in tenants
    ]

@router.put("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Activate or deactivate a user (admin only)."""
    from uuid import UUID
    user = db.query(User).filter(User.id == UUID(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = not user.is_active
    db.commit()
    
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}