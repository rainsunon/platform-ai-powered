export interface Bot {
  id: string;
  name: string;
  type: BotType;
  status: BotStatus;
  capabilities: BotCapability[];
  configuration: Record<string, any>;
  metrics: BotMetrics;
  tenantId: string;
  lastHeartbeat?: string;
  createdAt: string;
  updatedAt: string;
}

export type BotType = 'web' | 'desktop' | 'api' | 'ai_agent' | 'email' | 'scraper';
export type BotStatus = 'idle' | 'running' | 'error' | 'offline' | 'maintenance';

export interface BotCapability {
  name: string;
  description?: string;
  parameters?: Record<string, any>;
}

export interface BotMetrics {
  tasksCompleted: number;
  tasksFailed: number;
  averageExecutionTimeMs: number;
  successRate: number;
  uptimePercentage: number;
  lastTaskCompletedAt?: string;
}