import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

const MODE_ENV_FILE: Record<string, string> = {
  development: '.env.development',
  dev: '.env.dev',
  production: '.env.production',
};

export default defineConfig(({mode}) => {
  const envFile = MODE_ENV_FILE[mode] ?? '.env.development';
  const envPath = path.resolve(import.meta.dirname, envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({path: envPath, override: false, quiet: true});
  }
  const env = loadEnv(mode, import.meta.dirname, '');
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
