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
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'animation-vendor': ['framer-motion', 'gsap'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/database'],
          'utils-vendor': ['date-fns', 'qrcode', 'jspdf', 'xlsx'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    open: true,
  },
  // Ensure environment variables are properly handled
  define: {
    'process.env': {}
  }
})
