from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "automation_suite",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "workers.celery.tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_max_tasks_per_child=1000,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)

celery_app.conf.beat_schedule = {
    "cleanup-old-executions": {
        "task": "workers.celery.tasks.cleanup_old_executions",
        "schedule": crontab(hour=2, minute=0),  # Daily at 2 AM
    },
    "check-bot-health": {
        "task": "workers.celery.tasks.check_bot_health",
        "schedule": crontab(minute="*/5"),  # Every 5 minutes
    },
    "aggregate-metrics": {
        "task": "workers.celery.tasks.aggregate_metrics",
        "schedule": crontab(minute="*/15"),  # Every 15 minutes
    },
    "sync-semantic-maps": {
        "task": "workers.celery.tasks.sync_semantic_maps",
        "schedule": crontab(hour="*/6"),  # Every 6 hours
    },
    "send-daily-reports": {
        "task": "workers.celery.tasks.send_daily_reports",
        "schedule": crontab(hour=8, minute=0),  # Daily at 8 AM
    },
}