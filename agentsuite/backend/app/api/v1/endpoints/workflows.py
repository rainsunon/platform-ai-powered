from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from app.api.deps import get_db, get_current_user
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowResponse,
    WorkflowExecutionResponse
)
from app.models.workflow import WorkflowExecution
from app.schemas.common import PaginatedResponse
from app.services.workflow_service import WorkflowService
from datetime import datetime

router = APIRouter(prefix="/workflows", tags=["Workflows"])

@router.get("/", response_model=PaginatedResponse[WorkflowResponse])
def list_workflows(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List all workflows."""
    service = WorkflowService(db)
    workflows, total = service.list_workflows(
        tenant_id=UUID(current_user["tenant_id"]),
        page=page,
        page_size=page_size,
        status=status
    )
    
    return PaginatedResponse(
        data=[WorkflowResponse.model_validate(w) for w in workflows],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

@router.post("/", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
def create_workflow(
    workflow_data: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new workflow."""
    service = WorkflowService(db)
    workflow = service.create_workflow(
        tenant_id=UUID(current_user["tenant_id"]),
        user_id=UUID(current_user["user_id"]),
        workflow_data=workflow_data
    )
    return WorkflowResponse.model_validate(workflow)

@router.post("/{workflow_id}/start", response_model=WorkflowExecutionResponse)
def start_workflow(
    workflow_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Start workflow execution."""
    service = WorkflowService(db)
    workflow = service.get_workflow(workflow_id, UUID(current_user["tenant_id"]))
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    execution = service.start_execution(workflow_id, UUID(current_user["tenant_id"]))
    
    # ✅ Execute the workflow (synchronously for now, should be background task)
    from app.services.execution_engine import ExecutionEngine
    engine = ExecutionEngine(db)
    
    try:
        results = engine.execute_workflow(execution.id, UUID(current_user["tenant_id"]))
        return WorkflowExecutionResponse.model_validate(execution)
    except Exception as e:
        execution.status = 'failed'
        execution.completed_at = datetime.utcnow()
        db.commit()
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")

@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(
    workflow_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific workflow."""
    service = WorkflowService(db)
    workflow = service.get_workflow(workflow_id, UUID(current_user["tenant_id"]))
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return WorkflowResponse.model_validate(workflow)

@router.put("/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(
    workflow_id: UUID,
    workflow_data: WorkflowUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a workflow."""
    service = WorkflowService(db)
    workflow = service.update_workflow(
        workflow_id,
        UUID(current_user["tenant_id"]),
        workflow_data
    )
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return WorkflowResponse.model_validate(workflow)

@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(
    workflow_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a workflow."""
    service = WorkflowService(db)
    deleted = service.delete_workflow(workflow_id, UUID(current_user["tenant_id"]))
    if not deleted:
        raise HTTPException(status_code=404, detail="Workflow not found")
    # No return - 204 means no content

@router.get("/{workflow_id}/executions", response_model=list[WorkflowExecutionResponse])
def list_executions(
    workflow_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List executions for a workflow."""
    executions = db.query(WorkflowExecution).filter(
        WorkflowExecution.workflow_id == workflow_id,
        WorkflowExecution.tenant_id == UUID(current_user["tenant_id"])
    ).all()
    return [WorkflowExecutionResponse.model_validate(e) for e in executions]