from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from app.api.deps import get_db, get_current_user
from app.schemas.bot import BotCreate, BotUpdate, BotResponse, BotMetricsResponse, BotTaskRequest, BotTaskResponse
from app.schemas.common import PaginatedResponse
from app.services.bot_service import BotService

router = APIRouter(prefix="/bots", tags=["Bots"])

@router.get("/", response_model=PaginatedResponse[BotResponse])
def list_bots(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List all bots with optional filtering."""
    bot_service = BotService(db)
    bots, total = bot_service.list_bots(
        tenant_id=UUID(current_user["tenant_id"]),
        page=page,
        page_size=page_size,
        status=status,
        bot_type=type
    )
    
    return PaginatedResponse(
        data=[BotResponse.model_validate(bot) for bot in bots],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

@router.post("/", response_model=BotResponse, status_code=status.HTTP_201_CREATED)
def create_bot(
    bot_data: BotCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new bot."""
    bot_service = BotService(db)
    bot = bot_service.create_bot(
        tenant_id=UUID(current_user["tenant_id"]),
        bot_data=bot_data
    )
    return BotResponse.model_validate(bot)

@router.get("/{bot_id}", response_model=BotResponse)
def get_bot(
    bot_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific bot."""
    bot_service = BotService(db)
    bot = bot_service.get_bot(bot_id, UUID(current_user["tenant_id"]))
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    return BotResponse.model_validate(bot)

@router.put("/{bot_id}", response_model=BotResponse)
def update_bot(
    bot_id: UUID,
    bot_data: BotUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a bot."""
    bot_service = BotService(db)
    bot = bot_service.update_bot(bot_id, UUID(current_user["tenant_id"]), bot_data)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    return BotResponse.model_validate(bot)

@router.delete("/{bot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bot(
    bot_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a bot."""
    bot_service = BotService(db)
    deleted = bot_service.delete_bot(bot_id, UUID(current_user["tenant_id"]))
    if not deleted:
        raise HTTPException(status_code=404, detail="Bot not found")

@router.get("/{bot_id}/metrics", response_model=BotMetricsResponse)
def get_bot_metrics(
    bot_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get bot metrics."""
    bot_service = BotService(db)
    bot = bot_service.get_bot(bot_id, UUID(current_user["tenant_id"]))
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    return BotMetricsResponse(
        tasks_completed=bot.metrics.get("tasks_completed", 0),
        tasks_failed=bot.metrics.get("tasks_failed", 0),
        success_rate=bot.metrics.get("success_rate", 0),
        uptime_percentage=bot.metrics.get("uptime_percentage", 0)
    )

@router.post("/{bot_id}/start")
def start_bot(
    bot_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Start a bot."""
    bot_service = BotService(db)
    bot = bot_service.get_bot(bot_id, UUID(current_user["tenant_id"]))
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    bot.status = "running"
    db.commit()
    
    return {"message": "Bot started", "status": "running"}

@router.post("/{bot_id}/stop")
def stop_bot(
    bot_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Stop a bot."""
    bot_service = BotService(db)
    bot = bot_service.get_bot(bot_id, UUID(current_user["tenant_id"]))
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    bot.status = "idle"
    db.commit()
    
    return {"message": "Bot stopped", "status": "idle"}

@router.post("/{bot_id}/restart")
def restart_bot(
    bot_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Restart a bot."""
    bot_service = BotService(db)
    bot = bot_service.get_bot(bot_id, UUID(current_user["tenant_id"]))
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    bot.status = "running"
    db.commit()
    
    return {"message": "Bot restarted", "status": "running"}

@router.post("/{bot_id}/execute", response_model=BotTaskResponse)
def execute_bot_task(
    bot_id: UUID,
    task_request: BotTaskRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Execute a task on a specific bot."""
    bot_service = BotService(db)
    try:
        result = bot_service.execute_task(
            bot_id=bot_id,
            tenant_id=UUID(current_user["tenant_id"]),
            task_type=task_request.task_type,
            parameters=task_request.parameters
        )
        return BotTaskResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task execution failed: {str(e)}")

@router.get("/{bot_id}/capabilities")
def get_bot_capabilities(
    bot_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a bot's capabilities."""
    bot_service = BotService(db)
    bot = bot_service.get_bot(bot_id, UUID(current_user["tenant_id"]))
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    return {
        "bot_id": str(bot.id),
        "bot_name": bot.name,
        "bot_type": bot.type,
        "capabilities": bot.capabilities or []
    }

@router.get("/{bot_id}/tasks/history")
def get_bot_task_history(
    bot_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get task execution history for a bot."""
    from app.models.event import ExecutionEvent
    
    events = db.query(ExecutionEvent).filter(
        ExecutionEvent.tenant_id == UUID(current_user["tenant_id"]),
        ExecutionEvent.data.contains({"bot_id": str(bot_id)})
    ).order_by(ExecutionEvent.timestamp.desc()).limit(limit).all()
    
    return [
        {
            "id": str(e.id),
            "task_type": e.data.get("task_type", "unknown"),
            "parameters": e.data.get("parameters", {}),
            "status": "completed" if e.event_type == "task_completed" else "failed",
            "result": e.data.get("result"),
            "error": e.data.get("error"),
            "execution_time_ms": e.data.get("execution_time_ms", 0),
            "created_at": e.timestamp.isoformat()
        }
        for e in events
    ]