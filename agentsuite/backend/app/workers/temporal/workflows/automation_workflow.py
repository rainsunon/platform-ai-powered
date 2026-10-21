from datetime import timedelta
from typing import List, Dict, Any, Optional
from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from ..activities.bot_activities import (
        execute_bot_task,
        execute_semantic_automation,
        invoke_ai_skill,
        create_human_task,
        check_policy_compliance,
        record_execution_event,
    )
    from ..activities.llm_activities import (
        decompose_goal,
        select_bot_for_task,
        generate_recovery_plan,
    )

@workflow.defn
class AgenticAutomationWorkflow:
    """
    Main workflow for executing complex, AI-driven automations.
    Supports dynamic goal decomposition, multi-agent orchestration,
    and human-in-the-loop interactions.
    """
    
    def __init__(self):
        self.execution_state = {}
        self.bot_assignments = {}
        self.human_tasks = []
        self.errors = []
        
    @workflow.run
    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        workflow.logger.info(f"Starting automation workflow with input: {input_data}")
        
        try:
            # Step 1: Record workflow start
            await workflow.execute_activity(
                record_execution_event,
                {
                    "event_type": "workflow_started",
                    "workflow_id": workflow.info().workflow_id,
                    "input": input_data,
                },
                start_to_close_timeout=timedelta(seconds=10),
            )
            
            # Step 2: Decompose high-level goal into sub-tasks
            goal = input_data.get("goal", "")
            if goal:
                sub_tasks = await workflow.execute_activity(
                    decompose_goal,
                    {
                        "goal": goal,
                        "context": input_data.get("context", {}),
                        "available_bots": await self.get_available_bots(),
                    },
                    start_to_close_timeout=timedelta(seconds=30),
                    retry_policy=RetryPolicy(maximum_attempts=3),
                )
                workflow.logger.info(f"Goal decomposed into {len(sub_tasks)} sub-tasks")
            else:
                sub_tasks = input_data.get("tasks", [])
            
            # Step 3: Execute sub-tasks in parallel or sequence
            results = []
            for task in sub_tasks:
                result = await self.execute_sub_task(task)
                results.append(result)
            
            # Step 4: Aggregate results and complete
            final_result = await self.aggregate_results(results)
            
            # Record completion
            await workflow.execute_activity(
                record_execution_event,
                {
                    "event_type": "workflow_completed",
                    "workflow_id": workflow.info().workflow_id,
                    "result": final_result,
                },
                start_to_close_timeout=timedelta(seconds=10),
            )
            
            return final_result
            
        except Exception as e:
            workflow.logger.error(f"Workflow failed: {str(e)}")
            
            # Attempt recovery
            recovery_plan = await workflow.execute_activity(
                generate_recovery_plan,
                {
                    "error": str(e),
                    "execution_state": self.execution_state,
                    "workflow_id": workflow.info().workflow_id,
                },
                start_to_close_timeout=timedelta(seconds=30),
                retry_policy=RetryPolicy(maximum_attempts=2),
            )
            
            if recovery_plan.get("auto_recoverable"):
                # Retry the failed task
                result = await self.execute_sub_task(recovery_plan["recovery_task"])
                return await self.aggregate_results([result])
            else:
                # Escalate to human
                human_task_id = await workflow.execute_activity(
                    create_human_task,
                    {
                        "title": f"Workflow Failure: {workflow.info().workflow_id}",
                        "description": str(e),
                        "priority": "high",
                        "context": self.execution_state,
                        "options": recovery_plan.get("human_options", []),
                    },
                    start_to_close_timeout=timedelta(seconds=10),
                )
                
                # Wait for human response
                await workflow.wait_condition(
                    lambda: self.is_human_task_resolved(human_task_id),
                    timeout=timedelta(hours=24),
                )
                
                # Retry with human guidance
                human_resolution = self.get_human_task_resolution(human_task_id)
                result = await self.execute_sub_task(human_resolution["task"])
                return await self.aggregate_results([result])
    
    async def execute_sub_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single sub-task with appropriate bot selection."""
        task_id = task["id"]
        task_type = task["type"]
        
        try:
            # Select appropriate bot for the task
            if "bot_id" not in task:
                bot_id = await workflow.execute_activity(
                    select_bot_for_task,
                    {
                        "task_type": task_type,
                        "task_requirements": task.get("requirements", {}),
                        "available_bots": await self.get_available_bots(),
                    },
                    start_to_close_timeout=timedelta(seconds=15),
                )
                task["bot_id"] = bot_id
            
            bot_id = task["bot_id"]
            
            # Check policy compliance before execution
            policy_result = await workflow.execute_activity(
                check_policy_compliance,
                {
                    "action": task_type,
                    "bot_id": bot_id,
                    "parameters": task.get("parameters", {}),
                },
                start_to_close_timeout=timedelta(seconds=10),
            )
            
            if not policy_result["compliant"]:
                # Create human task for policy violation
                human_task_id = await workflow.execute_activity(
                    create_human_task,
                    {
                        "title": f"Policy Violation: {policy_result['policy_name']}",
                        "description": policy_result["message"],
                        "priority": "critical",
                        "context": {"task": task},
                        "options": policy_result.get("options", []),
                    },
                    start_to_close_timeout=timedelta(seconds=10),
                )
                
                await workflow.wait_condition(
                    lambda: self.is_human_task_resolved(human_task_id),
                    timeout=timedelta(hours=4),
                )
                
                resolution = self.get_human_task_resolution(human_task_id)
                if resolution.get("action") == "override":
                    # Continue with execution
                    pass
                else:
                    raise Exception(f"Policy violation not resolved: {policy_result['policy_name']}")
            
            # Execute the task based on type
            if task_type == "semantic_automation":
                result = await workflow.execute_activity(
                    execute_semantic_automation,
                    {
                        "bot_id": bot_id,
                        "instruction": task["instruction"],
                        "target_url": task.get("target_url"),
                        "parameters": task.get("parameters", {}),
                    },
                    start_to_close_timeout=timedelta(minutes=10),
                    retry_policy=RetryPolicy(
                        maximum_attempts=3,
                        initial_interval=timedelta(seconds=5),
                        maximum_interval=timedelta(minutes=1),
                    ),
                )
            elif task_type == "ai_skill":
                result = await workflow.execute_activity(
                    invoke_ai_skill,
                    {
                        "bot_id": bot_id,
                        "skill_name": task["skill_name"],
                        "parameters": task.get("parameters", {}),
                    },
                    start_to_close_timeout=timedelta(minutes=5),
                    retry_policy=RetryPolicy(maximum_attempts=2),
                )
            elif task_type == "human_task":
                # Create human task and wait for resolution
                human_task_id = await workflow.execute_activity(
                    create_human_task,
                    task,
                    start_to_close_timeout=timedelta(seconds=10),
                )
                
                await workflow.wait_condition(
                    lambda: self.is_human_task_resolved(human_task_id),
                    timeout=timedelta(hours=72),
                )
                
                result = self.get_human_task_resolution(human_task_id)
            else:
                result = await workflow.execute_activity(
                    execute_bot_task,
                    {
                        "bot_id": bot_id,
                        "task": task,
                    },
                    start_to_close_timeout=timedelta(minutes=15),
                    retry_policy=RetryPolicy(
                        maximum_attempts=5,
                        initial_interval=timedelta(seconds=10),
                        maximum_interval=timedelta(minutes=5),
                        backoff_coefficient=2.0,
                    ),
                )
            
            # Record successful execution
            await workflow.execute_activity(
                record_execution_event,
                {
                    "event_type": "task_completed",
                    "task_id": task_id,
                    "bot_id": bot_id,
                    "result": result,
                },
                start_to_close_timeout=timedelta(seconds=10),
            )
            
            return {
                "task_id": task_id,
                "status": "completed",
                "result": result,
            }
            
        except Exception as e:
            workflow.logger.error(f"Task {task_id} failed: {str(e)}")
            
            # Record error
            await workflow.execute_activity(
                record_execution_event,
                {
                    "event_type": "task_failed",
                    "task_id": task_id,
                    "error": str(e),
                },
                start_to_close_timeout=timedelta(seconds=10),
            )
            
            # Attempt self-healing
            recovery_result = await self.attempt_task_recovery(task, str(e))
            
            if recovery_result["recovered"]:
                return recovery_result["result"]
            else:
                raise e
    
    async def attempt_task_recovery(
        self,
        task: Dict[str, Any],
        error: str,
    ) -> Dict[str, Any]:
        """Attempt to recover from task failure using AI."""
        recovery_plan = await workflow.execute_activity(
            generate_recovery_plan,
            {
                "task": task,
                "error": error,
                "execution_state": self.execution_state,
            },
            start_to_close_timeout=timedelta(seconds=30),
        )
        
        if recovery_plan.get("can_retry"):
            # Modify task based on recovery plan
            modified_task = {**task, **recovery_plan.get("modifications", {})}
            
            try:
                result = await self.execute_sub_task(modified_task)
                return {
                    "recovered": True,
                    "result": result,
                }
            except Exception:
                pass
        
        # Check if similar error was resolved in the past
        similar_resolution = await workflow.execute_activity(
            "query_vector_memory",
            {
                "query": error,
                "collection": "error_resolutions",
                "top_k": 3,
            },
            start_to_close_timeout=timedelta(seconds=10),
        )
        
        if similar_resolution and similar_resolution[0].get("confidence", 0) > 0.8:
            resolution = similar_resolution[0]
            
            if resolution.get("auto_apply"):
                modified_task = {
                    **task,
                    **resolution.get("task_modifications", {}),
                }
                
                try:
                    result = await self.execute_sub_task(modified_task)
                    return {
                        "recovered": True,
                        "result": result,
                    }
                except Exception:
                    pass
        
        return {"recovered": False}
    
    async def get_available_bots(self) -> List[Dict[str, Any]]:
        """Get list of available bots."""
        # In production, this would query the bot registry
        if not self.bot_assignments:
            result = await workflow.execute_activity(
                "get_available_bots",
                {},
                start_to_close_timeout=timedelta(seconds=15),
            )
            self.bot_assignments = result
        
        return self.bot_assignments
    
    async def aggregate_results(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Aggregate results from multiple sub-tasks."""
        return {
            "status": "completed",
            "total_tasks": len(results),
            "successful_tasks": len([r for r in results if r["status"] == "completed"]),
            "failed_tasks": len([r for r in results if r["status"] != "completed"]),
            "results": results,
        }
    
    def is_human_task_resolved(self, task_id: str) -> bool:
        """Check if a human task has been resolved."""
        return task_id in self.execution_state.get("resolved_human_tasks", {})
    
    def get_human_task_resolution(self, task_id: str) -> Dict[str, Any]:
        """Get the resolution for a human task."""
        return self.execution_state.get("resolved_human_tasks", {}).get(task_id, {})