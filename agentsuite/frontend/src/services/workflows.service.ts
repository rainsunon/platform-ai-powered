import { apiClient } from '../lib/axios';
import { Workflow, WorkflowExecution, ProcessGraphNode, ProcessGraphEdge } from '../types/workflow';
import { PaginatedResponse } from '../types/common';

interface WorkflowListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

interface CreateWorkflowData {
  name: string;
  description?: string;
  definition?: {
    nodes: ProcessGraphNode[];
    edges: ProcessGraphEdge[];
  };
}

export const workflowsService = {
  listWorkflows: async (params?: WorkflowListParams): Promise<PaginatedResponse<Workflow>> => {
    const { data } = await apiClient.get<PaginatedResponse<Workflow>>('/workflows', { params });
    return data;
  },

  getWorkflow: async (workflowId: string): Promise<Workflow> => {
    const { data } = await apiClient.get<Workflow>(`/workflows/${workflowId}`);
    return data;
  },

  createWorkflow: async (workflowData: CreateWorkflowData): Promise<Workflow> => {
    const { data } = await apiClient.post<Workflow>('/workflows', workflowData);
    return data;
  },

  updateWorkflow: async (workflowId: string, updates: Partial<Workflow>): Promise<Workflow> => {
    const { data } = await apiClient.put<Workflow>(`/workflows/${workflowId}`, updates);
    return data;
  },

  deleteWorkflow: async (workflowId: string): Promise<void> => {
    await apiClient.delete(`/workflows/${workflowId}`);
  },

  startWorkflow: async (workflowId: string, variables?: Record<string, any>): Promise<WorkflowExecution> => {
    const { data } = await apiClient.post<WorkflowExecution>(`/workflows/${workflowId}/start`, { variables });
    return data;
  },

  pauseWorkflow: async (executionId: string): Promise<void> => {
    await apiClient.post(`/workflows/executions/${executionId}/pause`);
  },

  resumeWorkflow: async (executionId: string): Promise<void> => {
    await apiClient.post(`/workflows/executions/${executionId}/resume`);
  },

  terminateWorkflow: async (executionId: string): Promise<void> => {
    await apiClient.post(`/workflows/executions/${executionId}/terminate`);
  },

  getExecution: async (executionId: string): Promise<WorkflowExecution> => {
    const { data } = await apiClient.get<WorkflowExecution>(`/workflows/executions/${executionId}`);
    return data;
  },

  listExecutions: async (workflowId: string, params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<WorkflowExecution>> => {
    const { data } = await apiClient.get<PaginatedResponse<WorkflowExecution>>(`/workflows/${workflowId}/executions`, { params });
    return data;
  },
};