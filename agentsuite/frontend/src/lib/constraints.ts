export const APP_NAME = 'AgentSuite';
export const APP_VERSION = '1.0.0';
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://agentsuite-api.onrender.com' || 'http://localhost:8000';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

export const DATE_FORMATS = {
  SHORT: 'MMM DD, YYYY',
  LONG: 'MMMM DD, YYYY HH:mm',
  TIME: 'HH:mm:ss',
  RELATIVE: 'relative',
};

export const BOT_STATUS_COLORS = {
  idle: 'gray',
  running: 'green',
  error: 'red',
  offline: 'gray',
  maintenance: 'yellow',
} as const;

export const WORKFLOW_STATUS_COLORS = {
  draft: 'gray',
  active: 'green',
  paused: 'yellow',
  error: 'red',
  archived: 'gray',
} as const;

export const TASK_PRIORITY_COLORS = {
  low: 'green',
  medium: 'yellow',
  high: 'orange',
  critical: 'red',
} as const;

export const ROLE_PERMISSIONS = {
  admin: ['*'],
  analyst: ['view_analytics', 'create_workflow', 'edit_workflow', 'view_bots'],
  operator: ['view_bots', 'execute_workflow', 'view_tasks', 'resolve_tasks'],
  auditor: ['view_analytics', 'view_logs', 'view_audit_trail'],
} as const;

export const WEBSOCKET_EVENTS = {
  BOT_STATUS_CHANGE: 'bot.status.change',
  WORKFLOW_EXECUTION_UPDATE: 'workflow.execution.update',
  NEW_HUMAN_TASK: 'human.task.new',
  LOG_ENTRY: 'log.entry',
  METRICS_UPDATE: 'metrics.update',
} as const;