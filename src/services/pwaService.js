import logger from '../utils/logger';

/**
 * PWA Service - Handles Progressive Web App functionality
 * Including install prompts, service worker registration, and offline detection
 */
class PWAService {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isStandalone = false;
    this.installPromptShown = false;

    this.init();
  }

  /**
   * Initialize PWA service
   */
  init() {
    if (typeof window === 'undefined') return;

    // Check if app is already installed
    this.checkInstallStatus();

    // Register service worker
    this.registerServiceWorker();

    // Listen for install prompt
    this.setupInstallPrompt();

    // Setup offline detection
    this.setupOfflineDetection();

    logger.log('PWA Service initialized');
  }

  /**
   * Check if app is installed or running in standalone mode
   */
  checkInstallStatus() {
    // Check if running in standalone mode (installed)
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true;

    // Check if already installed (various methods)
    this.isInstalled = this.isStandalone ||
                       localStorage.getItem('pwa-installed') === 'true';

    logger.log(`PWA Status - Installed: ${this.isInstalled}, Standalone: ${this.isStandalone}`);
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      logger.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      logger.log('Service Worker registered successfully');

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            this.showUpdateAvailable();
          }
        });
      });

    } catch (error) {
      logger.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Setup install prompt handling
   */
  setupInstallPrompt() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (event) => {
      logger.log('PWA install prompt available');

      // Prevent the default prompt
      event.preventDefault();

      // Store the event for later use
      this.deferredPrompt = event;

      // Show custom install prompt after a delay (only on mobile)
      if (this.isMobile() && !this.isInstalled && !this.installPromptShown) {
        setTimeout(() => {
          this.showInstallPrompt();
        }, 3000); // Show after 3 seconds
      }
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      logger.log('PWA installed successfully');
      this.isInstalled = true;
      localStorage.setItem('pwa-installed', 'true');
      this.hideInstallPrompt();
    });

    // Fallback: Show install prompt even without beforeinstallprompt
    // This helps with browsers that don't always fire the event
    setTimeout(() => {
      if (this.isMobile() && !this.isInstalled && !this.installPromptShown && !this.deferredPrompt) {
        logger.log('Showing fallback install prompt');
        this.showFallbackInstallPrompt();
      }
    }, 5000); // Show after 5 seconds if no beforeinstallprompt
  }

  /**
   * Check if device is mobile
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  /**
   * Show fallback install prompt (when beforeinstallprompt doesn't fire)
   */
  showFallbackInstallPrompt() {
    if (this.installPromptShown || this.isInstalled) {
      return;
    }

    this.installPromptShown = true;

    // Create fallback install prompt
    const promptContainer = document.createElement('div');
    promptContainer.id = 'pwa-install-prompt';
    promptContainer.innerHTML = `
      <div class="pwa-prompt-overlay">
        <div class="pwa-prompt-content">
          <div class="pwa-prompt-header">
            <div class="pwa-prompt-icon">📱</div>
            <h3>Install NITS Events</h3>
            <button class="pwa-prompt-close" onclick="window.pwaService.hideInstallPrompt()">×</button>
          </div>
          <div class="pwa-prompt-body">
            <p>Add this app to your home screen for:</p>
            <ul>
              <li>✅ Faster access</li>
              <li>✅ Offline browsing</li>
              <li>✅ Full-screen experience</li>
              <li>✅ Quick launch</li>
            </ul>
            <p style="font-size: 0.9rem; opacity: 0.8; margin-top: 1rem;">
              Tap your browser's menu and select "Add to Home Screen" or "Install App"
            </p>
          </div>
          <div class="pwa-prompt-actions">
            <button class="pwa-prompt-install" onclick="window.pwaService.showInstallInstructions()">
              Show Instructions
            </button>
            <button class="pwa-prompt-later" onclick="window.pwaService.hideInstallPrompt()">
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    `;

    // Add styles (same as before)
    const styles = document.createElement('style');
    styles.textContent = this.getPromptStyles();

    document.head.appendChild(styles);
    document.body.appendChild(promptContainer);

    logger.log('PWA fallback install prompt shown');
  }

  /**
   * Show custom install prompt
   */
  showInstallPrompt() {
    if (this.installPromptShown || this.isInstalled || !this.deferredPrompt) {
      return;
    }

    this.installPromptShown = true;

    // Create custom install prompt
    const promptContainer = document.createElement('div');
    promptContainer.id = 'pwa-install-prompt';
    promptContainer.innerHTML = `
      <div class="pwa-prompt-overlay">
        <div class="pwa-prompt-content">
          <div class="pwa-prompt-header">
            <div class="pwa-prompt-icon">📱</div>
            <h3>Install NITS Events</h3>
            <button class="pwa-prompt-close" onclick="window.pwaService.hideInstallPrompt()">×</button>
          </div>
          <div class="pwa-prompt-body">
            <p>Get the full app experience with:</p>
            <ul>
              <li>✅ Faster loading</li>
              <li>✅ Offline access</li>
              <li>✅ Push notifications</li>
              <li>✅ Home screen access</li>
            </ul>
          </div>
          <div class="pwa-prompt-actions">
            <button class="pwa-prompt-install" onclick="window.pwaService.installApp()">
              Install App
            </button>
            <button class="pwa-prompt-later" onclick="window.pwaService.hideInstallPrompt()">
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = this.getPromptStyles();

    document.head.appendChild(styles);
    document.body.appendChild(promptContainer);

    logger.log('PWA install prompt shown');
  }

  /**
   * Get prompt styles
   */
  getPromptStyles() {
    return `
      .pwa-prompt-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 1rem;
        backdrop-filter: blur(5px);
      }

      .pwa-prompt-content {
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border-radius: 20px;
        max-width: 400px;
        width: 100%;
        color: white;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .pwa-prompt-header {
        padding: 1.5rem 1.5rem 0;
        text-align: center;
        position: relative;
      }

      .pwa-prompt-icon {
        font-size: 3rem;
        margin-bottom: 0.5rem;
      }

      .pwa-prompt-header h3 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        background: linear-gradient(to right, #6e44ff, #ff44e3);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      .pwa-prompt-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        font-size: 1.5rem;
        cursor: pointer;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .pwa-prompt-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      .pwa-prompt-body {
        padding: 1rem 1.5rem;
      }

      .pwa-prompt-body p {
        margin: 0 0 1rem;
        color: rgba(255, 255, 255, 0.8);
      }

      .pwa-prompt-body ul {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .pwa-prompt-body li {
        margin-bottom: 0.5rem;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
      }

      .pwa-prompt-actions {
        padding: 0 1.5rem 1.5rem;
        display: flex;
        gap: 1rem;
      }

      .pwa-prompt-install {
        flex: 1;
        background: linear-gradient(135deg, #6e44ff, #ff44e3);
        border: none;
        padding: 1rem;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      .pwa-prompt-install:hover {
        transform: translateY(-2px);
      }

      .pwa-prompt-later {
        flex: 1;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 1rem;
        border-radius: 12px;
        color: rgba(255, 255, 255, 0.8);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .pwa-prompt-later:hover {
        background: rgba(255, 255, 255, 0.15);
        color: white;
      }
    `;
  }

  /**
   * Show install instructions
   */
  showInstallInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    let instructions = '';

    if (isIOS) {
      instructions = `
        <h4>📱 iOS Instructions:</h4>
        <ol>
          <li>Tap the Share button <span style="font-size: 1.2em;">⬆️</span></li>
          <li>Scroll down and tap "Add to Home Screen"</li>
          <li>Tap "Add" to confirm</li>
        </ol>
      `;
    } else if (isAndroid) {
      instructions = `
        <h4>📱 Android Instructions:</h4>
        <ol>
          <li>Tap the menu button <span style="font-size: 1.2em;">⋮</span></li>
          <li>Select "Add to Home screen" or "Install app"</li>
          <li>Tap "Add" or "Install" to confirm</li>
        </ol>
      `;
    } else {
      instructions = `
        <h4>💻 Desktop Instructions:</h4>
        <ol>
          <li>Look for the install icon in your address bar</li>
          <li>Or use browser menu → "Install app"</li>
          <li>Click "Install" to confirm</li>
        </ol>
      `;
    }

    // Update the prompt content
    const promptContent = document.querySelector('.pwa-prompt-content');
    if (promptContent) {
      promptContent.innerHTML = `
        <div class="pwa-prompt-header">
          <div class="pwa-prompt-icon">📱</div>
          <h3>Install Instructions</h3>
          <button class="pwa-prompt-close" onclick="window.pwaService.hideInstallPrompt()">×</button>
        </div>
        <div class="pwa-prompt-body">
          ${instructions}
          <p style="font-size: 0.9rem; opacity: 0.8; margin-top: 1rem;">
            Once installed, you can launch the app from your home screen!
          </p>
        </div>
        <div class="pwa-prompt-actions">
          <button class="pwa-prompt-later" onclick="window.pwaService.hideInstallPrompt()" style="width: 100%;">
            Got it!
          </button>
        </div>
      `;
    }
  }

  /**
   * Hide install prompt
   */
  hideInstallPrompt() {
    const prompt = document.getElementById('pwa-install-prompt');
    if (prompt) {
      prompt.remove();
    }

    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');

    logger.log('PWA install prompt hidden');
  }

  /**
   * Install the app
   */
  async installApp() {
    if (!this.deferredPrompt) {
      logger.warn('No install prompt available');
      return;
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt();

      // Wait for user response
      const { outcome } = await this.deferredPrompt.userChoice;

      logger.log(`PWA install outcome: ${outcome}`);

      if (outcome === 'accepted') {
        this.isInstalled = true;
        localStorage.setItem('pwa-installed', 'true');
      }

      // Clear the prompt
      this.deferredPrompt = null;
      this.hideInstallPrompt();

    } catch (error) {
      logger.error('PWA install failed:', error);
    }
  }

  /**
   * Setup offline detection
   */
  setupOfflineDetection() {
    window.addEventListener('online', () => {
      logger.log('App back online');
      this.showConnectionStatus('online');
    });

    window.addEventListener('offline', () => {
      logger.log('App offline');
      this.showConnectionStatus('offline');
    });
  }

  /**
   * Show connection status
   */
  showConnectionStatus(status) {
    // Remove existing status
    const existing = document.getElementById('connection-status');
    if (existing) existing.remove();

    const statusEl = document.createElement('div');
    statusEl.id = 'connection-status';
    statusEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 25px;
      color: white;
      font-weight: 600;
      z-index: 9999;
      transition: all 0.3s ease;
      ${status === 'online'
        ? 'background: linear-gradient(135deg, #44ff44, #00cc00);'
        : 'background: linear-gradient(135deg, #ff4444, #cc0000);'
      }
    `;

    statusEl.textContent = status === 'online' ? '🟢 Back Online' : '🔴 Offline';

    document.body.appendChild(statusEl);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (statusEl.parentNode) {
        statusEl.remove();
      }
    }, 3000);
  }

  /**
   * Show update available notification
   */
  showUpdateAvailable() {
    const updateEl = document.createElement('div');
    updateEl.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: linear-gradient(135deg, #6e44ff, #ff44e3);
      color: white;
      padding: 1rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 9999;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    `;

    updateEl.innerHTML = `
      <span>🚀 New version available!</span>
      <button onclick="window.location.reload()" style="
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      ">Update</button>
    `;

    document.body.appendChild(updateEl);
  }

  /**
   * Get PWA status
   */
  getStatus() {
    return {
      isInstalled: this.isInstalled,
      isStandalone: this.isStandalone,
      canInstall: !!this.deferredPrompt,
      isOnline: navigator.onLine
    };
  }
}

// Create global instance
const pwaService = new PWAService();

// Make it globally available for onclick handlers
if (typeof window !== 'undefined') {
  window.pwaService = pwaService;
}

export default pwaService;
