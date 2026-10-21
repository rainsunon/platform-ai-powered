import { apiClient } from '../lib/axios';

interface ProcessGraphParams {
  time_range_hours?: number;
  workflowId?: string;
}

interface LogStreamParams {
  workflow_execution_id?: string;
  botId?: string;
  level?: string;
  limit?: number;
}

interface AnalyticsParams {
  timeRange: string;
  metric: string;
  groupBy?: string;
}

export const observabilityService = {
  getProcessGraph: async (params?: ProcessGraphParams) => {
    const { data } = await apiClient.get('/observability/process-graph', { params });
    return data;
  },

  getLogs: async (params?: LogStreamParams) => {
    const { data } = await apiClient.get('/observability/logs', { params });
    return data;
  },

  // ✅ Replaced SSE with regular polling
  getLogStream: (params: Record<string, string>): EventSource | null => {
    // EventSource doesn't support auth headers, so return null
    // The LogsPage will fall back to polling via getLogs()
    return null;
  },

  getAnalytics: async (params: AnalyticsParams) => {
    const { data } = await apiClient.get('/observability/analytics', { params });
    return data;
  },
};