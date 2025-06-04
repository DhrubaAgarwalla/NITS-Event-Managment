/**
 * Pipeline Data Service
 * Fetches real data from Firebase for the data pipeline dashboard
 */

import { ref, get, query, orderByChild, limitToLast, startAt, endAt } from 'firebase/database';
import { database } from '../lib/firebase';
import logger from '../utils/logger';

class PipelineDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.pipelineRunning = true; // Track pipeline state
    this.pipelineStartTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  }

  /**
   * Get cached data if available and not expired
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cached data
   */
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get pipeline status based on real data
   */
  async getPipelineStatus() {
    try {
      const cached = this.getCachedData('pipelineStatus');
      if (cached) return { success: true, data: cached };

      // Get total counts from Firebase (only for existing events)
      const [eventsCount, registrationsCount, clubsCount] = await Promise.all([
        this.getEventsCount(),
        this.getRegistrationsCountForExistingEvents(),
        this.getClubsCount()
      ]);

      // Get recent activity
      const recentRegistrations = await this.getRecentRegistrations(10);
      const lastProcessedAt = recentRegistrations.length > 0
        ? recentRegistrations[0].created_at
        : new Date().toISOString();

      const status = {
        isRunning: this.pipelineRunning,
        startTime: this.pipelineRunning ? this.pipelineStartTime : null,
        lastProcessedAt,
        totalRecordsProcessed: registrationsCount,
        totalBatchesProcessed: Math.ceil(registrationsCount / 50), // Assume 50 records per batch
        errors: 0, // Calculate based on failed operations if needed
        components: {
          ingestion: {
            status: this.pipelineRunning ? 'healthy' : 'stopped'
          },
          processing: {
            status: this.pipelineRunning ? 'healthy' : 'stopped'
          },
          warehouse: {
            status: this.pipelineRunning ? 'healthy' : 'stopped'
          }
        }
      };

      this.setCachedData('pipelineStatus', status);
      return { success: true, data: status };

    } catch (error) {
      logger.error('Error getting pipeline status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get analytics data based on real registrations
   */
  async getAnalytics() {
    try {
      const cached = this.getCachedData('analytics');
      if (cached) return { success: true, data: cached };

      // Get registration trends for last 30 days (default)
      const trends = await this.getRegistrationTrends(30);

      // Get processing statistics
      const processing = await this.getProcessingStats();

      // Get pipeline overview
      const pipeline = await this.getPipelineOverview();

      // Get top events by registration count
      const topEvents = await this.getTopEventsByRegistrations();

      const analytics = {
        trends,
        processing,
        pipeline,
        topEvents
      };

      this.setCachedData('analytics', analytics);
      return { success: true, data: analytics };

    } catch (error) {
      logger.error('Error getting analytics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get registration trends for different time periods
   */
  async getRegistrationTrendsForPeriod(period = 'month') {
    const periodConfig = {
      today: { days: 1, format: 'HH:mm' },
      week: { days: 7, format: 'MM/DD' },
      month: { days: 30, format: 'MM/DD' },
      year: { days: 365, format: 'MM/DD' },
      allTime: { days: 1000, format: 'MM/DD' } // Large number for all time
    };

    const config = periodConfig[period] || periodConfig.month;
    return this.getRegistrationTrends(config.days, config.format);
  }

  /**
   * Get processing statistics for different time periods
   */
  async getProcessingStatsForPeriod(period = 'month') {
    try {
      const now = new Date();
      let startDate;

      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'allTime':
        default:
          startDate = new Date(0); // Beginning of time
          break;
      }

      // Get registrations within the time period
      const registrationsRef = ref(database, 'registrations');
      const registrationsSnapshot = await get(registrationsRef);

      // Get all existing events to filter out deleted ones
      const eventsRef = ref(database, 'events');
      const eventsSnapshot = await get(eventsRef);

      if (!registrationsSnapshot.exists()) {
        return {
          recordsProcessed: 0,
          validationErrors: 0,
          transformationErrors: 0,
          featuresGenerated: 0
        };
      }

      // Create set of existing event IDs for fast lookup
      const existingEventIds = new Set();
      if (eventsSnapshot.exists()) {
        eventsSnapshot.forEach((childSnapshot) => {
          existingEventIds.add(childSnapshot.key);
        });
      }

      let totalRegistrations = 0;
      let validationErrors = 0;

      registrationsSnapshot.forEach((childSnapshot) => {
        const registration = childSnapshot.val();
        const registrationDate = new Date(registration.created_at);

        // Only count registrations for existing events
        if (registration.event_id && existingEventIds.has(registration.event_id) &&
            registrationDate >= startDate && registrationDate <= now) {
          totalRegistrations++;

          // Check for validation errors
          if (!registration.participant_name ||
              !registration.participant_email ||
              !registration.event_id) {
            validationErrors++;
          }
        }
      });

      return {
        recordsProcessed: totalRegistrations,
        validationErrors,
        transformationErrors: Math.floor(validationErrors * 0.1),
        featuresGenerated: totalRegistrations - validationErrors
      };

    } catch (error) {
      logger.error('Error getting processing stats for period:', error);
      return {
        recordsProcessed: 0,
        validationErrors: 0,
        transformationErrors: 0,
        featuresGenerated: 0
      };
    }
  }

  /**
   * Get registration trends for the last N days
   */
  async getRegistrationTrends(days = 30, dateFormat = 'MM/DD') {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      // Get all registrations
      const registrationsRef = ref(database, 'registrations');
      const registrationsSnapshot = await get(registrationsRef);

      // Get all existing events to filter out deleted ones
      const eventsRef = ref(database, 'events');
      const eventsSnapshot = await get(eventsRef);

      if (!registrationsSnapshot.exists()) {
        return [];
      }

      // Create set of existing event IDs for fast lookup
      const existingEventIds = new Set();
      if (eventsSnapshot.exists()) {
        eventsSnapshot.forEach((childSnapshot) => {
          existingEventIds.add(childSnapshot.key);
        });
      }

      // Group registrations by date (only for existing events)
      const dailyRegistrations = {};

      registrationsSnapshot.forEach((childSnapshot) => {
        const registration = childSnapshot.val();
        if (registration.created_at && registration.event_id && existingEventIds.has(registration.event_id)) {
          const date = new Date(registration.created_at);
          if (date >= startDate && date <= endDate) {
            const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
            dailyRegistrations[dateKey] = (dailyRegistrations[dateKey] || 0) + 1;
          }
        }
      });

      // Convert to array format for charts
      const trends = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split('T')[0];

        let displayDate;
        if (dateFormat === 'MM/DD') {
          displayDate = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
        } else {
          displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        trends.push({
          date: displayDate,
          registrations: dailyRegistrations[dateKey] || 0
        });
      }

      return trends;

    } catch (error) {
      logger.error('Error getting registration trends:', error);
      return [];
    }
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats() {
    try {
      const [totalRegistrations, totalEvents, totalClubs] = await Promise.all([
        this.getRegistrationsCountForExistingEvents(),
        this.getEventsCount(),
        this.getClubsCount()
      ]);

      // Calculate validation errors (registrations without required fields for existing events)
      const validationErrors = await this.getValidationErrorsForExistingEvents();

      return {
        recordsProcessed: totalRegistrations,
        validationErrors,
        transformationErrors: Math.floor(validationErrors * 0.1), // Assume 10% of validation errors are transformation errors
        featuresGenerated: totalRegistrations - validationErrors
      };

    } catch (error) {
      logger.error('Error getting processing stats:', error);
      return {
        recordsProcessed: 0,
        validationErrors: 0,
        transformationErrors: 0,
        featuresGenerated: 0
      };
    }
  }

  /**
   * Get pipeline overview
   */
  async getPipelineOverview() {
    try {
      const [totalRegistrations, totalEvents] = await Promise.all([
        this.getRegistrationsCountForExistingEvents(),
        this.getEventsCount()
      ]);

      return {
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        totalRecordsProcessed: totalRegistrations,
        totalBatchesProcessed: Math.ceil(totalRegistrations / 50),
        errors: 0
      };

    } catch (error) {
      logger.error('Error getting pipeline overview:', error);
      return {
        startTime: new Date().toISOString(),
        totalRecordsProcessed: 0,
        totalBatchesProcessed: 0,
        errors: 0
      };
    }
  }

  /**
   * Get total events count
   */
  async getEventsCount() {
    try {
      const eventsRef = ref(database, 'events');
      const snapshot = await get(eventsRef);
      return snapshot.exists() ? snapshot.size : 0;
    } catch (error) {
      logger.error('Error getting events count:', error);
      return 0;
    }
  }

  /**
   * Get total registrations count
   */
  async getRegistrationsCount() {
    try {
      const registrationsRef = ref(database, 'registrations');
      const snapshot = await get(registrationsRef);
      return snapshot.exists() ? snapshot.size : 0;
    } catch (error) {
      logger.error('Error getting registrations count:', error);
      return 0;
    }
  }

  /**
   * Get total registrations count for existing events only
   */
  async getRegistrationsCountForExistingEvents() {
    try {
      const registrationsRef = ref(database, 'registrations');
      const registrationsSnapshot = await get(registrationsRef);

      const eventsRef = ref(database, 'events');
      const eventsSnapshot = await get(eventsRef);

      if (!registrationsSnapshot.exists()) {
        return 0;
      }

      // Create set of existing event IDs
      const existingEventIds = new Set();
      if (eventsSnapshot.exists()) {
        eventsSnapshot.forEach((childSnapshot) => {
          existingEventIds.add(childSnapshot.key);
        });
      }

      let count = 0;
      registrationsSnapshot.forEach((childSnapshot) => {
        const registration = childSnapshot.val();
        if (registration.event_id && existingEventIds.has(registration.event_id)) {
          count++;
        }
      });

      return count;
    } catch (error) {
      logger.error('Error getting registrations count for existing events:', error);
      return 0;
    }
  }

  /**
   * Get total clubs count
   */
  async getClubsCount() {
    try {
      const clubsRef = ref(database, 'clubs');
      const snapshot = await get(clubsRef);
      return snapshot.exists() ? snapshot.size : 0;
    } catch (error) {
      logger.error('Error getting clubs count:', error);
      return 0;
    }
  }

  /**
   * Get recent registrations
   */
  async getRecentRegistrations(limit = 10) {
    try {
      const registrationsRef = ref(database, 'registrations');
      const snapshot = await get(registrationsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const registrations = [];
      snapshot.forEach((childSnapshot) => {
        registrations.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      // Sort by created_at and return recent ones
      return registrations
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);

    } catch (error) {
      logger.error('Error getting recent registrations:', error);
      return [];
    }
  }

  /**
   * Get validation errors count (registrations with missing required fields)
   */
  async getValidationErrors() {
    try {
      const registrationsRef = ref(database, 'registrations');
      const snapshot = await get(registrationsRef);

      if (!snapshot.exists()) {
        return 0;
      }

      let errorCount = 0;
      snapshot.forEach((childSnapshot) => {
        const registration = childSnapshot.val();

        // Check for required fields
        if (!registration.participant_name ||
            !registration.participant_email ||
            !registration.event_id) {
          errorCount++;
        }
      });

      return errorCount;

    } catch (error) {
      logger.error('Error getting validation errors:', error);
      return 0;
    }
  }

  /**
   * Get validation errors count for existing events only
   */
  async getValidationErrorsForExistingEvents() {
    try {
      const registrationsRef = ref(database, 'registrations');
      const registrationsSnapshot = await get(registrationsRef);

      const eventsRef = ref(database, 'events');
      const eventsSnapshot = await get(eventsRef);

      if (!registrationsSnapshot.exists()) {
        return 0;
      }

      // Create set of existing event IDs
      const existingEventIds = new Set();
      if (eventsSnapshot.exists()) {
        eventsSnapshot.forEach((childSnapshot) => {
          existingEventIds.add(childSnapshot.key);
        });
      }

      let errorCount = 0;
      registrationsSnapshot.forEach((childSnapshot) => {
        const registration = childSnapshot.val();

        // Only count validation errors for existing events
        if (registration.event_id && existingEventIds.has(registration.event_id)) {
          // Check for required fields
          if (!registration.participant_name ||
              !registration.participant_email ||
              !registration.event_id) {
            errorCount++;
          }
        }
      });

      return errorCount;

    } catch (error) {
      logger.error('Error getting validation errors for existing events:', error);
      return 0;
    }
  }

  /**
   * Get top events by registration count
   */
  async getTopEventsByRegistrations() {
    try {
      // Get all registrations
      const registrationsRef = ref(database, 'registrations');
      const registrationsSnapshot = await get(registrationsRef);

      // Get all events
      const eventsRef = ref(database, 'events');
      const eventsSnapshot = await get(eventsRef);

      if (!eventsSnapshot.exists()) {
        return {
          today: [],
          week: [],
          month: [],
          year: [],
          allTime: []
        };
      }

      if (!registrationsSnapshot.exists()) {
        // If no registrations, still show events with 0 count
        const allEvents = [];
        eventsSnapshot.forEach((childSnapshot) => {
          const eventData = childSnapshot.val();
          allEvents.push({
            event: {
              id: childSnapshot.key,
              title: eventData.title,
              start_date: eventData.start_date,
              ...eventData
            },
            registrations: 0
          });
        });

        // Sort by event title and take top 10
        const sortedEvents = allEvents
          .sort((a, b) => a.event.title.localeCompare(b.event.title))
          .slice(0, 10);

        return {
          today: sortedEvents,
          week: sortedEvents,
          month: sortedEvents,
          year: sortedEvents,
          allTime: sortedEvents
        };
      }

      // Create events map
      const eventsMap = {};
      let eventsCount = 0;
      eventsSnapshot.forEach((childSnapshot) => {
        const eventData = childSnapshot.val();
        eventsMap[childSnapshot.key] = {
          id: childSnapshot.key,
          title: eventData.title,
          start_date: eventData.start_date,
          ...eventData
        };
        eventsCount++;
      });

      // Count registrations per event with time filtering
      const eventCounts = {
        today: {},
        week: {},
        month: {},
        year: {},
        allTime: {}
      };

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      registrationsSnapshot.forEach((childSnapshot) => {
        const registration = childSnapshot.val();
        const eventId = registration.event_id;
        const registrationDate = new Date(registration.created_at);

        if (eventsMap[eventId]) {
          // All time
          eventCounts.allTime[eventId] = (eventCounts.allTime[eventId] || 0) + 1;

          // Year
          if (registrationDate >= yearAgo) {
            eventCounts.year[eventId] = (eventCounts.year[eventId] || 0) + 1;
          }

          // Month
          if (registrationDate >= monthAgo) {
            eventCounts.month[eventId] = (eventCounts.month[eventId] || 0) + 1;
          }

          // Week
          if (registrationDate >= weekAgo) {
            eventCounts.week[eventId] = (eventCounts.week[eventId] || 0) + 1;
          }

          // Today
          if (registrationDate >= todayStart) {
            eventCounts.today[eventId] = (eventCounts.today[eventId] || 0) + 1;
          }
        }
      });

      // Convert to sorted arrays and get top 10 (increased from 5)
      const getTopEvents = (counts) => {
        const eventsWithCounts = Object.entries(counts)
          .map(([eventId, count]) => ({
            event: eventsMap[eventId],
            registrations: count
          }));

        // Also include events with 0 registrations
        Object.keys(eventsMap).forEach(eventId => {
          if (!counts[eventId]) {
            eventsWithCounts.push({
              event: eventsMap[eventId],
              registrations: 0
            });
          }
        });

        return eventsWithCounts
          .sort((a, b) => {
            // Sort by registration count first, then by title
            if (b.registrations !== a.registrations) {
              return b.registrations - a.registrations;
            }
            return a.event.title.localeCompare(b.event.title);
          })
          .slice(0, 10); // Show top 10 instead of 5
      };

      return {
        today: getTopEvents(eventCounts.today),
        week: getTopEvents(eventCounts.week),
        month: getTopEvents(eventCounts.month),
        year: getTopEvents(eventCounts.year),
        allTime: getTopEvents(eventCounts.allTime)
      };

    } catch (error) {
      logger.error('Error getting top events:', error);
      return {
        today: [],
        week: [],
        month: [],
        year: [],
        allTime: []
      };
    }
  }



  /**
   * Simulate pipeline operations for demo purposes
   */
  async simulateOperation(operation) {
    try {
      logger.log(`Simulating pipeline operation: ${operation}`);

      // Handle different operations
      switch (operation) {
        case 'start':
          this.pipelineRunning = true;
          this.pipelineStartTime = new Date().toISOString();
          logger.log('Pipeline started');
          break;

        case 'stop':
          this.pipelineRunning = false;
          this.pipelineStartTime = null;
          logger.log('Pipeline stopped');
          break;

        case 'manual_run':
          if (this.pipelineRunning) {
            logger.log('Manual run executed');
          } else {
            return { success: false, error: 'Pipeline must be running to execute manual run' };
          }
          break;

        default:
          logger.log(`Unknown operation: ${operation}`);
      }

      // Add some delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clear cache to force refresh
      this.cache.clear();

      return { success: true, message: `${operation} completed successfully` };

    } catch (error) {
      logger.error(`Error simulating ${operation}:`, error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new PipelineDataService();
