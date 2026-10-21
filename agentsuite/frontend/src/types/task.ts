export interface HumanTask {
  id: string;
  workflowExecutionId: string;
  workflowName: string;
  nodeId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'claimed' | 'completed' | 'escalated';
  assignedTo?: string;
  claimedBy?: string;
  context: TaskContext;
  options: TaskOption[];
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskContext {
  originalDocument?: string;
  processState: Record<string, any>;
  botActions: BotAction[];
  screenshots: string[];
  relevantData: Record<string, any>;
}

export interface BotAction {
  timestamp: string;
  action: string;
  target: string;
  result: string;
  confidence: number;
}

export interface TaskOption {
  id: string;
  label: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  reasoning: string;
}