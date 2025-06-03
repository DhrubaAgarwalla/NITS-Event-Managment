import { ref, get, set, update } from 'firebase/database';
import { database } from '../lib/firebase';
import googleSheetsService from './googleSheetsService';

import logger from '../utils/logger';
/**
 * Auto-Sync Service for Google Sheets
 * Handles automatic creation and real-time updates of Google Sheets
 */
class AutoSyncService {
  constructor() {
    this.syncQueue = [];
    this.isProcessing = false;
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  /**
   * Auto-create Google Sheet when event is created
   * @param {string} eventId - The event ID
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} Sheet creation result
   */
  async autoCreateSheetForEvent(eventId, eventData) {
    try {
      logger.log(`🚀 Auto-creating Google Sheet for event: ${eventData.title}`);

      // Prepare event data for sheet creation
      const sheetEventData = {
        id: eventId,
        title: eventData.title,
        description: eventData.description || '',
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        location: eventData.location || '',
        participation_type: eventData.participation_type || 'individual',
        requires_payment: eventData.requires_payment || false,
        payment_amount: eventData.payment_amount || null,
        custom_fields: eventData.custom_fields || []
      };

      // Create sheet with empty registrations (auto-create mode)
      const result = await googleSheetsService.createEventSheet(sheetEventData, [], true);

      if (result.success) {
        // Store sheet information in event data
        await this.updateEventWithSheetInfo(eventId, {
          google_sheet_id: result.spreadsheetId,
          google_sheet_url: result.shareableLink,
          auto_sync_enabled: true,
          sheet_created_at: new Date().toISOString()
        });

        logger.log(`✅ Auto-created Google Sheet for event ${eventId}: ${result.shareableLink}`);
        return result;
      } else {
        throw new Error(result.error || 'Failed to create Google Sheet');
      }

    } catch (error) {
      logger.error(`❌ Failed to auto-create Google Sheet for event ${eventId}:`, error);

      // Store error info but don't fail event creation
      await this.updateEventWithSheetInfo(eventId, {
        auto_sync_enabled: false,
        sheet_creation_error: error.message,
        sheet_creation_attempted_at: new Date().toISOString()
      });

      // Return error but don't throw (event creation should continue)
      return {
        success: false,
        error: error.message,
        eventId
      };
    }
  }

  /**
   * Auto-sync sheet when registrations change
   * @param {string} eventId - Event ID
   * @param {string} updateType - Type of update (registration, attendance, payment)
   * @returns {Promise<Object>} Sync result
   */
  async autoSyncRegistrations(eventId, updateType = 'registration') {
    try {
      logger.log(`🔄 Auto-syncing registrations for event ${eventId} (${updateType})`);

      // Get event data
      const eventData = await this.getEventData(eventId);
      if (!eventData) {
        throw new Error('Event not found');
      }

      // Check if auto-sync is enabled and sheet exists
      if (!eventData.auto_sync_enabled || !eventData.google_sheet_id) {
        logger.log(`⏭️ Auto-sync disabled or no sheet for event ${eventId}`);
        return { success: false, reason: 'Auto-sync disabled or no sheet' };
      }

      // Get current registrations
      const registrations = await this.getEventRegistrations(eventId);

      // Prepare data for sync
      const sheetEventData = {
        id: eventId,
        title: eventData.title,
        description: eventData.description || '',
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        location: eventData.location || '',
        participation_type: eventData.participation_type || 'individual',
        requires_payment: eventData.requires_payment || false,
        payment_amount: eventData.payment_amount || null,
        custom_fields: eventData.custom_fields || []
      };

      // Add to sync queue
      return await this.addToSyncQueue({
        spreadsheetId: eventData.google_sheet_id,
        eventData: sheetEventData,
        registrations,
        updateType,
        eventId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error(`❌ Failed to auto-sync event ${eventId}:`, error);
      return {
        success: false,
        error: error.message,
        eventId,
        updateType
      };
    }
  }

  /**
   * Add sync operation to queue
   * @param {Object} syncOperation - Sync operation details
   * @returns {Promise<Object>} Sync result
   */
  async addToSyncQueue(syncOperation) {
    this.syncQueue.push(syncOperation);

    if (!this.isProcessing) {
      return await this.processSyncQueue();
    }

    return {
      success: true,
      queued: true,
      message: 'Added to sync queue'
    };
  }

  /**
   * Process sync queue
   * @returns {Promise<Object>} Process result
   */
  async processSyncQueue() {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return { success: true, message: 'Queue empty or already processing' };
    }

    this.isProcessing = true;
    const results = [];
    const maxOperations = 50; // Prevent infinite processing
    let operationsProcessed = 0;

    try {
      while (this.syncQueue.length > 0 && operationsProcessed < maxOperations) {
        const operation = this.syncQueue.shift();

        // Validate operation before processing
        if (!operation || !operation.spreadsheetId || !operation.eventData) {
          logger.warn('⚠️ Invalid sync operation skipped:', operation);
          operationsProcessed++;
          continue;
        }

        const result = await this.executeSyncOperation(operation);
        results.push(result);
        operationsProcessed++;

        // Small delay between operations to avoid rate limiting
        if (this.syncQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Warn if queue was truncated
      if (operationsProcessed >= maxOperations && this.syncQueue.length > 0) {
        logger.warn(`⚠️ Sync queue truncated at ${maxOperations} operations. ${this.syncQueue.length} operations remaining.`);
      }

      return {
        success: true,
        processed: results.length,
        results,
        truncated: operationsProcessed >= maxOperations
      };

    } catch (error) {
      logger.error('❌ Error processing sync queue:', error);
      return {
        success: false,
        error: error.message,
        processed: results.length,
        results
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a single sync operation with retry logic
   * @param {Object} operation - Sync operation
   * @returns {Promise<Object>} Operation result
   */
  async executeSyncOperation(operation) {
    let lastError;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        logger.log(`🔄 Executing sync operation (attempt ${attempt}/${this.retryAttempts})`);

        const result = await googleSheetsService.autoSyncSheet(
          operation.spreadsheetId,
          operation.eventData,
          operation.registrations,
          operation.updateType
        );

        if (result.success) {
          logger.log(`✅ Sync successful for event ${operation.eventId}`);

          // Update last sync timestamp
          await this.updateEventWithSheetInfo(operation.eventId, {
            last_sync_at: new Date().toISOString(),
            last_sync_type: operation.updateType,
            sync_error: null
          });

          return {
            success: true,
            eventId: operation.eventId,
            updateType: operation.updateType,
            attempt
          };
        } else {
          throw new Error(result.error || 'Sync failed');
        }

      } catch (error) {
        lastError = error;
        logger.warn(`⚠️ Sync attempt ${attempt} failed for event ${operation.eventId}:`, error.message);

        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    // All attempts failed
    logger.error(`❌ All sync attempts failed for event ${operation.eventId}:`, lastError.message);

    // Update event with error info
    await this.updateEventWithSheetInfo(operation.eventId, {
      sync_error: lastError.message,
      last_sync_attempt: new Date().toISOString()
    });

    return {
      success: false,
      eventId: operation.eventId,
      updateType: operation.updateType,
      error: lastError.message,
      attempts: this.retryAttempts
    };
  }

  /**
   * Get event data from Firebase
   * @param {string} eventId - Event ID
   * @returns {Promise<Object|null>} Event data
   */
  async getEventData(eventId) {
    try {
      const eventRef = ref(database, `events/${eventId}`);
      const snapshot = await get(eventRef);
      return snapshot.exists() ? { id: eventId, ...snapshot.val() } : null;
    } catch (error) {
      logger.error(`Error getting event data for ${eventId}:`, error);
      return null;
    }
  }

  /**
   * Get event registrations from Firebase
   * @param {string} eventId - Event ID
   * @returns {Promise<Array>} Registrations array
   */
  async getEventRegistrations(eventId) {
    try {
      const registrationsRef = ref(database, 'registrations');
      const snapshot = await get(registrationsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const allRegistrations = snapshot.val();
      const eventRegistrations = [];

      Object.keys(allRegistrations).forEach(regId => {
        const registration = allRegistrations[regId];
        if (registration.event_id === eventId) {
          eventRegistrations.push({
            id: regId,
            ...registration
          });
        }
      });

      return eventRegistrations;
    } catch (error) {
      logger.error(`Error getting registrations for event ${eventId}:`, error);
      return [];
    }
  }

  /**
   * Update event with sheet information
   * @param {string} eventId - Event ID
   * @param {Object} sheetInfo - Sheet information to update
   * @returns {Promise<void>}
   */
  async updateEventWithSheetInfo(eventId, sheetInfo) {
    try {
      // Only update Google Sheets-related fields that any authenticated user can modify
      const allowedFields = {
        google_sheet_id: sheetInfo.google_sheet_id,
        google_sheet_url: sheetInfo.google_sheet_url,
        sheet_created_at: sheetInfo.sheet_created_at,
        last_sync_at: sheetInfo.last_sync_at,
        last_sync_type: sheetInfo.last_sync_type,
        auto_sync_enabled: sheetInfo.auto_sync_enabled,
        sync_error: sheetInfo.sync_error,
        auto_sync_disabled_at: sheetInfo.auto_sync_disabled_at,
        auto_sync_enabled_at: sheetInfo.auto_sync_enabled_at,
        updated_at: new Date().toISOString()
      };

      // Remove undefined fields
      const fieldsToUpdate = {};
      Object.keys(allowedFields).forEach(key => {
        if (allowedFields[key] !== undefined) {
          fieldsToUpdate[key] = allowedFields[key];
        }
      });

      if (Object.keys(fieldsToUpdate).length === 0) {
        logger.warn(`No valid fields to update for event ${eventId}`);
        return;
      }

      const eventRef = ref(database, `events/${eventId}`);
      await update(eventRef, fieldsToUpdate);

      logger.warn(`Updated event ${eventId} with sheet info: ${Object.keys(fieldsToUpdate).join(', ')}`);
    } catch (error) {
      logger.error(`Error updating event ${eventId} with sheet info:`, error);
      throw error; // Re-throw to handle in calling function
    }
  }

  /**
   * Disable auto-sync for an event
   * @param {string} eventId - Event ID
   * @returns {Promise<void>}
   */
  async disableAutoSync(eventId) {
    await this.updateEventWithSheetInfo(eventId, {
      auto_sync_enabled: false,
      auto_sync_disabled_at: new Date().toISOString()
    });
  }

  /**
   * Enable auto-sync for an event
   * @param {string} eventId - Event ID
   * @returns {Promise<void>}
   */
  async enableAutoSync(eventId) {
    await this.updateEventWithSheetInfo(eventId, {
      auto_sync_enabled: true,
      auto_sync_enabled_at: new Date().toISOString()
    });
  }
}

// Export singleton instance
const autoSyncService = new AutoSyncService();
export default autoSyncService;
