/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { naverBlogApiPlugin } from './vite-plugin-naver-blog-api.js';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react(), tailwindcss(), naverBlogApiPlugin(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icon.svg', 'apple-touch-icon.png', 'favicon.ico'],
    manifest: {
      name: '어푸!',
      short_name: '어푸!',
      description: '어푸! — 수영장 찾기 · 수영 운동 기록',
      theme_color: '#e8f4fc',
      background_color: '#e8f4fc',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      lang: 'ko',
      icons: [{
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      }, {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }, {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [{
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-api',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24
          }
        }
      }]
    }
  })],
  server: {
    port: 3000,
    host: true,
    allowedHosts: ['sixteen-dissuade-outmost.ngrok-free.dev']
  },
  test: {
    projects: [{
      extends: true,
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.js',
        css: false
      }
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});