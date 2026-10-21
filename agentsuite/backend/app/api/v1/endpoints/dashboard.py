from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.models.bot import Bot
from app.models.workflow import Workflow, WorkflowExecution
from app.models.task import HumanTask
from app.models.event import ExecutionEvent

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics")
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get dashboard metrics for the current tenant."""
    tenant_id = UUID(current_user["tenant_id"])
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    
    # ============ BOT METRICS ============
    total_bots = db.query(Bot).filter(Bot.tenant_id == tenant_id).count()
    active_bots = db.query(Bot).filter(
        Bot.tenant_id == tenant_id,
        Bot.status == "running"
    ).count()
    idle_bots = db.query(Bot).filter(
        Bot.tenant_id == tenant_id,
        Bot.status == "idle"
    ).count()
    error_bots = db.query(Bot).filter(
        Bot.tenant_id == tenant_id,
        Bot.status == "error"
    ).count()
    offline_bots = db.query(Bot).filter(
        Bot.tenant_id == tenant_id,
        Bot.status == "offline"
    ).count()
    
    # Calculate bot utilization percentage
    bot_utilization = round((active_bots / total_bots * 100) if total_bots > 0 else 0, 1)
    
    # ============ WORKFLOW METRICS ============
    total_workflows = db.query(Workflow).filter(
        Workflow.tenant_id == tenant_id
    ).count()
    
    active_workflows = db.query(Workflow).filter(
        Workflow.tenant_id == tenant_id,
        Workflow.status == "active"
    ).count()
    
    draft_workflows = db.query(Workflow).filter(
        Workflow.tenant_id == tenant_id,
        Workflow.status == "draft"
    ).count()
    
    paused_workflows = db.query(Workflow).filter(
        Workflow.tenant_id == tenant_id,
        Workflow.status == "paused"
    ).count()
    
    # ============ EXECUTION METRICS ============
    # Today's executions
    workflows_today = db.query(WorkflowExecution).filter(
        WorkflowExecution.tenant_id == tenant_id,
        WorkflowExecution.started_at >= today_start
    ).count()
    
    # Yesterday's executions (for comparison)
    workflows_yesterday = db.query(WorkflowExecution).filter(
        WorkflowExecution.tenant_id == tenant_id,
        WorkflowExecution.started_at >= yesterday_start,
        WorkflowExecution.started_at < today_start
    ).count()
    
    # Calculate percentage change from yesterday
    if workflows_yesterday > 0:
        workflows_change = round(
            ((workflows_today - workflows_yesterday) / workflows_yesterday) * 100, 1
        )
    else:
        workflows_change = 100 if workflows_today > 0 else 0
    
    # Completed executions today
    completed_today = db.query(WorkflowExecution).filter(
        WorkflowExecution.tenant_id == tenant_id,
        WorkflowExecution.status == "completed",
        WorkflowExecution.completed_at >= today_start
    ).count()
    
    # Failed executions today
    failed_today = db.query(WorkflowExecution).filter(
        WorkflowExecution.tenant_id == tenant_id,
        WorkflowExecution.status == "failed",
        WorkflowExecution.started_at >= today_start
    ).count()
    
    # Running executions
    running_executions = db.query(WorkflowExecution).filter(
        WorkflowExecution.tenant_id == tenant_id,
        WorkflowExecution.status == "running"
    ).count()
    
    # ============ SUCCESS RATE ============
    total_executions_today = completed_today + failed_today
    success_rate = round(
        (completed_today / total_executions_today * 100) if total_executions_today > 0 else 100, 1
    )
    
    # Yesterday's success rate for comparison
    completed_yesterday = db.query(WorkflowExecution).filter(
        WorkflowExecution.tenant_id == tenant_id,
        WorkflowExecution.status == "completed",
        WorkflowExecution.completed_at >= yesterday_start,
        WorkflowExecution.completed_at < today_start
    ).count()
    
    failed_yesterday = db.query(WorkflowExecution).filter(
        WorkflowExecution.tenant_id == tenant_id,
        WorkflowExecution.status == "failed",
        WorkflowExecution.started_at >= yesterday_start,
        WorkflowExecution.started_at < today_start
    ).count()
    
    total_yesterday = completed_yesterday + failed_yesterday
    yesterday_success_rate = round(
        (completed_yesterday / total_yesterday * 100) if total_yesterday > 0 else 100, 1
    )
    
    success_rate_change = round(success_rate - yesterday_success_rate, 1)
    
    # ============ RESPONSE TIME ============
    # Calculate average execution duration for completed workflows today
    avg_duration_result = db.query(
        func.avg(
            func.extract('epoch', WorkflowExecution.completed_at - WorkflowExecution.started_at) * 1000
        )
    ).filter(
        WorkflowExecution.tenant_id == tenant_id,
        WorkflowExecution.status == "completed",
        WorkflowExecution.completed_at >= today_start
    ).scalar()
    
    avg_response_time = round(avg_duration_result) if avg_duration_result else 0
    
    # Yesterday's average for comparison
    avg_duration_yesterday = db.query(
        func.avg(
            func.extract('epoch', WorkflowExecution.completed_at - WorkflowExecution.started_at) * 1000
        )
    ).filter(
        WorkflowExecution.tenant_id == tenant_id,
        WorkflowExecution.status == "completed",
        WorkflowExecution.completed_at >= yesterday_start,
        WorkflowExecution.completed_at < today_start
    ).scalar()
    
    avg_response_yesterday = round(avg_duration_yesterday) if avg_duration_yesterday else 0
    
    if avg_response_yesterday > 0:
        response_time_change = round(
            ((avg_response_time - avg_response_yesterday) / avg_response_yesterday) * 100, 1
        )
    else:
        response_time_change = 0
    
    # ============ TASK METRICS ============
    pending_tasks = db.query(HumanTask).filter(
        HumanTask.tenant_id == tenant_id,
        HumanTask.status == "pending"
    ).count()
    
    claimed_tasks = db.query(HumanTask).filter(
        HumanTask.tenant_id == tenant_id,
        HumanTask.status == "claimed"
    ).count()
    
    completed_tasks = db.query(HumanTask).filter(
        HumanTask.tenant_id == tenant_id,
        HumanTask.status == "completed"
    ).count()
    
    # High priority pending tasks
    high_priority_tasks = db.query(HumanTask).filter(
        HumanTask.tenant_id == tenant_id,
        HumanTask.status == "pending",
        HumanTask.priority.in_(["high", "critical"])
    ).count()
    
    # ============ BOT ACTIVITY (LAST 24 HOURS) ============
    bot_activity = generate_bot_activity_data(db, tenant_id)
    
    # ============ RECENT WORKFLOWS ============
    recent_workflows = db.query(WorkflowExecution).filter(
        WorkflowExecution.tenant_id == tenant_id
    ).order_by(
        WorkflowExecution.started_at.desc()
    ).limit(10).all()
    
    # ============ ALERTS (REAL) ============
    alerts = generate_alerts(db, tenant_id, {
        "error_bots": error_bots,
        "failed_today": failed_today,
        "high_priority_tasks": high_priority_tasks,
        "bot_utilization": bot_utilization,
        "running_executions": running_executions,
    })
    
    return {
        # Metric cards
        "activeBots": active_bots,
        "totalBots": total_bots,
        "idleBots": idle_bots,
        "errorBots": error_bots,
        "offlineBots": offline_bots,
        "botUtilization": bot_utilization,
        
        "workflowsToday": workflows_today,
        "workflowsYesterday": workflows_yesterday,
        "workflowsChange": workflows_change,
        "totalWorkflows": total_workflows,
        "activeWorkflows": active_workflows,
        "draftWorkflows": draft_workflows,
        "pausedWorkflows": paused_workflows,
        
        "completedToday": completed_today,
        "failedToday": failed_today,
        "runningExecutions": running_executions,
        
        "successRate": success_rate,
        "successRateChange": success_rate_change,
        
        "avgResponseTime": avg_response_time,
        "avgResponseYesterday": avg_response_yesterday,
        "responseTimeChange": response_time_change,
        
        "pendingTasks": pending_tasks,
        "claimedTasks": claimed_tasks,
        "completedTasks": completed_tasks,
        "highPriorityTasks": high_priority_tasks,
        
        "botActivity": bot_activity,
        "recentWorkflows": [
            {
                "id": str(wf.id),
                "workflowId": str(wf.workflow_id),
                "status": wf.status,
                "startedAt": wf.started_at.isoformat() if wf.started_at else None,
                "completedAt": wf.completed_at.isoformat() if wf.completed_at else None,
                "duration": (
                    (wf.completed_at - wf.started_at).total_seconds() * 1000
                    if wf.completed_at and wf.started_at else None
                ),
            }
            for wf in recent_workflows
        ],
        "alerts": alerts,
        "timestamp": now.isoformat(),
    }


def generate_bot_activity_data(db: Session, tenant_id: UUID) -> List[Dict[str, Any]]:
    """Generate hourly bot activity data for the last 24 hours with real success/failure counts."""
    activity = []
    now = datetime.utcnow()
    
    for hour_offset in range(24, 0, -1):
        hour_start = now - timedelta(hours=hour_offset)
        hour_end = hour_start + timedelta(hours=1)
        
        # Total executions in this hour
        total_count = db.query(WorkflowExecution).filter(
            WorkflowExecution.tenant_id == tenant_id,
            WorkflowExecution.started_at >= hour_start,
            WorkflowExecution.started_at < hour_end
        ).count()
        
        # Successful executions
        successful_count = db.query(WorkflowExecution).filter(
            WorkflowExecution.tenant_id == tenant_id,
            WorkflowExecution.status == "completed",
            WorkflowExecution.started_at >= hour_start,
            WorkflowExecution.started_at < hour_end
        ).count()
        
        # Failed executions
        failed_count = db.query(WorkflowExecution).filter(
            WorkflowExecution.tenant_id == tenant_id,
            WorkflowExecution.status == "failed",
            WorkflowExecution.started_at >= hour_start,
            WorkflowExecution.started_at < hour_end
        ).count()
        
        # Running/other
        other_count = total_count - successful_count - failed_count
        
        activity.append({
            "hour": hour_start.strftime("%H:%M"),
            "timestamp": hour_start.isoformat(),
            "executions": total_count,
            "successful": successful_count,
            "failed": failed_count,
            "other": other_count,
        })
    
    return activity


def generate_alerts(db: Session, tenant_id: UUID, metrics: dict) -> List[Dict[str, Any]]:
    """Generate real alerts based on current metrics."""
    alerts = []
    now = datetime.utcnow()
    
    # Alert: Failed bots
    if metrics["error_bots"] > 0:
        alerts.append({
            "type": "error",
            "severity": "high",
            "title": f"{metrics['error_bots']} Bot(s) in Error State",
            "message": f"{metrics['error_bots']} bot(s) are currently in error state and require attention.",
            "timestamp": now.isoformat(),
            "action": "View Bots",
            "actionUrl": "/bots?status=error",
        })
    
    # Alert: Failed executions
    if metrics["failed_today"] > 0:
        alerts.append({
            "type": "warning",
            "severity": "medium",
            "title": f"{metrics['failed_today']} Failed Execution(s) Today",
            "message": f"{metrics['failed_today']} workflow execution(s) have failed today.",
            "timestamp": now.isoformat(),
            "action": "View Executions",
            "actionUrl": "/observability/logs",
        })
    
    # Alert: High priority tasks
    if metrics["high_priority_tasks"] > 0:
        alerts.append({
            "type": "warning",
            "severity": "high",
            "title": f"{metrics['high_priority_tasks']} High Priority Task(s) Pending",
            "message": f"There are {metrics['high_priority_tasks']} high priority task(s) waiting for action.",
            "timestamp": now.isoformat(),
            "action": "View Tasks",
            "actionUrl": "/tasks?priority=high",
        })
    
    # Alert: High bot utilization
    if metrics["bot_utilization"] > 80:
        alerts.append({
            "type": "warning",
            "severity": "medium",
            "title": f"High Bot Utilization: {metrics['bot_utilization']}%",
            "message": "Bot utilization is above 80%. Consider scaling up or redistributing workload.",
            "timestamp": now.isoformat(),
            "action": "Manage Bots",
            "actionUrl": "/bots",
        })
    
    # Alert: All good
    if not alerts:
        alerts.append({
            "type": "success",
            "severity": "low",
            "title": "All Systems Operational",
            "message": "All bots are running smoothly, no issues detected.",
            "timestamp": now.isoformat(),
            "action": None,
            "actionUrl": None,
        })
    
    return alerts


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get quick stats for the dashboard."""
    tenant_id = UUID(current_user["tenant_id"])
    
    return {
        "totalBots": db.query(Bot).filter(Bot.tenant_id == tenant_id).count(),
        "activeBots": db.query(Bot).filter(
            Bot.tenant_id == tenant_id,
            Bot.status == "running"
        ).count(),
        "totalWorkflows": db.query(Workflow).filter(
            Workflow.tenant_id == tenant_id
        ).count(),
        "pendingTasks": db.query(HumanTask).filter(
            HumanTask.tenant_id == tenant_id,
            HumanTask.status == "pending"
        ).count(),
        "runningExecutions": db.query(WorkflowExecution).filter(
            WorkflowExecution.tenant_id == tenant_id,
            WorkflowExecution.status == "running"
        ).count(),
    }