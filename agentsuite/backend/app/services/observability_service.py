from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timedelta
from app.models.event import ExecutionEvent
from app.models.workflow import Workflow, WorkflowExecution

class ObservabilityService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_process_graph(
        self,
        tenant_id: UUID,
        workflow_id: Optional[UUID] = None,
        time_range_hours: int = 24
    ) -> Dict[str, Any]:
        """Get process graph data for visualization."""
        cutoff = datetime.utcnow() - timedelta(hours=time_range_hours)
        
        # Get executions with their events
        executions_query = self.db.query(WorkflowExecution).filter(
            WorkflowExecution.tenant_id == tenant_id,
            WorkflowExecution.started_at >= cutoff
        )
        
        if workflow_id:
            executions_query = executions_query.filter(
                WorkflowExecution.workflow_id == workflow_id
            )
        
        executions = executions_query.order_by(
            WorkflowExecution.started_at.desc()
        ).limit(50).all()
        
        nodes = []
        edges = []
        seen_node_ids = set()
        
        for execution in executions:
            # Get the workflow for this execution
            workflow = self.db.query(Workflow).filter(
                Workflow.id == execution.workflow_id
            ).first()
            
            if workflow and workflow.definition:
                wf_nodes = workflow.definition.get('nodes', [])
                wf_edges = workflow.definition.get('edges', [])
                
                # Get events for this execution to determine statuses
                events = self.db.query(ExecutionEvent).filter(
                    ExecutionEvent.workflow_execution_id == execution.id
                ).all()
                
                node_statuses = {}
                for event in events:
                    node_id = event.data.get('node_id')
                    if node_id:
                        if event.event_type == 'node_completed':
                            node_statuses[node_id] = 'completed'
                        elif event.event_type == 'node_failed':
                            node_statuses[node_id] = 'failed'
                
                # Add nodes from workflow definition
                for wf_node in wf_nodes:
                    node_id = wf_node.get('id', '')
                    if node_id not in seen_node_ids:
                        node_data = wf_node.get('data', {}) or {}
                        nodes.append({
                            "id": node_id,
                            "type": wf_node.get('type', 'task'),
                            "label": node_data.get('label', wf_node.get('type', 'Node')),
                            "description": node_data.get('description', ''),
                            "status": node_statuses.get(node_id, 'pending'),
                            "metrics": {
                                "execution_id": str(execution.id),
                                "execution_status": execution.status
                            }
                        })
                        seen_node_ids.add(node_id)
                
                # Add edges from workflow definition
                for wf_edge in wf_edges:
                    edge_id = wf_edge.get('id', f"{wf_edge['source']}-{wf_edge['target']}")
                    edges.append({
                        "id": edge_id,
                        "source": wf_edge['source'],
                        "target": wf_edge['target'],
                        "label": wf_edge.get('label', ''),
                        "animated": True
                    })
        
        return {
            "nodes": nodes,
            "edges": edges,
            "total_events": len(executions),
            "time_range_hours": time_range_hours
        }
    
    def get_logs(
        self,
        tenant_id: UUID,
        workflow_execution_id: Optional[UUID] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get execution logs."""
        query = self.db.query(ExecutionEvent).filter(
            ExecutionEvent.tenant_id == tenant_id
        )
        
        if workflow_execution_id:
            query = query.filter(
                ExecutionEvent.workflow_execution_id == workflow_execution_id
            )
        
        events = query.order_by(
            ExecutionEvent.timestamp.desc()
        ).limit(limit).all()
        
        return [
            {
                "id": str(e.id),
                "event_type": e.event_type,
                "data": e.data,
                "timestamp": e.timestamp.isoformat(),
                "workflow_execution_id": str(e.workflow_execution_id) if e.workflow_execution_id else None
            }
            for e in events
        ]
    
    def record_event(
        self,
        tenant_id: UUID,
        workflow_execution_id: Optional[UUID],
        event_type: str,
        data: Dict[str, Any]
    ) -> ExecutionEvent:
        """Record an execution event."""
        event = ExecutionEvent(
            tenant_id=tenant_id,
            workflow_execution_id=workflow_execution_id,
            event_type=event_type,
            data=data
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event