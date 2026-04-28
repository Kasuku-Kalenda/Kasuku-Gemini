import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    return {
      // Configuration pour le mode preview (Render utilise npm run preview)
      preview: {
        allowedHosts: [
          'kasukukalenda.onrender.com'
        ],
        port: 4173, // Port par défaut de Vite preview
        host: '0.0.0.0'
      },
      // Configuration pour le mode dev local
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Dev : proxyfier /api vers l'API Fastify locale (port 4000)
          // Prod : nginx gère ce routing directement
          '/api': {
            target: 'http://localhost:4000',
            changeOrigin: true,
          },
          // Dev : proxyfier /storage vers MinIO local (port 9000)
          '/storage': {
            target: 'http://localhost:9000',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/storage/, '/kasuku-media'),
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
