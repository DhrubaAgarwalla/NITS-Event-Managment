import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React chunks
          'react-vendor': ['react', 'react-dom'],

          // Animation libraries (split for better caching)
          'framer-motion': ['framer-motion'],
          'gsap-vendor': ['gsap', '@studio-freight/lenis'],

          // Three.js ecosystem
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],

          // Firebase (split by functionality)
          'firebase-core': ['firebase/app'],
          'firebase-auth': ['firebase/auth', 'firebase/database'],
          'firebase-analytics': ['firebase/analytics'],

          // Charts and data visualization
          'charts-vendor': ['recharts'],

          // Utility libraries (split by size)
          'pdf-vendor': ['jspdf'],
          'excel-vendor': ['xlsx'],
          'utils-small': ['date-fns', 'qrcode']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // Enable compression with esbuild (faster and built-in)
    minify: 'esbuild',
    esbuild: {
      // Drop console logs in production for smaller bundle
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : ['debugger']
    }
  },
  server: {
    port: 3000,
    open: true,
  },
  // Ensure environment variables are properly handled
  define: {
    'process.env': {}
  },
  resolve: {
    alias: {
      // Ensure proper module resolution
      '@': '/src'
    }
  },
  optimizeDeps: {
    include: ['recharts', 'react', 'react-dom', 'framer-motion'],
    exclude: ['victory-vendor'],
    force: true
  }
})
