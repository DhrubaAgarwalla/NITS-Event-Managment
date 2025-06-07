import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/mobile.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import lcpOptimizer from './utils/lcpOptimizer'

// Initialize PWA service
import './services/pwaService.js'

// Initialize LCP optimization
lcpOptimizer.init();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
