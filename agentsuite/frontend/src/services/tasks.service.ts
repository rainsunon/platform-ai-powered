import { apiClient } from '../lib/axios';
import { HumanTask } from '../types/task';

interface TaskListParams {
  status?: string;
  priority?: string;
  sort?: string;
  assignedTo?: string;
}

interface TaskResolution {
  optionId?: string | null;
  comment?: string;
  timestamp: string;
  action?: string;
}

export const tasksService = {
  listTasks: async (params?: TaskListParams): Promise<HumanTask[]> => {
    const { data } = await apiClient.get<HumanTask[]>('/humantasks', { params });
    return data;
  },

  getTask: async (taskId: string): Promise<HumanTask> => {
    const { data } = await apiClient.get<HumanTask>(`/humantasks/${taskId}`);
    return data;
  },

  claimTask: async (taskId: string): Promise<void> => {
    await apiClient.post(`/humantasks/${taskId}/claim`);
  },

  resolveTask: async (taskId: string, resolution: TaskResolution): Promise<void> => {
    await apiClient.post(`/humantasks/${taskId}/resolve`, resolution);
  },

  delegateTask: async (taskId: string, userId: string): Promise<void> => {
    await apiClient.post(`/humantasks/${taskId}/delegate`, { userId });
  },

  escalateTask: async (taskId: string, reason: string): Promise<void> => {
    await apiClient.post(`/humantasks/${taskId}/escalate`, { reason });
  },

  addComment: async (taskId: string, comment: string): Promise<void> => {
    await apiClient.post(`/humantasks/${taskId}/comments`, { comment });
  },
};