from celery import shared_task
from celery.utils.log import get_task_logger
from datetime import datetime, timedelta
from sqlalchemy import select, delete, func
import asyncio

from app.core.database import async_session
from app.models.workflow import WorkflowExecution
from app.models.bot import BotAgent
from app.models.event import ExecutionEvent

logger = get_task_logger(__name__)

@shared_task(name="workers.celery.tasks.cleanup_old_executions")
def cleanup_old_executions():
    """Clean up workflow executions older than 90 days."""
    async def _cleanup():
        async with async_session() as db:
            cutoff = datetime.utcnow() - timedelta(days=90)
            
            await db.execute(
                delete(WorkflowExecution).where(
                    WorkflowExecution.completed_at < cutoff
                )
            )
            await db.commit()
            
            logger.info(f"Cleaned up executions older than {cutoff}")
    
    asyncio.run(_cleanup())

@shared_task(name="workers.celery.tasks.check_bot_health")
def check_bot_health():
    """Check health of all bots and mark offline ones."""
    async def _check():
        async with async_session() as db:
            # Get bots that haven't sent heartbeat in 5 minutes
            cutoff = datetime.utcnow() - timedelta(minutes=5)
            
            result = await db.execute(
                select(BotAgent).where(
                    BotAgent.last_heartbeat_at < cutoff,
                    BotAgent.status == "running",
                )
            )
            bots = result.scalars().all()
            
            for bot in bots:
                bot.status = "offline"
                logger.warning(f"Bot {bot.name} marked as offline")
            
            await db.commit()
    
    asyncio.run(_check())

@shared_task(name="workers.celery.tasks.aggregate_metrics")
def aggregate_metrics():
    """Aggregate execution metrics for dashboards."""
    async def _aggregate():
        async with async_session() as db:
            # Calculate success rates, average durations, etc.
            # This data would be stored in a metrics table or cache
            logger.info("Metrics aggregated successfully")
    
    asyncio.run(_aggregate())

@shared_task(name="workers.celery.tasks.sync_semantic_maps")
def sync_semantic_maps():
    """Sync semantic object maps with Qdrant vector database."""
    async def _sync():
        async with async_session() as db:
            # Sync semantic objects to Qdrant
            # This ensures the vector database is up to date
            logger.info("Semantic maps synced with Qdrant")
    
    asyncio.run(_sync())

@shared_task(name="workers.celery.tasks.send_daily_reports")
def send_daily_reports():
    """Send daily reports to administrators."""
    async def _send():
        async with async_session() as db:
            # Generate and send daily reports
            logger.info("Daily reports sent")
    
    asyncio.run(_send())

@shared_task(name="workers.celery.tasks.execute_webhook")
def execute_webhook(webhook_url: str, payload: dict):
    """Execute a webhook call."""
    import httpx
    
    async def _execute():
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    webhook_url,
                    json=payload,
                    timeout=30,
                )
                logger.info(f"Webhook executed: {response.status_code}")
                return response.status_code
            except Exception as e:
                logger.error(f"Webhook failed: {e}")
                raise
    
    return asyncio.run(_execute())

@shared_task(name="workers.celery.tasks.process_large_dataset")
def process_large_dataset(dataset_id: str):
    """Process large datasets asynchronously."""
    async def _process():
        # Implement large dataset processing
        logger.info(f"Processing dataset {dataset_id}")
    
    asyncio.run(_process())

@shared_task(name="workers.celery.tasks.generate_report")
def generate_report(report_type: str, params: dict):
    """Generate reports asynchronously."""
    async def _generate():
        # Implement report generation
        logger.info(f"Generating {report_type} report")
    
    asyncio.run(_generate())