from typing import Dict, Any, List
from temporalio import activity
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolExecutor
import json

from app.services.llm_service import LLMService

@activity.defn
async def decompose_goal(input_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Decompose a high-level goal into executable sub-tasks using LangGraph.
    """
    llm_service = LLMService()
    
    # Define the decomposition graph
    class DecompositionState(Dict):
        goal: str
        context: Dict[str, Any]
        available_bots: List[Dict[str, Any]]
        sub_tasks: List[Dict[str, Any]]
        validation_errors: List[str]
        iterations: int
    
    def analyze_goal(state: DecompositionState) -> DecompositionState:
        """Analyze the goal and identify required capabilities."""
        prompt = f"""
        Analyze the following automation goal and identify required capabilities:
        
        Goal: {state['goal']}
        Context: {json.dumps(state['context'])}
        
        Available bots: {json.dumps(state['available_bots'])}
        
        List the required capabilities in order of execution.
        """
        
        response = llm_service.complete(prompt)
        state['required_capabilities'] = json.loads(response)
        return state
    
    def generate_sub_tasks(state: DecompositionState) -> DecompositionState:
        """Generate specific sub-tasks for each capability."""
        prompt = f"""
        Create specific, executable sub-tasks for the following automation goal:
        
        Goal: {state['goal']}
        Required capabilities: {json.dumps(state.get('required_capabilities', []))}
        Available bots: {json.dumps(state['available_bots'])}
        
        For each sub-task, specify:
        1. Type (semantic_automation, ai_skill, human_task, bot_task)
        2. Required bot capabilities
        3. Dependencies on other tasks
        4. Expected outputs
        5. Error handling requirements
        
        Return as a JSON array of task objects.
        """
        
        response = llm_service.complete(prompt)
        sub_tasks = json.loads(response)
        
        # Assign task IDs and validate
        for i, task in enumerate(sub_tasks):
            task['id'] = f"task_{i+1}"
            task['sequence_number'] = i + 1
        
        state['sub_tasks'] = sub_tasks
        return state
    
    def validate_tasks(state: DecompositionState) -> DecompositionState:
        """Validate the generated sub-tasks."""
        validation_errors = []
        
        for task in state['sub_tasks']:
            # Check if task type is valid
            if task['type'] not in ['semantic_automation', 'ai_skill', 'human_task', 'bot_task']:
                validation_errors.append(f"Invalid task type for {task['id']}")
            
            # Check if required bot capabilities are available
            if 'required_capabilities' in task:
                available = any(
                    all(cap in bot.get('capabilities', []) for cap in task['required_capabilities'])
                    for bot in state['available_bots']
                )
                if not available:
                    validation_errors.append(f"No bot available for task {task['id']}")
        
        state['validation_errors'] = validation_errors
        state['iterations'] = state.get('iterations', 0) + 1
        
        return state
    
    def should_continue(state: DecompositionState) -> str:
        """Determine if we need to regenerate tasks."""
        if not state['validation_errors']:
            return END
        
        if state['iterations'] >= 3:
            # Max iterations reached, return tasks as-is
            return END
        
        return "regenerate_tasks"
    
    def regenerate_tasks(state: DecompositionState) -> DecompositionState:
        """Regenerate sub-tasks to fix validation errors."""
        prompt = f"""
        The following sub-tasks have validation errors:
        {json.dumps(state['validation_errors'])}
        
        Original goal: {state['goal']}
        Available bots: {json.dumps(state['available_bots'])}
        
        Please regenerate the sub-tasks to fix these errors.
        Return as a JSON array of task objects.
        """
        
        response = llm_service.complete(prompt)
        state['sub_tasks'] = json.loads(response)
        return state
    
    # Build the graph
    workflow = StateGraph(DecompositionState)
    
    workflow.add_node("analyze_goal", analyze_goal)
    workflow.add_node("generate_sub_tasks", generate_sub_tasks)
    workflow.add_node("validate_tasks", validate_tasks)
    workflow.add_node("regenerate_tasks", regenerate_tasks)
    
    workflow.set_entry_point("analyze_goal")
    workflow.add_edge("analyze_goal", "generate_sub_tasks")
    workflow.add_edge("generate_sub_tasks", "validate_tasks")
    workflow.add_conditional_edges(
        "validate_tasks",
        should_continue,
        {
            "regenerate_tasks": "regenerate_tasks",
            END: END,
        },
    )
    workflow.add_edge("regenerate_tasks", "validate_tasks")
    
    # Execute the graph
    app = workflow.compile()
    
    initial_state = {
        "goal": input_data["goal"],
        "context": input_data.get("context", {}),
        "available_bots": input_data.get("available_bots", []),
        "sub_tasks": [],
        "validation_errors": [],
        "iterations": 0,
    }
    
    final_state = await app.ainvoke(initial_state)
    
    activity.logger.info(f"Decomposed goal into {len(final_state['sub_tasks'])} sub-tasks")
    
    return final_state["sub_tasks"]

@activity.defn
async def select_bot_for_task(input_data: Dict[str, Any]) -> str:
    """
    Select the most appropriate bot for a given task using AI reasoning.
    """
    llm_service = LLMService()
    
    prompt = f"""
    Select the best bot for the following task:
    
    Task type: {input_data['task_type']}
    Requirements: {json.dumps(input_data.get('task_requirements', {}))}
    
    Available bots:
    {json.dumps(input_data['available_bots'], indent=2)}
    
    Consider:
    1. Capability match
    2. Current workload
    3. Success rate
    4. Response time
    
    Return the bot ID as a plain string.
    """
    
    response = llm_service.complete(prompt, temperature=0.3)
    
    # Extract bot ID from response
    bot_id = response.strip()
    
    # Validate bot ID
    if bot_id not in [bot['id'] for bot in input_data['available_bots']]:
        # Fallback to first available bot
        bot_id = input_data['available_bots'][0]['id']
    
    return bot_id

@activity.defn
async def generate_recovery_plan(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a recovery plan for a failed task using AI.
    Queries vector memory for similar past issues.
    """
    llm_service = LLMService()
    
    # Query vector memory for similar issues
    similar_cases = await activity.execute_activity(
        "query_vector_memory",
        {
            "query": input_data['error'],
            "collection": "error_resolutions",
            "top_k": 5,
        },
        start_to_close_timeout=timedelta(seconds=10),
    )
    
    prompt = f"""
    Generate a recovery plan for the following failed automation task:
    
    Task: {json.dumps(input_data.get('task', {}))}
    Error: {input_data['error']}
    Execution state: {json.dumps(input_data.get('execution_state', {}))}
    
    Similar past issues and resolutions:
    {json.dumps(similar_cases, indent=2)}
    
    Provide a recovery plan that includes:
    1. Whether the task can be retried automatically
    2. Any modifications needed for retry
    3. Whether human intervention is required
    4. Alternative approaches if available
    
    Return as a JSON object.
    """
    
    response = llm_service.complete(prompt)
    recovery_plan = json.loads(response)
    
    return recovery_plan

class MasterOrchestrator:
    """
    LangGraph-based Master Orchestrator for complex workflow coordination.
    Handles multi-agent coordination, dynamic task allocation, and conflict resolution.
    """
    
    def __init__(self):
        self.llm_service = LLMService()
        self.state = {}
    
    async def orchestrate(self, goal: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Orchestrate a complex automation goal using multiple specialized agents.
        """
        
        # Define the orchestration graph
        class OrchestrationState(Dict):
            goal: str
            context: Dict[str, Any]
            plan: Dict[str, Any]
            agents: List[Dict[str, Any]]
            tasks: List[Dict[str, Any]]
            results: Dict[str, Any]
            conflicts: List[Dict[str, Any]]
        
        def analyze_requirements(state: OrchestrationState) -> OrchestrationState:
            """Analyze what's needed to achieve the goal."""
            prompt = f"""
            Analyze the following automation goal and determine:
            1. Required specialized agents (e.g., procurement, legal, finance)
            2. Task dependencies and critical path
            3. Potential conflicts or bottlenecks
            4. Success criteria
            
            Goal: {state['goal']}
            Context: {json.dumps(state['context'])}
            
            Return as JSON.
            """
            
            response = self.llm_service.complete(prompt)
            analysis = json.loads(response)
            
            state['analysis'] = analysis
            return state
        
        def allocate_agents(state: OrchestrationState) -> OrchestrationState:
            """Allocate specialized agents to tasks."""
            agents = []
            for requirement in state['analysis'].get('required_agents', []):
                agent = {
                    'name': requirement['name'],
                    'specialty': requirement['specialty'],
                    'tasks': [],
                    'status': 'idle',
                }
                agents.append(agent)
            
            state['agents'] = agents
            return state
        
        def negotiate_conflicts(state: OrchestrationState) -> OrchestrationState:
            """Resolve conflicts between agents using AI negotiation."""
            if not state.get('conflicts'):
                return state
            
            prompt = f"""
            Resolve the following conflicts between automation agents:
            
            Conflicts: {json.dumps(state['conflicts'])}
            Agents: {json.dumps(state['agents'])}
            Goal: {state['goal']}
            
            Propose resolutions that optimize for:
            1. Goal achievement
            2. Resource efficiency
            3. Policy compliance
            
            Return as JSON array of resolution actions.
            """
            
            response = self.llm_service.complete(prompt)
            resolutions = json.loads(response)
            
            state['resolutions'] = resolutions
            return state
        
        def coordinate_execution(state: OrchestrationState) -> OrchestrationState:
            """Coordinate parallel and sequential task execution."""
            # Build execution plan based on dependencies
            execution_order = []
            tasks = state.get('tasks', [])
            
            # Sort tasks by dependencies
            resolved = set()
            while len(resolved) < len(tasks):
                for task in tasks:
                    if task['id'] in resolved:
                        continue
                    
                    dependencies = task.get('dependencies', [])
                    if all(dep in resolved for dep in dependencies):
                        execution_order.append(task)
                        resolved.add(task['id'])
            
            state['execution_order'] = execution_order
            return state
        
        # Build the orchestration graph
        workflow = StateGraph(OrchestrationState)
        
        workflow.add_node("analyze_requirements", analyze_requirements)
        workflow.add_node("allocate_agents", allocate_agents)
        workflow.add_node("negotiate_conflicts", negotiate_conflicts)
        workflow.add_node("coordinate_execution", coordinate_execution)
        
        workflow.set_entry_point("analyze_requirements")
        workflow.add_edge("analyze_requirements", "allocate_agents")
        workflow.add_edge("allocate_agents", "coordinate_execution")
        workflow.add_conditional_edges(
            "coordinate_execution",
            lambda s: "negotiate_conflicts" if s.get('conflicts') else END,
            {
                "negotiate_conflicts": "negotiate_conflicts",
                END: END,
            },
        )
        workflow.add_edge("negotiate_conflicts", "coordinate_execution")
        
        # Execute
        app = workflow.compile()
        final_state = await app.ainvoke({
            "goal": goal,
            "context": context,
        })
        
        return final_state