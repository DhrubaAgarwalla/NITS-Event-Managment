/**
 * Automation Utilities
 * Helper functions for automation tasks and smart automation features
 */

import { getEventStatus, shouldAutoCloseRegistration } from './eventUtils';
import logger from './logger';

/**
 * Smart automation utilities for enhanced event management
 */
export const automationUtils = {
  /**
   * Analyze events and suggest automation actions
   * @param {Array} events - Array of events
   * @returns {Object} - Automation suggestions
   */
  analyzeEventsForAutomation: (events) => {
    const suggestions = {
      urgent: [],
      recommended: [],
      informational: [],
      statistics: {
        totalEvents: events.length,
        upcomingEvents: 0,
        ongoingEvents: 0,
        completedEvents: 0,
        needsAttention: 0
      }
    };

    const now = new Date();

    events.forEach(event => {
      const status = getEventStatus(event);
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      const hoursUntilStart = (startDate - now) / (1000 * 60 * 60);
      const hoursUntilEnd = (endDate - now) / (1000 * 60 * 60);

      // Update statistics
      suggestions.statistics[`${status}Events`]++;

      // Check for urgent actions needed
      if (shouldAutoCloseRegistration(event) && event.registration_open) {
        suggestions.urgent.push({
          eventId: event.id,
          eventTitle: event.title,
          action: 'close_registration',
          reason: 'Registration should be closed (event completed or deadline passed)',
          priority: 'high'
        });
        suggestions.statistics.needsAttention++;
      }

      // Check for status mismatches
      if (event.status !== status) {
        suggestions.urgent.push({
          eventId: event.id,
          eventTitle: event.title,
          action: 'update_status',
          reason: `Status should be "${status}" but is currently "${event.status}"`,
          priority: 'high',
          currentStatus: event.status,
          suggestedStatus: status
        });
        suggestions.statistics.needsAttention++;
      }

      // Check for events starting soon without proper setup
      if (status === 'upcoming' && hoursUntilStart <= 24 && hoursUntilStart > 0) {
        if (!event.image_url) {
          suggestions.recommended.push({
            eventId: event.id,
            eventTitle: event.title,
            action: 'add_image',
            reason: 'Event starts within 24 hours but has no banner image',
            priority: 'medium'
          });
        }

        if (!event.registration_deadline) {
          suggestions.recommended.push({
            eventId: event.id,
            eventTitle: event.title,
            action: 'set_deadline',
            reason: 'Event starts within 24 hours but has no registration deadline',
            priority: 'medium'
          });
        }
      }

      // Check for ongoing events without recent activity
      if (status === 'ongoing') {
        suggestions.informational.push({
          eventId: event.id,
          eventTitle: event.title,
          action: 'monitor_event',
          reason: 'Event is currently running - monitor for attendance and issues',
          priority: 'info',
          hoursRemaining: Math.max(0, hoursUntilEnd)
        });
      }

      // Check for old completed events that can be archived
      if (status === 'completed' && hoursUntilEnd < -720 && !event.is_archived) { // 30 days
        suggestions.recommended.push({
          eventId: event.id,
          eventTitle: event.title,
          action: 'archive_event',
          reason: 'Event completed more than 30 days ago and can be archived',
          priority: 'low'
        });
      }
    });

    return suggestions;
  },

  /**
   * Get automation priority score for an event
   * @param {Object} event - Event object
   * @returns {number} - Priority score (higher = more urgent)
   */
  getAutomationPriority: (event) => {
    let score = 0;
    const status = getEventStatus(event);
    const now = new Date();
    const startDate = new Date(event.start_date);
    const hoursUntilStart = (startDate - now) / (1000 * 60 * 60);

    // High priority: Status mismatches
    if (event.status !== status) {
      score += 100;
    }

    // High priority: Registration should be closed
    if (shouldAutoCloseRegistration(event) && event.registration_open) {
      score += 90;
    }

    // Medium priority: Events starting soon
    if (status === 'upcoming' && hoursUntilStart <= 24 && hoursUntilStart > 0) {
      score += 50;
    }

    // Medium priority: Ongoing events
    if (status === 'ongoing') {
      score += 40;
    }

    // Low priority: Missing optional data
    if (!event.image_url) score += 10;
    if (!event.registration_deadline) score += 5;

    return score;
  },

  /**
   * Check if automation should run based on event changes
   * @param {Object} oldEvent - Previous event state
   * @param {Object} newEvent - Current event state
   * @returns {boolean} - Whether automation should run
   */
  shouldTriggerAutomation: (oldEvent, newEvent) => {
    if (!oldEvent || !newEvent) return true;

    // Check for significant changes that require automation
    const significantFields = [
      'start_date',
      'end_date',
      'registration_deadline',
      'registration_open',
      'status'
    ];

    return significantFields.some(field => oldEvent[field] !== newEvent[field]);
  },

  /**
   * Generate automation report
   * @param {Object} automationResults - Results from automation run
   * @returns {Object} - Formatted report
   */
  generateAutomationReport: (automationResults) => {
    const report = {
      summary: {
        totalActions: 0,
        successfulActions: 0,
        failedActions: 0,
        timestamp: new Date().toISOString()
      },
      actions: {
        registrationsClosed: automationResults.registrationsClosed || [],
        statusesUpdated: automationResults.statusesUpdated || [],
        eventsArchived: automationResults.eventsArchived || [],
        notifications: automationResults.notifications || []
      },
      errors: automationResults.errors || [],
      recommendations: []
    };

    // Calculate totals
    Object.values(report.actions).forEach(actionArray => {
      if (Array.isArray(actionArray)) {
        report.summary.totalActions += actionArray.length;
        report.summary.successfulActions += actionArray.length;
      }
    });

    report.summary.failedActions = report.errors.length;

    // Generate recommendations based on results
    if (report.actions.registrationsClosed.length > 0) {
      report.recommendations.push({
        type: 'success',
        message: `Successfully closed registration for ${report.actions.registrationsClosed.length} events`
      });
    }

    if (report.actions.statusesUpdated.length > 0) {
      report.recommendations.push({
        type: 'success',
        message: `Updated status for ${report.actions.statusesUpdated.length} events`
      });
    }

    if (report.errors.length > 0) {
      report.recommendations.push({
        type: 'warning',
        message: `${report.errors.length} automation tasks failed - review error logs`
      });
    }

    if (report.summary.totalActions === 0) {
      report.recommendations.push({
        type: 'info',
        message: 'No automation actions were needed - all events are properly configured'
      });
    }

    return report;
  },

  /**
   * Validate event data for automation
   * @param {Object} event - Event object
   * @returns {Object} - Validation result
   */
  validateEventForAutomation: (event) => {
    const validation = {
      isValid: true,
      warnings: [],
      errors: []
    };

    // Required fields
    if (!event.id) {
      validation.errors.push('Event ID is missing');
      validation.isValid = false;
    }

    if (!event.title) {
      validation.errors.push('Event title is missing');
      validation.isValid = false;
    }

    if (!event.start_date) {
      validation.errors.push('Event start date is missing');
      validation.isValid = false;
    }

    if (!event.end_date) {
      validation.errors.push('Event end date is missing');
      validation.isValid = false;
    }

    // Date validation
    if (event.start_date && event.end_date) {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);

      if (startDate >= endDate) {
        validation.errors.push('Event start date must be before end date');
        validation.isValid = false;
      }
    }

    // Warnings for missing optional data
    if (!event.image_url) {
      validation.warnings.push('Event banner image is missing');
    }

    if (!event.registration_deadline) {
      validation.warnings.push('Registration deadline is not set');
    }

    if (typeof event.registration_open !== 'boolean') {
      validation.warnings.push('Registration status is not properly set');
    }

    return validation;
  },

  /**
   * Get next automation run time
   * @param {number} intervalMs - Automation interval in milliseconds
   * @param {string} lastRunTime - Last run timestamp
   * @returns {Object} - Next run info
   */
  getNextAutomationTime: (intervalMs, lastRunTime) => {
    const now = new Date();
    const lastRun = lastRunTime ? new Date(lastRunTime) : new Date(0);
    const nextRun = new Date(lastRun.getTime() + intervalMs);

    return {
      nextRunTime: nextRun.toISOString(),
      timeUntilNext: Math.max(0, nextRun - now),
      isOverdue: now > nextRun,
      formattedTimeUntilNext: formatDuration(Math.max(0, nextRun - now))
    };
  }
};

/**
 * Format duration in milliseconds to human readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} - Formatted duration
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export default automationUtils;
