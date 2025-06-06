/**
 * Automation Scheduler Service
 * Manages different types of automation schedules and triggers
 */

import backgroundAutomationService from './backgroundAutomationService';
import logger from '../utils/logger';

class AutomationScheduler {
  constructor() {
    this.schedules = new Map();
    this.isInitialized = false;
    this.timezone = 'Asia/Kolkata';
  }

  /**
   * Initialize the scheduler
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.log('🕐 Initializing Automation Scheduler...');

      // Set up default schedules
      await this.setupDefaultSchedules();

      // Start background automation service
      await backgroundAutomationService.start();

      this.isInitialized = true;
      logger.log('✅ Automation Scheduler initialized successfully');

    } catch (error) {
      logger.error('❌ Failed to initialize Automation Scheduler:', error);
      throw error;
    }
  }

  /**
   * Set up default automation schedules
   */
  async setupDefaultSchedules() {
    // Daily background automation (every day at 8 AM)
    this.addSchedule('background_automation', {
      type: 'cron',
      schedule: '0 8 * * *', // 8 AM daily
      timezone: this.timezone,
      enabled: true,
      description: 'Daily background automation for events'
    });

    // Hourly comprehensive check (every hour)
    this.addSchedule('hourly_check', {
      type: 'interval',
      interval: 60 * 60 * 1000, // 1 hour
      enabled: true,
      description: 'Comprehensive hourly automation check'
    });

    // Daily maintenance (every day at 2 AM IST)
    this.addSchedule('daily_maintenance', {
      type: 'cron',
      schedule: '0 2 * * *', // 2 AM daily
      timezone: this.timezone,
      enabled: true,
      description: 'Daily maintenance and cleanup tasks'
    });

    // Weekly analytics update (every Sunday at 3 AM IST)
    this.addSchedule('weekly_analytics', {
      type: 'cron',
      schedule: '0 3 * * 0', // 3 AM every Sunday
      timezone: this.timezone,
      enabled: true,
      description: 'Weekly analytics and reporting'
    });

    logger.log('📅 Default automation schedules configured');
  }

  /**
   * Add a new schedule
   */
  addSchedule(name, config) {
    this.schedules.set(name, {
      ...config,
      name,
      createdAt: new Date().toISOString(),
      lastRun: null,
      runCount: 0,
      errors: []
    });

    logger.log(`📝 Added schedule: ${name} (${config.type})`);
  }

  /**
   * Remove a schedule
   */
  removeSchedule(name) {
    if (this.schedules.has(name)) {
      this.schedules.delete(name);
      logger.log(`🗑️ Removed schedule: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Enable/disable a schedule
   */
  toggleSchedule(name, enabled) {
    const schedule = this.schedules.get(name);
    if (schedule) {
      schedule.enabled = enabled;
      logger.log(`${enabled ? '✅' : '❌'} Schedule ${name} ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    }
    return false;
  }

  /**
   * Get all schedules
   */
  getSchedules() {
    return Array.from(this.schedules.values());
  }

  /**
   * Get schedule by name
   */
  getSchedule(name) {
    return this.schedules.get(name);
  }

  /**
   * Check if it's time to run scheduled tasks
   */
  async checkSchedules() {
    const now = new Date();

    for (const [name, schedule] of this.schedules) {
      if (!schedule.enabled) {
        continue;
      }

      try {
        let shouldRun = false;

        if (schedule.type === 'interval') {
          // Check interval-based schedules
          if (!schedule.lastRun || (now - new Date(schedule.lastRun)) >= schedule.interval) {
            shouldRun = true;
          }
        } else if (schedule.type === 'cron') {
          // Check cron-based schedules (simplified implementation)
          shouldRun = this.shouldRunCronSchedule(schedule, now);
        }

        if (shouldRun) {
          await this.runScheduledTask(name, schedule);
        }

      } catch (error) {
        logger.error(`❌ Error checking schedule ${name}:`, error);
        schedule.errors.push({
          timestamp: now.toISOString(),
          error: error.message
        });
      }
    }
  }

  /**
   * Run a scheduled task
   */
  async runScheduledTask(name, schedule) {
    try {
      logger.log(`🚀 Running scheduled task: ${name}`);

      schedule.lastRun = new Date().toISOString();
      schedule.runCount++;

      switch (name) {
        case 'background_automation':
        case 'hourly_check':
          await backgroundAutomationService.forceRun();
          break;

        case 'daily_maintenance':
          await this.runDailyMaintenance();
          break;

        case 'weekly_analytics':
          await this.runWeeklyAnalytics();
          break;

        default:
          logger.warn(`⚠️ Unknown scheduled task: ${name}`);
      }

      logger.log(`✅ Completed scheduled task: ${name}`);

    } catch (error) {
      logger.error(`❌ Failed to run scheduled task ${name}:`, error);
      schedule.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * Check if cron schedule should run (simplified)
   */
  shouldRunCronSchedule(schedule, now) {
    // This is a simplified cron implementation
    // For production, consider using a proper cron library like node-cron

    if (!schedule.lastRun) {
      return true; // First run
    }

    const lastRun = new Date(schedule.lastRun);
    const timeDiff = now - lastRun;

    // Prevent running more than once per hour for any cron job
    if (timeDiff < 60 * 60 * 1000) {
      return false;
    }

    // Simple daily check (2 AM)
    if (schedule.schedule === '0 2 * * *') {
      return now.getHours() === 2 && now.getMinutes() < 5 &&
             (now.getDate() !== lastRun.getDate() || now.getMonth() !== lastRun.getMonth());
    }

    // Simple weekly check (Sunday 3 AM)
    if (schedule.schedule === '0 3 * * 0') {
      return now.getDay() === 0 && now.getHours() === 3 && now.getMinutes() < 5 &&
             (now.getDate() !== lastRun.getDate() || now.getMonth() !== lastRun.getMonth());
    }

    return false;
  }

  /**
   * Run daily maintenance tasks
   */
  async runDailyMaintenance() {
    logger.log('🧹 Running daily maintenance tasks...');

    // Force a comprehensive automation run
    await backgroundAutomationService.forceRun();

    // Additional maintenance tasks can be added here
    logger.log('✅ Daily maintenance completed');
  }

  /**
   * Run weekly analytics tasks
   */
  async runWeeklyAnalytics() {
    logger.log('📊 Running weekly analytics tasks...');

    // Force a comprehensive automation run
    await backgroundAutomationService.forceRun();

    // Additional analytics tasks can be added here
    logger.log('✅ Weekly analytics completed');
  }

  /**
   * Get scheduler statistics
   */
  getStats() {
    const schedules = Array.from(this.schedules.values());

    return {
      totalSchedules: schedules.length,
      enabledSchedules: schedules.filter(s => s.enabled).length,
      totalRuns: schedules.reduce((sum, s) => sum + s.runCount, 0),
      totalErrors: schedules.reduce((sum, s) => sum + s.errors.length, 0),
      isInitialized: this.isInitialized,
      backgroundServiceStats: backgroundAutomationService.getStats()
    };
  }

  /**
   * Shutdown the scheduler
   */
  async shutdown() {
    logger.log('🛑 Shutting down Automation Scheduler...');

    await backgroundAutomationService.stop();
    this.schedules.clear();
    this.isInitialized = false;

    logger.log('✅ Automation Scheduler shutdown complete');
  }
}

// Create singleton instance
const automationScheduler = new AutomationScheduler();

export default automationScheduler;
