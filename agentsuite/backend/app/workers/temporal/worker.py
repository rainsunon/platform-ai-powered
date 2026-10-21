import asyncio
from temporalio.client import Client
from temporalio.worker import Worker
from temporalio import workflow

from app.core.config import settings
from workers.temporal.workflows.automation_workflow import AgenticAutomationWorkflow
from workers.temporal.activities.bot_activities import (
    execute_bot_task,
    execute_semantic_automation,
    invoke_ai_skill,
    create_human_task,
    check_policy_compliance,
    record_execution_event,
    get_available_bots,
    query_vector_memory,
)
from workers.temporal.activities.llm_activities import (
    decompose_goal,
    select_bot_for_task,
    generate_recovery_plan,
)

async def main():
    # Connect to Temporal server
    client = await Client.connect(
        f"{settings.TEMPORAL_HOST}:7233",
        namespace=settings.TEMPORAL_NAMESPACE,
    )
    
    # Create worker
    worker = Worker(
        client,
        task_queue="automation-task-queue",
        workflows=[AgenticAutomationWorkflow],
        activities=[
            execute_bot_task,
            execute_semantic_automation,
            invoke_ai_skill,
            create_human_task,
            check_policy_compliance,
            record_execution_event,
            get_available_bots,
            query_vector_memory,
            decompose_goal,
            select_bot_for_task,
            generate_recovery_plan,
        ],
    )
    
    # Start worker
    print(f"Starting Temporal worker on task queue: automation-task-queue")
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())