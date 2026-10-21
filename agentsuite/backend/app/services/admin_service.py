from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta

from app.models.user import User
from app.models.tenant import Tenant
from app.models.bot import BotAgent
from app.models.workflow import WorkflowDefinition, WorkflowExecution
from app.models.event import ExecutionEvent, AuditLedger, PolicyViolation

class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_platform_stats(self) -> Dict[str, Any]:
        # Total users
        users_result = await self.db.execute(
            select(func.count(User.id))
        )
        total_users = users_result.scalar()
        
        # Total tenants
        tenants_result = await self.db.execute(
            select(func.count(Tenant.id))
        )
        total_tenants = tenants_result.scalar()
        
        # Total bots
        bots_result = await self.db.execute(
            select(func.count(BotAgent.id))
        )
        total_bots = bots_result.scalar()
        
        # Active workflows today
        today = datetime.utcnow().replace(hour=0, minute=0, second=0)
        workflows_result = await self.db.execute(
            select(func.count(WorkflowExecution.id)).where(
                WorkflowExecution.started_at >= today
            )
        )
        workflows_today = workflows_result.scalar()
        
        # Errors in last 24 hours
        yesterday = datetime.utcnow() - timedelta(hours=24)
        errors_result = await self.db.execute(
            select(func.count(ExecutionEvent.id)).where(
                and_(
                    ExecutionEvent.timestamp >= yesterday,
                    ExecutionEvent.event_type == "error",
                )
            )
        )
        errors_24h = errors_result.scalar()
        
        return {
            "total_users": total_users,
            "total_tenants": total_tenants,
            "total_bots": total_bots,
            "workflows_today": workflows_today,
            "errors_24h": errors_24h,
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    async def list_users(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        role: Optional[str] = None,
    ) -> Tuple[List[User], int]:
        query = select(User)
        
        if search:
            query = query.where(
                or_(
                    User.email.ilike(f"%{search}%"),
                    User.full_name.ilike(f"%{search}%"),
                )
            )
        
        if role:
            query = query.where(User.role == role)
        
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(User.created_at.desc())
        
        result = await self.db.execute(query)
        users = result.scalars().all()
        
        return users, total
    
    async def update_user_role(
        self,
        user_id: UUID,
        new_role: str,
    ) -> bool:
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            return False
        
        user.role = new_role
        await self.db.commit()
        
        return True
    
    async def toggle_user_status(
        self,
        user_id: UUID,
        is_active: bool,
    ) -> bool:
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            return False
        
        user.is_active = is_active
        await self.db.commit()
        
        return True
    
    async def get_queue_status(self) -> Dict[str, Any]:
        # This would integrate with Celery/Temporal to get real queue status
        return {
            "celery": {
                "active": 12,
                "scheduled": 45,
                "reserved": 8,
            },
            "temporal": {
                "running": 23,
                "pending": 67,
                "failed": 3,
            },
        }
    
    async def list_policies(self) -> List[Dict[str, Any]]:
        result = await self.db.execute(
            select(PolicyViolation).order_by(PolicyViolation.created_at.desc()).limit(50)
        )
        violations = result.scalars().all()
        
        return [
            {
                "id": str(v.id),
                "policy_name": v.policy_name,
                "severity": v.severity,
                "description": v.description,
                "created_at": v.created_at.isoformat(),
                "resolved": v.resolved,
            }
            for v in violations
        ]
    
    async def create_policy(self, policy_data: Dict[str, Any]) -> Dict[str, Any]:
        # This would create a new OPA policy
        return {"message": "Policy created", "policy": policy_data}
    
    async def delete_policy(self, policy_name: str) -> bool:
        # This would delete an OPA policy
        return True
    
    async def get_audit_logs(
        self,
        page: int = 1,
        page_size: int = 50,
        resource_type: Optional[str] = None,
        action: Optional[str] = None,
    ) -> Tuple[List[AuditLedger], int]:
        query = select(AuditLedger)
        
        if resource_type:
            query = query.where(AuditLedger.resource_type == resource_type)
        
        if action:
            query = query.where(AuditLedger.action == action)
        
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(AuditLedger.timestamp.desc())
        
        result = await self.db.execute(query)
        logs = result.scalars().all()
        
        return logs, total