import { apiClient } from '../lib/axios';

export const llmService = {
  generateCircuit: async (prompt: string): Promise<{ nodes: any[]; edges: any[] }> => {
    try {
      const { data } = await apiClient.post('/llm/generate-circuit', { prompt });
      return data;
    } catch {
      // Return empty - the CircuitBoard has a fallback
      return { nodes: [], edges: [] };
    }
  },
};