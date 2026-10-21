from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
from app.core.database import Base

class HumanTask(Base):
    __tablename__ = "human_tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    workflow_execution_id = Column(UUID(as_uuid=True), ForeignKey("workflow_executions.id"))
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(50), default="medium")
    status = Column(String(50), default="pending")
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    context = Column(JSONB, default=dict)
    options = Column(JSONB, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)