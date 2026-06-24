import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Local-first PWA. The service worker precaches the app shell so the bakery's
// recipe book opens instantly and works fully offline once installed.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: "Tova's Bakery — Recipe Book",
        short_name: "Tova's Recipes",
        description:
          'Bake-mode-first recipe book for Tova’s Bakery. Works offline once installed.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1a120b',
        theme_color: '#1a120b',
        categories: ['food', 'productivity', 'lifestyle'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: {
        // Keep the SW off in dev so HMR is not intercepted; it is active in build/preview.
        enabled: false,
      },
    }),
  ],
  worker: {
    format: 'es',
  },
})
