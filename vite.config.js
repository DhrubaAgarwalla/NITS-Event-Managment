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
          'react-router': ['react-router-dom'],

          // Animation and UI chunks
          'animation-vendor': ['framer-motion', 'gsap', '@studio-freight/lenis'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],

          // Firebase chunks
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/database', 'firebase/analytics'],

          // Utility chunks
          'utils-vendor': ['date-fns', 'qrcode', 'jspdf', 'xlsx'],
          'image-vendor': ['react-lazy-load-image-component'],

          // Chart and data visualization
          'charts-vendor': ['victory-vendor'],

          // Large components that can be lazy loaded
          'admin-components': [
            './src/components/AdminDashboard.jsx',
            './src/components/AdminEventEditor.jsx',
            './src/components/AdminClubEditor.jsx'
          ],
          'dashboard-components': [
            './src/components/ClubDashboard.jsx',
            './src/components/DataPipelineDashboard.jsx'
          ],
          'scanner-components': [
            './src/components/QRScanner.jsx',
            './src/components/AttendanceManagement.jsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // Enable compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
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
