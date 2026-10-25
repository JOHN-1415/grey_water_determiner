import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'GreyWater Guardian — Adaptive Water Quality & Filtration System',
        short_name: 'GreyWater Guardian',
        description: 'Adaptive water quality monitoring, rules engine assessment, and multi-stage filtration control.',
        theme_color: '#0ea5e9',
        background_color: '#090d16',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Cache application shell and static assets, but bypass caching for API calls
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*$/,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  base: './',
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
