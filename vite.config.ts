import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

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
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'afrikia-logo-white.svg'],
      manifest: {
        name: 'Kasuku — Calendrier Culturel Africain',
        short_name: 'Kasuku',
        description: 'Explorez les événements culturels africains passés et présents.',
        theme_color: '#E67E22',
        background_color: '#FAF8F5',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'fr',
        categories: ['education', 'lifestyle'],
        icons: [
          { src: '/icons/icon-72x72.png',   sizes: '72x72',   type: 'image/png' },
          { src: '/icons/icon-96x96.png',   sizes: '96x96',   type: 'image/png' },
          { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          {
            src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell — mise en cache agressive
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // Ne pas intercepter /immersive/* — servi par Next.js séparé
        navigateFallbackDenylist: [/^\/immersive/],
        runtimeCaching: [

          // ── Images MinIO — immuables, cache long ─────────────────────────
          {
            urlPattern: /^https:\/\/kasuku\.afrikia\.org\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'kasuku-images',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Auth — jamais en cache (données sensibles) ───────────────────
          {
            urlPattern: /^https:\/\/kasuku\.afrikia\.org\/api\/v1\/auth\/.*/i,
            handler: 'NetworkOnly',
          },

          // ── Contenu public — StaleWhileRevalidate ────────────────────────
          // Affiche instantanément depuis le cache, rafraîchit en arrière-plan.
          // Endpoints : events, calendar-days, timelines, modules, themes, featured
          {
            urlPattern: /^https:\/\/kasuku\.afrikia\.org\/api\/v1\/(events|timelines|modules|themes|featured|sources|countries)\b.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'kasuku-content',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 jours
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Reste de l'API — NetworkFirst rapide (3s) ────────────────────
          // Données utilisateur (favoris, profil) : réseau d'abord, cache en fallback
          {
            urlPattern: /^https:\/\/kasuku\.afrikia\.org\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'kasuku-api-misc',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 3, // fail fast (vs 10s avant)
            },
          },

          // ── Google Fonts ─────────────────────────────────────────────────
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // Page affichée hors-ligne si toutes les stratégies échouent
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
