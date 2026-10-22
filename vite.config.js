import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { apiMiddleware } from './server/apiMiddleware.js';

/**
 * Custom Vite Plugin to integrate real-time backend API & disk database
 */
function backendApiPlugin() {
  return {
    name: 'scamsense-backend-api',
    configureServer(server) {
      server.middlewares.use(apiMiddleware);
    }
  };
}

export default defineConfig({
  plugins: [react(), backendApiPlugin()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api/predict': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      },
      '/api/model': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      },
      '/api/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  }
});
