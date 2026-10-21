export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  tenantId: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'analyst' | 'operator' | 'auditor';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  maxBots: number;
  maxWorkflows: number;
  features: {
    aiOrchestration: boolean;
    semanticAutomation: boolean;
    processMining: boolean;
    customIntegrations: boolean;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, any>;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}