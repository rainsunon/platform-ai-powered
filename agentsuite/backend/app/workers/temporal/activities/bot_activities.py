from temporalio import activity
from typing import Dict, Any, List
from datetime import datetime
import json

from app.core.database import async_session
from app.models.bot import BotAgent
from app.models.event import ExecutionEvent
from app.models.task import HumanTask
from app.services.llm_service import LLMService
from sqlalchemy import select

@activity.defn
async def execute_bot_task(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a generic bot task."""
    activity.logger.info(f"Executing bot task: {input_data.get('task', {}).get('id')}")
    
    # In production, this would send the task to the actual bot worker
    # via a message queue or direct API call
    
    # Simulate task execution
    task = input_data.get("task", {})
    bot_id = input_data.get("bot_id")
    
    # Update bot status in database
    async with async_session() as db:
        result = await db.execute(
            select(BotAgent).where(BotAgent.id == bot_id)
        )
        bot = result.scalar_one_or_none()
        
        if bot:
            bot.status = "running"
            bot.current_task_id = task.get("id")
            await db.commit()
    
    # Execute task (this is a placeholder)
    result = {
        "status": "completed",
        "output": f"Task {task.get('id')} completed successfully",
        "execution_time_ms": 1500,
    }
    
    # Update bot status back to idle
    async with async_session() as db:
        result_db = await db.execute(
            select(BotAgent).where(BotAgent.id == bot_id)
        )
        bot = result_db.scalar_one_or_none()
        
        if bot:
            bot.status = "idle"
            bot.current_task_id = None
            bot.last_heartbeat_at = datetime.utcnow()
            
            # Update metrics
            metrics = bot.metrics or {}
            metrics["tasksCompleted"] = metrics.get("tasksCompleted", 0) + 1
            bot.metrics = metrics
            
            await db.commit()
    
    return result

@activity.defn
async def execute_semantic_automation(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Execute semantic web automation task."""
    activity.logger.info(f"Executing semantic automation: {input_data.get('instruction')}")
    
    instruction = input_data.get("instruction", "")
    target_url = input_data.get("target_url", "")
    parameters = input_data.get("parameters", {})
    bot_id = input_data.get("bot_id")
    
    # This would invoke the Playwright agent with semantic understanding
    # The agent uses LLM to understand the page and execute instructions
    
    # Placeholder implementation
    result = {
        "status": "completed",
        "actions_performed": ["click", "fill", "extract"],
        "extracted_data": {
            "example_field": "extracted value",
        },
        "screenshot_base64": None,
    }
    
    return result

@activity.defn
async def invoke_ai_skill(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Invoke an AI skill (LLM-based task)."""
    activity.logger.info(f"Invoking AI skill: {input_data.get('skill_name')}")
    
    llm_service = LLMService()
    
    skill_name = input_data.get("skill_name")
    parameters = input_data.get("parameters", {})
    
    # Different AI skills
    skill_prompts = {
        "extract_invoice": "Extract invoice data from the following document...",
        "classify_document": "Classify the following document into categories...",
        "summarize_text": "Summarize the following text concisely...",
        "translate_content": "Translate the following content...",
        "sentiment_analysis": "Analyze the sentiment of the following text...",
    }
    
    prompt = skill_prompts.get(skill_name, "Process the following input...")
    prompt += f"\n\nInput: {json.dumps(parameters)}"
    
    try:
        response = await llm_service.acomplete(prompt)
        
        result = {
            "status": "completed",
            "skill": skill_name,
            "output": response,
            "model_used": llm_service.model,
        }
        
        return result
    except Exception as e:
        return {
            "status": "failed",
            "skill": skill_name,
            "error": str(e),
        }

@activity.defn
async def create_human_task(input_data: Dict[str, Any]) -> str:
    """Create a human task in the task queue."""
    activity.logger.info(f"Creating human task: {input_data.get('title')}")
    
    async with async_session() as db:
        task = HumanTask(
            tenant_id=input_data.get("tenant_id"),
            workflow_execution_id=input_data.get("workflow_execution_id"),
            node_id=input_data.get("node_id", "human_task"),
            title=input_data.get("title", "Human Task Required"),
            description=input_data.get("description", ""),
            priority=input_data.get("priority", "medium"),
            context=input_data.get("context", {}),
            options=input_data.get("options", []),
        )
        
        db.add(task)
        await db.commit()
        await db.refresh(task)
        
        return str(task.id)

@activity.defn
async def check_policy_compliance(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Check if an action complies with OPA policies."""
    activity.logger.info(f"Checking policy compliance for: {input_data.get('action')}")
    
    # In production, this would call the OPA server
    # For now, return a placeholder compliance check
    
    action = input_data.get("action", "")
    parameters = input_data.get("parameters", {})
    
    # Example compliance rules
    if "approve_payment" in action:
        amount = parameters.get("amount", 0)
        if amount > 10000:
            return {
                "compliant": False,
                "policy_name": "financial_approval",
                "message": f"Payment of {amount} requires additional approval",
                "options": [
                    {"action": "request_approval", "label": "Request VP Approval"},
                    {"action": "override", "label": "Override (requires justification)"},
                ],
            }
    
    if "apply_discount" in action:
        discount = parameters.get("discount_percentage", 0)
        if discount > 15:
            return {
                "compliant": False,
                "policy_name": "discount_approval",
                "message": f"Discount of {discount}% exceeds maximum without VP approval",
                "options": [
                    {"action": "request_approval", "label": "Request VP Approval"},
                    {"action": "reduce_discount", "label": "Reduce to 15%"},
                ],
            }
    
    return {"compliant": True}

@activity.defn
async def record_execution_event(input_data: Dict[str, Any]) -> None:
    """Record an execution event in the database."""
    async with async_session() as db:
        event = ExecutionEvent(
            tenant_id=input_data.get("tenant_id"),
            workflow_execution_id=input_data.get("workflow_execution_id"),
            node_id=input_data.get("node_id"),
            event_type=input_data.get("event_type", "system_event"),
            data=input_data.get("data", {}),
            metadata=input_data.get("metadata", {}),
            duration_ms=input_data.get("duration_ms"),
            timestamp=datetime.utcnow(),
        )
        
        db.add(event)
        await db.commit()
        
        activity.logger.info(f"Recorded event: {input_data.get('event_type')}")

@activity.defn
async def get_available_bots(input_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Get list of available bots from the database."""
    async with async_session() as db:
        result = await db.execute(
            select(BotAgent).where(BotAgent.status.in_(["idle", "running"]))
        )
        bots = result.scalars().all()
        
        return [
            {
                "id": str(bot.id),
                "name": bot.name,
                "type": bot.type,
                "status": bot.status,
                "capabilities": bot.capabilities,
                "metrics": bot.metrics,
            }
            for bot in bots
        ]

@activity.defn
async def query_vector_memory(input_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Query the Qdrant vector database for similar memories."""
    from app.core.config import settings
    from qdrant_client import QdrantClient
    
    query = input_data.get("query", "")
    collection = input_data.get("collection", settings.QDRANT_COLLECTION_NAME)
    top_k = input_data.get("top_k", 5)
    
    try:
        client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY,
        )
        
        # In production, this would:
        # 1. Convert query to embedding using LLM
        # 2. Search Qdrant for similar vectors
        # 3. Return results
        
        # Placeholder
        return [
            {
                "id": "memory_1",
                "content": "Similar past resolution",
                "confidence": 0.85,
                "metadata": {},
            }
        ]
    except Exception as e:
        activity.logger.error(f"Vector memory query failed: {e}")
        return []