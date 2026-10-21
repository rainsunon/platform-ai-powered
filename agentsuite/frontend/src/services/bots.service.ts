import { apiClient } from '../lib/axios';
import { Bot, BotMetrics } from '../types/bot';
import { PaginatedResponse } from '../types/common';

export interface BotTaskRequest {
  task_type: string;
  parameters: Record<string, any>;
}

export interface BotTaskResponse {
  task_id: string;
  bot_id: string;
  status: string;
  result?: Record<string, any>;
  error?: string;
  execution_time_ms: number;
}

export const botsService = {
  listBots: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    type?: string;
  }): Promise<PaginatedResponse<Bot>> => {
    const { data } = await apiClient.get<PaginatedResponse<Bot>>('/bots', { params });
    return data;
  },

  getBot: async (botId: string): Promise<Bot> => {
    const { data } = await apiClient.get<Bot>(`/bots/${botId}`);
    return data;
  },

  createBot: async (bot: { name: string; type: string; configuration?: Record<string, any> }): Promise<Bot> => {
    const { data } = await apiClient.post<Bot>('/bots', bot);
    return data;
  },

  updateBot: async (botId: string, updates: Partial<Bot>): Promise<Bot> => {
    const { data } = await apiClient.put<Bot>(`/bots/${botId}`, updates);
    return data;
  },

  deleteBot: async (botId: string): Promise<void> => {
    await apiClient.delete(`/bots/${botId}`);
  },

  getBotMetrics: async (botId: string): Promise<BotMetrics> => {
    const { data } = await apiClient.get<BotMetrics>(`/bots/${botId}/metrics`);
    return data;
  },

  startBot: async (botId: string): Promise<{ message: string; status: string }> => {
    const { data } = await apiClient.post(`/bots/${botId}/start`);
    return data;
  },

  stopBot: async (botId: string): Promise<{ message: string; status: string }> => {
    const { data } = await apiClient.post(`/bots/${botId}/stop`);
    return data;
  },

  restartBot: async (botId: string): Promise<{ message: string; status: string }> => {
    const { data } = await apiClient.post(`/bots/${botId}/restart`);
    return data;
  },

  // ✅ New: Execute a task on a bot
  executeTask: async (botId: string, task: BotTaskRequest): Promise<BotTaskResponse> => {
    const { data } = await apiClient.post<BotTaskResponse>(`/bots/${botId}/execute`, task);
    return data;
  },

  // ✅ New: Get bot capabilities
  getCapabilities: async (botId: string): Promise<{
    bot_id: string;
    bot_name: string;
    bot_type: string;
    capabilities: Bot['capabilities'];
  }> => {
    const { data } = await apiClient.get(`/bots/${botId}/capabilities`);
    return data;
  },
};