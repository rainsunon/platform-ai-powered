from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
from app.core.database import Base

class ExecutionEvent(Base):
    __tablename__ = "execution_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    workflow_execution_id = Column(UUID(as_uuid=True), ForeignKey("workflow_executions.id"))
    event_type = Column(String(100), nullable=False)
    data = Column(JSONB, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)