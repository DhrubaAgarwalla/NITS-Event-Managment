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

          // Animation libraries
          'animation-vendor': ['framer-motion', 'gsap', '@studio-freight/lenis'],

          // Three.js ecosystem
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],

          // Firebase
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/database', 'firebase/analytics'],

          // Charts and data visualization
          'charts-vendor': ['recharts'],

          // Utility libraries
          'utils-vendor': ['date-fns', 'qrcode', 'jspdf', 'xlsx']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // Enable compression with esbuild (faster and built-in)
    minify: 'esbuild',
    esbuild: {
      // Don't drop console logs to help with debugging
      drop: ['debugger']
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
