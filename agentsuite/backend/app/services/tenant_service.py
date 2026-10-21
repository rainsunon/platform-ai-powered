from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import secrets

from app.models.tenant import Tenant
from app.schemas.tenant import TenantCreate, TenantUpdate

class TenantService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def list_tenants(
        self,
        page: int = 1,
        page_size: int = 20,
    ) -> List[Tenant]:
        query = select(Tenant).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_tenant(self, tenant_id: UUID) -> Optional[Tenant]:
        result = await self.db.execute(
            select(Tenant).where(Tenant.id == tenant_id)
        )
        return result.scalar_one_or_none()
    
    async def create_tenant(self, tenant_data: TenantCreate) -> Tenant:
        tenant = Tenant(
            name=tenant_data.name,
            slug=tenant_data.slug or secrets.token_urlsafe(8),
            plan=tenant_data.plan or "free",
            settings=tenant_data.settings or {},
        )
        
        self.db.add(tenant)
        await self.db.commit()
        await self.db.refresh(tenant)
        
        return tenant
    
    async def update_tenant(
        self,
        tenant_id: UUID,
        tenant_data: TenantUpdate,
    ) -> Optional[Tenant]:
        tenant = await self.get_tenant(tenant_id)
        if not tenant:
            return None
        
        update_data = tenant_data.dict(exclude_unset=True)
        
        for key, value in update_data.items():
            setattr(tenant, key, value)
        
        await self.db.commit()
        await self.db.refresh(tenant)
        
        return tenant
    
    async def delete_tenant(self, tenant_id: UUID) -> bool:
        tenant = await self.get_tenant(tenant_id)
        if not tenant:
            return False
        
        await self.db.delete(tenant)
        await self.db.commit()
        
        return True