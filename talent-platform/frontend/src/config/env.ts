function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

const timeout = Number(import.meta.env.VITE_API_TIMEOUT_MS);

export const appConfig = {
  env: import.meta.env.VITE_APP_ENV || 'local',
  apiBaseUrl: trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '/api'),
  apiProxyTarget: trimTrailingSlash(import.meta.env.VITE_API_PROXY_TARGET || 'http://localhost:8080'),
  apiTimeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 8000,
} as const;
