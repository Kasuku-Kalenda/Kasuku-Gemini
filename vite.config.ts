import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    return {
      // Configuration pour le mode preview (Render utilise npm run preview)
      preview: {
        allowedHosts: [
          'kasuku-gemini-3.onrender.com'
        ],
        port: 4173, // Port par défaut de Vite preview
        host: '0.0.0.0'
      },
      // Configuration pour le mode dev local
      server: {
        port: 3000,
        host: '0.0.0.0',
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
