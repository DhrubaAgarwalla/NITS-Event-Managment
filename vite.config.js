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
        manualChunks: (id) => {
          // Vendor chunks for node_modules
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }

            // Animation libraries
            if (id.includes('framer-motion') || id.includes('gsap') || id.includes('@studio-freight/lenis')) {
              return 'animation-vendor';
            }

            // Three.js ecosystem
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-vendor';
            }

            // Firebase
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }

            // Charts and data visualization
            if (id.includes('recharts') || id.includes('victory-vendor')) {
              return 'charts-vendor';
            }

            // Utility libraries
            if (id.includes('date-fns') || id.includes('qrcode') || id.includes('jspdf') || id.includes('xlsx')) {
              return 'utils-vendor';
            }

            // Other vendor libraries
            return 'vendor';
          }
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
  },
  // Resolve configuration to handle problematic packages
  resolve: {
    alias: {
      // Handle victory-vendor resolution issues
      'victory-vendor/lib': 'victory-vendor/es'
    }
  },
  optimizeDeps: {
    include: ['recharts', 'victory-vendor']
  }
})
