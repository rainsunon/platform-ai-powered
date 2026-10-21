import { apiClient } from '../lib/axios';

export interface BotActivityItem {
  hour: string;
  timestamp: string;
  executions: number;
  successful: number;
  failed: number;
  other: number;
}

export interface RecentWorkflow {
  id: string;
  workflowId: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
}

export interface Alert {
  type: 'error' | 'warning' | 'info' | 'success';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  timestamp: string;
  action: string | null;
  actionUrl: string | null;
}

export interface DashboardMetrics {
  activeBots: number;
  totalBots: number;
  idleBots: number;
  errorBots: number;
  offlineBots: number;
  botUtilization: number;
  
  workflowsToday: number;
  workflowsYesterday: number;
  workflowsChange: number;
  totalWorkflows: number;
  activeWorkflows: number;
  draftWorkflows: number;
  pausedWorkflows: number;
  
  completedToday: number;
  failedToday: number;
  runningExecutions: number;
  
  successRate: number;
  successRateChange: number;
  
  avgResponseTime: number;
  avgResponseYesterday: number;
  responseTimeChange: number;
  
  pendingTasks: number;
  claimedTasks: number;
  completedTasks: number;
  highPriorityTasks: number;
  
  botActivity: BotActivityItem[];
  recentWorkflows: RecentWorkflow[];
  alerts: Alert[];
  timestamp: string;
}

export const dashboardService = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const { data } = await apiClient.get<DashboardMetrics>('/dashboard/metrics');
    return data;
  },

  getStats: async (): Promise<{
    totalBots: number;
    activeBots: number;
    totalWorkflows: number;
    pendingTasks: number;
    runningExecutions: number;
  }> => {
    const { data } = await apiClient.get('/dashboard/stats');
    return data;
  },
};