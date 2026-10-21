from sqlalchemy.orm import Session
from typing import Optional, Tuple, List
from uuid import UUID
from app.models.workflow import Workflow, WorkflowExecution
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate

class WorkflowService:
    def __init__(self, db: Session):
        self.db = db
    
    def list_workflows(
        self,
        tenant_id: UUID,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None
    ) -> Tuple[List[Workflow], int]:
        query = self.db.query(Workflow).filter(Workflow.tenant_id == tenant_id)
        
        if status:
            query = query.filter(Workflow.status == status)
        
        total = query.count()
        workflows = query.offset((page - 1) * page_size).limit(page_size).all()
        
        return workflows, total
    
    def get_workflow(self, workflow_id: UUID, tenant_id: UUID) -> Optional[Workflow]:
        return self.db.query(Workflow).filter(
            Workflow.id == workflow_id,
            Workflow.tenant_id == tenant_id
        ).first()
    
    def create_workflow(self, tenant_id: UUID, user_id: UUID, workflow_data: WorkflowCreate) -> Workflow:
        workflow = Workflow(
            tenant_id=tenant_id,
            name=workflow_data.name,
            description=workflow_data.description,
            definition=workflow_data.definition or {},
            created_by=user_id,
            status="draft"
        )
        self.db.add(workflow)
        self.db.commit()
        self.db.refresh(workflow)
        return workflow
    
    def update_workflow(
        self,
        workflow_id: UUID,
        tenant_id: UUID,
        workflow_data: WorkflowUpdate
    ) -> Optional[Workflow]:
        workflow = self.get_workflow(workflow_id, tenant_id)
        if not workflow:
            return None
        
        update_data = workflow_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(workflow, key, value)
        
        self.db.commit()
        self.db.refresh(workflow)
        return workflow
    
    def delete_workflow(self, workflow_id: UUID, tenant_id: UUID) -> bool:
        workflow = self.get_workflow(workflow_id, tenant_id)
        if not workflow:
            return False
        
        # Delete all related records first
        from app.models.event import ExecutionEvent
        from app.models.task import HumanTask
        
        # Find all executions for this workflow
        executions = self.db.query(WorkflowExecution).filter(
            WorkflowExecution.workflow_id == workflow_id
        ).all()
        
        for execution in executions:
            # Delete events
            self.db.query(ExecutionEvent).filter(
                ExecutionEvent.workflow_execution_id == execution.id
            ).delete()
            # Delete human tasks
            self.db.query(HumanTask).filter(
                HumanTask.workflow_execution_id == execution.id
            ).delete()
        
        # Delete all executions
        self.db.query(WorkflowExecution).filter(
            WorkflowExecution.workflow_id == workflow_id
        ).delete()
        
        # Delete the workflow
        self.db.delete(workflow)
        self.db.commit()
        return True
    
    def start_execution(self, workflow_id: UUID, tenant_id: UUID, variables: dict = None) -> WorkflowExecution:
        # Auto-activate the workflow when it's first run
        workflow = self.get_workflow(workflow_id, tenant_id)
        if workflow and workflow.status == 'draft':
            workflow.status = 'active'
            workflow.version += 1
        
        execution = WorkflowExecution(
            workflow_id=workflow_id,
            tenant_id=tenant_id,
            variables=variables or {},
            status="running"
        )
        self.db.add(execution)
        self.db.commit()
        self.db.refresh(execution)
        return execution
    
    def get_execution(self, execution_id: UUID, tenant_id: UUID) -> Optional[WorkflowExecution]:
        return self.db.query(WorkflowExecution).filter(
            WorkflowExecution.id == execution_id,
            WorkflowExecution.tenant_id == tenant_id
        ).first()