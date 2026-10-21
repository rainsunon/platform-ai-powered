from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from datetime import datetime
import json
import asyncio

from app.api.deps import get_db, get_current_user
from app.services.observability_service import ObservabilityService

router = APIRouter(prefix="/observability", tags=["Observability"])

@router.get("/process-graph")
def get_process_graph(
    workflow_id: Optional[UUID] = None,
    time_range_hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get process graph data for visualization."""
    service = ObservabilityService(db)
    return service.get_process_graph(
        tenant_id=UUID(current_user["tenant_id"]),
        workflow_id=workflow_id,
        time_range_hours=time_range_hours
    )

@router.get("/logs")
def get_logs(
    workflow_execution_id: Optional[UUID] = None,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get execution logs (non-streaming)."""
    service = ObservabilityService(db)
    logs = service.get_logs(
        tenant_id=UUID(current_user["tenant_id"]),
        workflow_execution_id=workflow_execution_id,
        limit=limit
    )
    return {"logs": logs}

@router.get("/logs/stream")
async def stream_logs(
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Stream logs via Server-Sent Events."""
    service = ObservabilityService(db)
    
    async def event_generator():
        last_id = None
        while True:
            if await request.is_disconnected():
                break
            
            # Get new logs
            logs = service.get_logs(
                tenant_id=UUID(current_user["tenant_id"]),
                limit=10
            )
            
            for log in logs:
                log_id = log["id"]
                if last_id is None or log_id != last_id:
                    yield f"data: {json.dumps(log)}\n\n"
            
            if logs:
                last_id = logs[-1]["id"]
            
            await asyncio.sleep(2)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

@router.post("/events")
def record_event(
    event_type: str,
    data: dict,
    workflow_execution_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Record an execution event."""
    service = ObservabilityService(db)
    event = service.record_event(
        tenant_id=UUID(current_user["tenant_id"]),
        workflow_execution_id=workflow_execution_id,
        event_type=event_type,
        data=data
    )
    return {
        "id": str(event.id),
        "type": event.event_type,
        "timestamp": event.timestamp.isoformat()
    }