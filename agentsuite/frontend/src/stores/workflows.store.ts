import { create } from 'zustand';
import { Workflow, WorkflowDefinition } from '../types/workflow';
import { workflowsService } from '../services/workflows.service';

interface WorkflowStore {
  currentWorkflow: Workflow | null;
  isLoading: boolean;
  error: string | null;
  
  loadWorkflow: (workflowId: string) => Promise<void>;
  updateWorkflow: (workflowId: string, updates: Partial<Workflow>) => Promise<void>;
  saveDefinition: (workflowId: string, definition: WorkflowDefinition) => Promise<void>;
  clearWorkflow: () => void;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  currentWorkflow: null,
  isLoading: false,
  error: null,

  loadWorkflow: async (workflowId: string) => {
    set({ isLoading: true, error: null });
    try {
      const workflow = await workflowsService.getWorkflow(workflowId);
      set({ currentWorkflow: workflow, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.detail || 'Failed to load workflow',
        isLoading: false,
      });
    }
  },

  updateWorkflow: async (workflowId: string, updates: Partial<Workflow>) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await workflowsService.updateWorkflow(workflowId, updates);
      set({ currentWorkflow: updated, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.detail || 'Failed to update workflow',
        isLoading: false,
      });
      throw error;
    }
  },

  saveDefinition: async (workflowId: string, definition: WorkflowDefinition) => {
    set({ isLoading: true, error: null });
    try {
      // ✅ Include status change when saving definition
      const updated = await workflowsService.updateWorkflow(workflowId, { 
        definition,
        status: 'active',  // Move to active when workflow has been configured
      });
      set({ currentWorkflow: updated, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.detail || 'Failed to save definition',
        isLoading: false,
      });
      throw error;
    }
  },

  clearWorkflow: () => {
    set({ currentWorkflow: null, error: null });
  },
}));