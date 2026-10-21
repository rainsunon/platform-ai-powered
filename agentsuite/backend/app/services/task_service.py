from sqlalchemy.orm import Session
from typing import Optional, Tuple, List
from uuid import UUID
from app.models.task import HumanTask
from app.schemas.task import TaskCreate, TaskUpdate

class TaskService:
    def __init__(self, db: Session):
        self.db = db
    
    def list_tasks(
        self,
        tenant_id: UUID,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        sort: Optional[str] = "priority",
        assignee_id: Optional[UUID] = None
    ) -> Tuple[List[HumanTask], int]:
        query = self.db.query(HumanTask).filter(HumanTask.tenant_id == tenant_id)
        
        if status and status != "all":
            query = query.filter(HumanTask.status == status)
        if priority and priority != "all":
            query = query.filter(HumanTask.priority == priority)
        if assignee_id:
            query = query.filter(HumanTask.assigned_to == assignee_id)
        
        # Sorting
        if sort == "priority":
            priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
            tasks = query.all()
            tasks.sort(key=lambda t: priority_order.get(t.priority, 99))
        elif sort == "deadline":
            query = query.order_by(HumanTask.deadline_at.asc().nullslast())
            tasks = query.all()
        else:  # created
            query = query.order_by(HumanTask.created_at.desc())
            tasks = query.all()
        
        return tasks, len(tasks)
    
    def get_task(self, task_id: UUID, tenant_id: UUID) -> Optional[HumanTask]:
        return self.db.query(HumanTask).filter(
            HumanTask.id == task_id,
            HumanTask.tenant_id == tenant_id
        ).first()
    
    def create_task(self, tenant_id: UUID, task_data: TaskCreate) -> HumanTask:
        task = HumanTask(
            tenant_id=tenant_id,
            title=task_data.title,
            description=task_data.description,
            priority=task_data.priority,
            assigned_to=task_data.assigned_to,
            context=task_data.context or {},
            options=task_data.options or [],
            status="pending"
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def update_task(self, task_id: UUID, tenant_id: UUID, task_data: TaskUpdate) -> Optional[HumanTask]:
        task = self.get_task(task_id, tenant_id)
        if not task:
            return None
        
        update_data = task_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(task, key, value)
        
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def claim_task(self, task_id: UUID, tenant_id: UUID, user_id: UUID) -> Optional[HumanTask]:
        task = self.get_task(task_id, tenant_id)
        if not task or task.status != "pending":
            return None
        
        task.status = "claimed"
        task.assigned_to = user_id
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def complete_task(self, task_id: UUID, tenant_id: UUID, resolution: dict) -> Optional[HumanTask]:
        task = self.get_task(task_id, tenant_id)
        if not task or task.status not in ["pending", "claimed"]:
            return None
        
        task.status = "completed"
        task.context = {**task.context, "resolution": resolution}
        self.db.commit()
        self.db.refresh(task)
        return task