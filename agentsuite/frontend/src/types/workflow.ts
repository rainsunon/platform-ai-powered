export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: number;
  status: WorkflowStatus;
  definition: WorkflowDefinition;
  schedule?: WorkflowSchedule;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'error' | 'archived';

export interface WorkflowDefinition {
  nodes: ProcessGraphNode[];
  edges: ProcessGraphEdge[];
  variables: WorkflowVariable[];
  triggers: WorkflowTrigger[];
}

export interface ProcessGraphNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}

export type NodeType = 'start' | 'end' | 'task' | 'decision' | 'human_task' | 'subprocess' | 'ai_skill';

export interface NodeData {
  label: string;
  description?: string;
  config: Record<string, any>;
  inputMapping?: Record<string, string>;
  outputMapping?: Record<string, string>;
  timeout?: number;
  retryConfig?: RetryConfig;
}

export interface ProcessGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: any;
  required: boolean;
}

export interface WorkflowTrigger {
  type: 'schedule' | 'webhook' | 'event' | 'manual';
  config: Record<string, any>;
}

export interface WorkflowSchedule {
  cron: string;
  timezone: string;
  enabled: boolean;
}

export interface RetryConfig {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelaySeconds: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  currentNode?: string;
  variables: Record<string, any>;
  events: ExecutionEvent[];
}

export interface ExecutionEvent {
  id: string;
  type: string;
  nodeId?: string;
  data: Record<string, any>;
  timestamp: string;
}