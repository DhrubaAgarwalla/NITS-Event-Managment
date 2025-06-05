/**
 * Automation Initializer
 * Initializes and starts all automation services
 */

import backgroundAutomationService from './backgroundAutomationService';
import automationScheduler from './automationScheduler';
import logger from '../utils/logger';

class AutomationInitializer {
  constructor() {
    this.isInitialized = false;
    this.services = {
      backgroundService: backgroundAutomationService,
      scheduler: automationScheduler
    };
  }

  /**
   * Initialize all automation services
   */
  async initialize() {
    if (this.isInitialized) {
      logger.log('🔄 Automation services already initialized');
      return;
    }

    try {
      logger.log('🚀 Initializing Event Manager Automation System...');

      // Initialize scheduler first
      await automationScheduler.initialize();

      // Background service is started by scheduler
      logger.log('✅ All automation services initialized successfully');

      this.isInitialized = true;

      // Set up error handlers
      this.setupErrorHandlers();

      // Log successful initialization
      logger.log('🎉 Event Manager Automation System is now running!');

    } catch (error) {
      logger.error('❌ Failed to initialize automation services:', error);
      throw error;
    }
  }

  /**
   * Setup error handlers for automation services
   */
  setupErrorHandlers() {
    // Handle uncaught errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        logger.error('🚨 Uncaught automation error:', event.error);
      });

      window.addEventListener('unhandledrejection', (event) => {
        logger.error('🚨 Unhandled automation promise rejection:', event.reason);
      });
    }
  }

  /**
   * Start automation services manually
   */
  async start() {
    if (!this.isInitialized) {
      await this.initialize();
    } else {
      await backgroundAutomationService.start();
    }
  }

  /**
   * Stop all automation services
   */
  async stop() {
    try {
      logger.log('🛑 Stopping automation services...');

      await backgroundAutomationService.stop();
      await automationScheduler.shutdown();

      this.isInitialized = false;
      logger.log('✅ All automation services stopped');

    } catch (error) {
      logger.error('❌ Error stopping automation services:', error);
    }
  }

  /**
   * Get status of all automation services
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      backgroundService: backgroundAutomationService.getStats(),
      scheduler: automationScheduler.getStats()
    };
  }

  /**
   * Force run automation cycle
   */
  async forceRun() {
    if (!this.isInitialized) {
      throw new Error('Automation services not initialized');
    }

    return await backgroundAutomationService.forceRun();
  }

  /**
   * Update automation interval
   */
  setInterval(intervalMs) {
    if (!this.isInitialized) {
      throw new Error('Automation services not initialized');
    }

    backgroundAutomationService.setInterval(intervalMs);
  }
}

// Create singleton instance
const automationInitializer = new AutomationInitializer();

// Auto-initialize when imported (for production)
if (typeof window !== 'undefined') {
  // Initialize after a short delay to allow other services to load
  setTimeout(() => {
    automationInitializer.initialize().catch(error => {
      // Silent error handling - don't log to console in production
      if (process.env.NODE_ENV === 'development') {
        logger.error('❌ Auto-initialization failed:', error);
      }
    });
  }, 5000); // 5 second delay
}

export default automationInitializer;
