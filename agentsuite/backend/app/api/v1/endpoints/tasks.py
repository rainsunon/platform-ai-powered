from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from app.api.deps import get_db, get_current_user
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.schemas.common import PaginatedResponse
from app.services.task_service import TaskService

router = APIRouter(prefix="/humantasks", tags=["Human Tasks"])

@router.get("/", response_model=list)
def list_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    sort: Optional[str] = "priority",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List all human tasks with filtering."""
    service = TaskService(db)
    tasks, total = service.list_tasks(
        tenant_id=UUID(current_user["tenant_id"]),
        status=status,
        priority=priority,
        sort=sort
    )
    return [TaskResponse.model_validate(t) for t in tasks]

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new human task."""
    service = TaskService(db)
    task = service.create_task(
        tenant_id=UUID(current_user["tenant_id"]),
        task_data=task_data
    )
    return TaskResponse.model_validate(task)

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific task."""
    service = TaskService(db)
    task = service.get_task(task_id, UUID(current_user["tenant_id"]))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse.model_validate(task)

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a task."""
    service = TaskService(db)
    task = service.update_task(task_id, UUID(current_user["tenant_id"]), task_data)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse.model_validate(task)

@router.post("/{task_id}/claim", response_model=TaskResponse)
def claim_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Claim a task."""
    service = TaskService(db)
    task = service.claim_task(
        task_id,
        UUID(current_user["tenant_id"]),
        UUID(current_user["user_id"])
    )
    if not task:
        raise HTTPException(status_code=400, detail="Task cannot be claimed")
    return TaskResponse.model_validate(task)

@router.post("/{task_id}/resolve", response_model=TaskResponse)
def resolve_task(
    task_id: UUID,
    resolution: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Resolve/complete a task with resolution."""
    service = TaskService(db)
    task = service.complete_task(
        task_id,
        UUID(current_user["tenant_id"]),
        resolution
    )
    if not task:
        raise HTTPException(status_code=400, detail="Task cannot be resolved")
    return TaskResponse.model_validate(task)

@router.post("/{task_id}/escalate", response_model=TaskResponse)
def escalate_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Escalate a task."""
    service = TaskService(db)
    task = service.get_task(task_id, UUID(current_user["tenant_id"]))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.status = "escalated"
    db.commit()
    db.refresh(task)
    return TaskResponse.model_validate(task)