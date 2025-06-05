/**
 * Background Automation Service
 * Runs automation tasks automatically without requiring user login
 */

import { ref, get, set, update } from 'firebase/database';
import { database } from '../lib/firebase';
import eventAutomationService from './eventAutomationService';
import eventService from './eventService';
import logger from '../utils/logger';

class BackgroundAutomationService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.automationInterval = 5 * 60 * 1000; // 5 minutes
    this.lastRunTime = null;
    this.stats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastError: null,
      eventsProcessed: 0,
      automationsExecuted: 0
    };
  }

  /**
   * Start the background automation service
   */
  async start() {
    if (this.isRunning) {
      logger.log('Background automation service is already running');
      return;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        logger.log('🤖 Starting Background Automation Service...');
      }
      this.isRunning = true;

      // Run initial automation
      await this.runAutomationCycle();

      // Set up recurring automation
      this.intervalId = setInterval(async () => {
        await this.runAutomationCycle();
      }, this.automationInterval);

      if (process.env.NODE_ENV === 'development') {
        logger.log(`✅ Background Automation Service started (interval: ${this.automationInterval / 1000}s)`);
      }

      // Log service status to Firebase
      await this.updateAutomationStatus('running', 'Background automation service started');

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('❌ Failed to start Background Automation Service:', error);
      }
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the background automation service
   */
  async stop() {
    if (!this.isRunning) {
      logger.log('Background automation service is not running');
      return;
    }

    try {
      logger.log('🛑 Stopping Background Automation Service...');
      this.isRunning = false;

      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }

      logger.log('✅ Background Automation Service stopped');

      // Log service status to Firebase
      await this.updateAutomationStatus('stopped', 'Background automation service stopped');

    } catch (error) {
      logger.error('❌ Error stopping Background Automation Service:', error);
    }
  }

  /**
   * Run a single automation cycle
   */
  async runAutomationCycle() {
    if (!this.isRunning) {
      return;
    }

    const startTime = new Date();
    this.stats.totalRuns++;

    try {
      if (process.env.NODE_ENV === 'development') {
        logger.log('🔄 Running automation cycle...');
      }

      // Get all events
      const events = await eventService.getAllEvents();
      if (!events || events.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          logger.log('📭 No events found for automation');
        }
        return;
      }

      this.stats.eventsProcessed = events.length;

      // Run all automation tasks
      const results = await eventAutomationService.runAllAutomations(events);

      // Count total automations executed
      const automationsCount =
        results.registrationsClosed.length +
        results.statusesUpdated.length +
        results.eventsArchived.length;

      this.stats.automationsExecuted += automationsCount;
      this.stats.successfulRuns++;
      this.lastRunTime = startTime.toISOString();

      // Log results only in development or when actions are taken
      if (automationsCount > 0 || process.env.NODE_ENV === 'development') {
        if (automationsCount > 0) {
          logger.log(`✅ Automation cycle completed: ${automationsCount} actions executed`, {
            registrationsClosed: results.registrationsClosed.length,
            statusesUpdated: results.statusesUpdated.length,
            eventsArchived: results.eventsArchived.length
          });
        } else if (process.env.NODE_ENV === 'development') {
          logger.log('✅ Automation cycle completed: No actions needed');
        }
      }

      // Log automation run to Firebase
      await this.logAutomationRun('success', results, startTime);

      // Update automation status
      await this.updateAutomationStatus('running', `Last run: ${automationsCount} actions executed`);

    } catch (error) {
      this.stats.failedRuns++;
      this.stats.lastError = error.message;

      logger.error('❌ Automation cycle failed:', error);

      // Log failed automation run to Firebase
      await this.logAutomationRun('error', { error: error.message }, startTime);

      // Update automation status
      await this.updateAutomationStatus('error', `Error: ${error.message}`);
    }
  }

  /**
   * Log automation run to Firebase
   */
  async logAutomationRun(status, results, startTime) {
    try {
      const logRef = ref(database, 'automation_logs');
      const newLogRef = ref(database, `automation_logs/${Date.now()}`);

      const logEntry = {
        timestamp: startTime.toISOString(),
        status,
        results,
        duration: Date.now() - startTime.getTime(),
        eventsProcessed: this.stats.eventsProcessed,
        type: 'background_automation'
      };

      await set(newLogRef, logEntry);
    } catch (error) {
      logger.error('Failed to log automation run:', error);
    }
  }

  /**
   * Update automation status in Firebase
   */
  async updateAutomationStatus(status, message) {
    try {
      const statusRef = ref(database, 'automation_status');

      const statusData = {
        status,
        message,
        lastUpdate: new Date().toISOString(),
        stats: this.stats,
        isRunning: this.isRunning,
        interval: this.automationInterval
      };

      await set(statusRef, statusData);
    } catch (error) {
      logger.error('Failed to update automation status:', error);
    }
  }

  /**
   * Get automation statistics
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      interval: this.automationInterval,
      uptime: this.isRunning ? Date.now() - (new Date(this.lastRunTime || Date.now())).getTime() : 0
    };
  }

  /**
   * Update automation interval
   */
  setInterval(newInterval) {
    if (newInterval < 60000) { // Minimum 1 minute
      throw new Error('Automation interval cannot be less than 1 minute');
    }

    this.automationInterval = newInterval;

    if (this.isRunning) {
      // Restart with new interval
      this.stop();
      setTimeout(() => this.start(), 1000);
    }

    logger.log(`🔧 Automation interval updated to ${newInterval / 1000}s`);
  }

  /**
   * Force run automation cycle (manual trigger)
   */
  async forceRun() {
    logger.log('🚀 Force running automation cycle...');
    await this.runAutomationCycle();
  }
}

// Create singleton instance
const backgroundAutomationService = new BackgroundAutomationService();

export default backgroundAutomationService;
