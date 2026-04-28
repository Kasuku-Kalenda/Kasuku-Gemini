import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      // Dev: proxyfier /api vers l'API Fastify locale (port 4000)
      // Prod: nginx gère ce routing directement
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      // Dev: proxyfier /storage vers MinIO local (port 9000)
      '/storage': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/storage/, '/kasuku-media'),
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
