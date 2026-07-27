import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'JY School Management',
        short_name: 'JY School',
        description: 'Manage grades, attendance, and payments in real-time.',
        theme_color: '#243e8b',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icons/manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icons/manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icons/manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charts — only loaded on dashboard
          'vendor-charts': ['recharts'],
          // PDF generation — only loaded when exporting
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          // Excel — only loaded when importing/exporting sheets
          'vendor-excel': ['xlsx'],
          // Math rendering — only needed in question bank
          'vendor-math': ['katex'],
          // Real-time messaging
          'vendor-socket': ['socket.io-client'],
          // Date utilities
          'vendor-date': ['moment', 'date-fns'],
          // Query caching
          'vendor-query': ['@tanstack/react-query', '@tanstack/react-query-persist-client'],
        },
      },
    },
  },
  server: { proxy: { '/api': 'http://localhost:5000', '/uploads': 'http://localhost:5000' } },
})
