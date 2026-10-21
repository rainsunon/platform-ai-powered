from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    bots,
    workflows,
    tasks,
    observability,
    admin,
    tenants,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(bots.router, prefix="/bots", tags=["Bots"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["Workflows"])
api_router.include_router(tasks.router, prefix="/humantasks", tags=["Human Tasks"])
api_router.include_router(observability.router, prefix="/observability", tags=["Observability"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["Tenants"])