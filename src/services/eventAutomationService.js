/**
 * Event Automation Service
 * Handles automatic event management tasks
 */

import eventService from './eventService';
import { shouldAutoCloseRegistration, getEventStatus, getRegistrationStatus } from '../utils/eventUtils';
import logger from '../utils/logger';

const eventAutomationService = {
  /**
   * Auto-close registration for completed events
   * @param {Array} events - Array of events to check
   * @returns {Array} - Array of updated events
   */
  autoCloseRegistrations: async (events) => {
    const updatedEvents = [];
    
    for (const event of events) {
      try {
        const shouldClose = shouldAutoCloseRegistration(event);
        
        // If registration should be closed but is still open
        if (shouldClose && event.registration_open) {
          logger.log(`Auto-closing registration for event: ${event.title}`);
          
          const updatedEvent = await eventService.toggleRegistrationStatus(event.id, false);
          updatedEvents.push(updatedEvent);
          
          logger.log(`Registration auto-closed for event: ${event.title}`);
        }
      } catch (error) {
        logger.error(`Error auto-closing registration for event ${event.id}:`, error);
      }
    }
    
    return updatedEvents;
  },

  /**
   * Update event statuses based on current date
   * @param {Array} events - Array of events to check
   * @returns {Array} - Array of events with updated statuses
   */
  updateEventStatuses: async (events) => {
    const updatedEvents = [];
    
    for (const event of events) {
      try {
        const currentStatus = getEventStatus(event);
        
        // If the calculated status differs from stored status, update it
        if (event.status !== currentStatus) {
          logger.log(`Updating status for event ${event.title}: ${event.status} -> ${currentStatus}`);
          
          const updatedEvent = await eventService.updateEventStatus(event.id, currentStatus);
          updatedEvents.push(updatedEvent);
          
          logger.log(`Status updated for event: ${event.title}`);
        }
      } catch (error) {
        logger.error(`Error updating status for event ${event.id}:`, error);
      }
    }
    
    return updatedEvents;
  },

  /**
   * Send notifications for upcoming events
   * @param {Array} events - Array of events to check
   * @returns {Array} - Array of notification results
   */
  sendUpcomingEventNotifications: async (events) => {
    const notifications = [];
    const now = new Date();
    
    for (const event of events) {
      try {
        const startDate = new Date(event.start_date);
        const timeDiff = startDate - now;
        const hoursUntilStart = timeDiff / (1000 * 60 * 60);
        
        // Send notification 24 hours before event
        if (hoursUntilStart <= 24 && hoursUntilStart > 23) {
          notifications.push({
            eventId: event.id,
            type: '24_hour_reminder',
            message: `Event "${event.title}" starts in 24 hours`,
            timestamp: new Date().toISOString()
          });
        }
        
        // Send notification 1 hour before event
        if (hoursUntilStart <= 1 && hoursUntilStart > 0.5) {
          notifications.push({
            eventId: event.id,
            type: '1_hour_reminder',
            message: `Event "${event.title}" starts in 1 hour`,
            timestamp: new Date().toISOString()
          });
        }
        
        // Send notification when event starts
        if (hoursUntilStart <= 0 && hoursUntilStart > -0.5) {
          notifications.push({
            eventId: event.id,
            type: 'event_started',
            message: `Event "${event.title}" has started`,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        logger.error(`Error checking notifications for event ${event.id}:`, error);
      }
    }
    
    return notifications;
  },

  /**
   * Archive old completed events
   * @param {Array} events - Array of events to check
   * @param {number} daysOld - Number of days after completion to archive (default: 30)
   * @returns {Array} - Array of archived event IDs
   */
  archiveOldEvents: async (events, daysOld = 30) => {
    const archivedEvents = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    for (const event of events) {
      try {
        const eventStatus = getEventStatus(event);
        const endDate = new Date(event.end_date);
        
        // Archive events that completed more than X days ago
        if (eventStatus === 'completed' && endDate < cutoffDate && !event.is_archived) {
          logger.log(`Archiving old event: ${event.title}`);
          
          // Update event to mark as archived
          await eventService.updateEvent(event.id, { is_archived: true });
          archivedEvents.push(event.id);
          
          logger.log(`Event archived: ${event.title}`);
        }
      } catch (error) {
        logger.error(`Error archiving event ${event.id}:`, error);
      }
    }
    
    return archivedEvents;
  },

  /**
   * Run all automation tasks
   * @param {Array} events - Array of events to process
   * @returns {Object} - Summary of automation results
   */
  runAllAutomations: async (events) => {
    logger.log('Running event automation tasks...');
    
    const results = {
      registrationsClosed: [],
      statusesUpdated: [],
      notifications: [],
      eventsArchived: [],
      errors: []
    };
    
    try {
      // Auto-close registrations
      results.registrationsClosed = await eventAutomationService.autoCloseRegistrations(events);
      
      // Update event statuses
      results.statusesUpdated = await eventAutomationService.updateEventStatuses(events);
      
      // Send notifications
      results.notifications = await eventAutomationService.sendUpcomingEventNotifications(events);
      
      // Archive old events (events completed more than 30 days ago)
      results.eventsArchived = await eventAutomationService.archiveOldEvents(events, 30);
      
      logger.log('Event automation completed successfully', results);
    } catch (error) {
      logger.error('Error running event automations:', error);
      results.errors.push(error.message);
    }
    
    return results;
  },

  /**
   * Get automation summary for dashboard
   * @param {Array} events - Array of events
   * @returns {Object} - Automation summary
   */
  getAutomationSummary: (events) => {
    const summary = {
      totalEvents: events.length,
      needsRegistrationClosure: 0,
      needsStatusUpdate: 0,
      upcomingIn24Hours: 0,
      currentlyRunning: 0,
      readyForArchival: 0
    };
    
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    events.forEach(event => {
      // Check registration closure needs
      if (shouldAutoCloseRegistration(event) && event.registration_open) {
        summary.needsRegistrationClosure++;
      }
      
      // Check status update needs
      const currentStatus = getEventStatus(event);
      if (event.status !== currentStatus) {
        summary.needsStatusUpdate++;
      }
      
      // Check upcoming events
      const startDate = new Date(event.start_date);
      const timeDiff = startDate - now;
      const hoursUntilStart = timeDiff / (1000 * 60 * 60);
      
      if (hoursUntilStart <= 24 && hoursUntilStart > 0) {
        summary.upcomingIn24Hours++;
      }
      
      // Check currently running events
      if (currentStatus === 'ongoing') {
        summary.currentlyRunning++;
      }
      
      // Check events ready for archival
      const endDate = new Date(event.end_date);
      if (currentStatus === 'completed' && endDate < cutoffDate && !event.is_archived) {
        summary.readyForArchival++;
      }
    });
    
    return summary;
  }
};

export default eventAutomationService;
