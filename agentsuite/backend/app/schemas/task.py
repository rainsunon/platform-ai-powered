from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: Optional[str] = None
    priority: str = "medium"
    assigned_to: Optional[UUID] = None
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    options: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class TaskUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[UUID] = None

class TaskResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    workflow_execution_id: Optional[UUID]
    title: str
    description: Optional[str]
    priority: str
    status: str
    assigned_to: Optional[UUID]
    context: Dict[str, Any]
    options: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True