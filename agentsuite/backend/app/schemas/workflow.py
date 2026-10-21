from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

class WorkflowCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    definition: Optional[Dict[str, Any]] = Field(default_factory=dict)

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    definition: Optional[Dict[str, Any]] = None

class WorkflowResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    name: str
    description: Optional[str]
    status: str
    version: int
    definition: Dict[str, Any]
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class WorkflowExecutionResponse(BaseModel):
    id: UUID
    workflow_id: UUID
    tenant_id: UUID
    status: str
    variables: Dict[str, Any]
    started_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True