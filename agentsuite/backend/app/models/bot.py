from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
from app.core.database import Base

class Bot(Base):
    __tablename__ = "bots"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # web, desktop, api, ai_agent, email, scraper
    status = Column(String(50), default="idle")  # idle, running, error, offline, maintenance
    configuration = Column(JSONB, default=dict)
    capabilities = Column(JSONB, default=list)
    metrics = Column(JSONB, default=lambda: {
        "tasks_completed": 0,
        "tasks_failed": 0,
        "success_rate": 0.0,
        "uptime_percentage": 0.0,
        "average_execution_time_ms": 0
    })
    last_heartbeat = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)