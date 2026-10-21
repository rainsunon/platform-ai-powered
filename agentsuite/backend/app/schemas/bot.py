from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

class BotCapability(BaseModel):
    name: str
    description: str = ""
    parameters: Dict[str, Any] = {}

class BotCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: str = Field(min_length=1, max_length=50)
    description: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = Field(default_factory=dict)
    capabilities: Optional[List[BotCapability]] = Field(default_factory=list)

class BotUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None
    capabilities: Optional[List[BotCapability]] = None

class BotMetricsResponse(BaseModel):
    tasks_completed: int = 0
    tasks_failed: int = 0
    success_rate: float = 0.0
    uptime_percentage: float = 0.0
    average_execution_time_ms: float = 0.0

class BotResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    name: str
    type: str
    status: str
    configuration: Dict[str, Any]
    capabilities: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    last_heartbeat: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class BotTaskRequest(BaseModel):
    """Request to execute a task on a bot."""
    task_type: str = Field(description="Type of task: web_scrape, api_call, send_email, process_file, ai_task")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Task-specific parameters")

class BotTaskResponse(BaseModel):
    task_id: str
    bot_id: UUID
    status: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time_ms: float = 0.0