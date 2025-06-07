/**
 * Information Board Service
 * Manages live updates posted by club admins during events
 */

import { ref, push, get, query, orderByChild, limitToLast, onValue, off, set, remove } from 'firebase/database';
import { database } from '../lib/firebase';
import logger from '../utils/logger';

class InformationBoardService {
  constructor() {
    this.listeners = new Map(); // Track active listeners for cleanup
  }

  /**
   * Post a live update to the information board
   */
  async postUpdate(eventId, updateData, clubAdminId, clubAdminName) {
    try {
      const updatesRef = ref(database, `event_live_updates/${eventId}`);
      
      const update = {
        message: updateData.message,
        type: updateData.type || 'info', // 'info', 'announcement', 'schedule', 'important'
        posted_by: clubAdminId,
        posted_by_name: clubAdminName,
        timestamp: new Date().toISOString(),
        is_pinned: updateData.isPinned || false,
        created_at: new Date().toISOString()
      };

      const newUpdateRef = await push(updatesRef, update);
      
      logger.log('Posted information board update:', {
        eventId,
        updateId: newUpdateRef.key,
        type: update.type,
        message: update.message.substring(0, 50) + '...'
      });

      return {
        success: true,
        updateId: newUpdateRef.key,
        update
      };

    } catch (error) {
      logger.error('Error posting information board update:', error);
      throw error;
    }
  }

  /**
   * Get all updates for an event
   */
  async getUpdates(eventId, limit = 50) {
    try {
      const updatesRef = ref(database, `event_live_updates/${eventId}`);
      const updatesQuery = query(
        updatesRef,
        orderByChild('timestamp'),
        limitToLast(limit)
      );

      const snapshot = await get(updatesQuery);
      
      if (!snapshot.exists()) {
        return [];
      }

      const updates = [];
      snapshot.forEach((childSnapshot) => {
        updates.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      // Sort by timestamp (most recent first for display)
      updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      logger.log(`Retrieved ${updates.length} updates for event ${eventId}`);
      return updates;

    } catch (error) {
      logger.error('Error getting information board updates:', error);
      throw error;
    }
  }

  /**
   * Listen to real-time updates for an event
   */
  listenToUpdates(eventId, callback, limit = 50) {
    try {
      const updatesRef = ref(database, `event_live_updates/${eventId}`);
      const updatesQuery = query(
        updatesRef,
        orderByChild('timestamp'),
        limitToLast(limit)
      );

      const unsubscribe = onValue(updatesQuery, (snapshot) => {
        if (!snapshot.exists()) {
          callback([]);
          return;
        }

        const updates = [];
        snapshot.forEach((childSnapshot) => {
          updates.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });

        // Sort by timestamp (most recent first)
        updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        callback(updates);
      });

      // Store listener for cleanup
      const listenerId = `updates_${eventId}_${Date.now()}`;
      this.listeners.set(listenerId, unsubscribe);

      logger.log(`Started listening to updates for event ${eventId}`);
      
      return () => {
        unsubscribe();
        this.listeners.delete(listenerId);
        logger.log(`Stopped listening to updates for event ${eventId}`);
      };

    } catch (error) {
      logger.error('Error setting up updates listener:', error);
      throw error;
    }
  }

  /**
   * Pin/unpin an update
   */
  async togglePinUpdate(eventId, updateId, isPinned) {
    try {
      const updateRef = ref(database, `event_live_updates/${eventId}/${updateId}/is_pinned`);
      await set(updateRef, isPinned);

      logger.log(`Update ${updateId} ${isPinned ? 'pinned' : 'unpinned'} in event ${eventId}`);
      return true;

    } catch (error) {
      logger.error('Error toggling pin status:', error);
      return false;
    }
  }

  /**
   * Delete an update (admin only)
   */
  async deleteUpdate(eventId, updateId, adminId) {
    try {
      // First check if the update exists and get its data
      const updateRef = ref(database, `event_live_updates/${eventId}/${updateId}`);
      const snapshot = await get(updateRef);

      if (!snapshot.exists()) {
        throw new Error('Update not found');
      }

      const updateData = snapshot.val();
      
      // Check if the admin is the original poster or a system admin
      // (You might want to add additional admin verification here)
      
      await remove(updateRef);

      logger.log(`Update ${updateId} deleted from event ${eventId} by admin ${adminId}`);
      return true;

    } catch (error) {
      logger.error('Error deleting update:', error);
      throw error;
    }
  }

  /**
   * Edit an existing update
   */
  async editUpdate(eventId, updateId, newMessage, adminId) {
    try {
      const updateRef = ref(database, `event_live_updates/${eventId}/${updateId}`);
      const snapshot = await get(updateRef);

      if (!snapshot.exists()) {
        throw new Error('Update not found');
      }

      const updateData = snapshot.val();
      
      // Check if the admin is the original poster
      if (updateData.posted_by !== adminId) {
        throw new Error('Only the original poster can edit this update');
      }

      // Update the message and add edit timestamp
      await set(ref(database, `event_live_updates/${eventId}/${updateId}/message`), newMessage);
      await set(ref(database, `event_live_updates/${eventId}/${updateId}/edited_at`), new Date().toISOString());
      await set(ref(database, `event_live_updates/${eventId}/${updateId}/is_edited`), true);

      logger.log(`Update ${updateId} edited in event ${eventId}`);
      return true;

    } catch (error) {
      logger.error('Error editing update:', error);
      throw error;
    }
  }

  /**
   * Get pinned updates for an event
   */
  async getPinnedUpdates(eventId) {
    try {
      const updatesRef = ref(database, `event_live_updates/${eventId}`);
      const snapshot = await get(updatesRef);

      if (!snapshot.exists()) {
        return [];
      }

      const pinnedUpdates = [];
      snapshot.forEach((childSnapshot) => {
        const update = childSnapshot.val();
        if (update.is_pinned) {
          pinnedUpdates.push({
            id: childSnapshot.key,
            ...update
          });
        }
      });

      // Sort pinned updates by timestamp (most recent first)
      pinnedUpdates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return pinnedUpdates;

    } catch (error) {
      logger.error('Error getting pinned updates:', error);
      throw error;
    }
  }

  /**
   * Get updates by type
   */
  async getUpdatesByType(eventId, type) {
    try {
      const updatesRef = ref(database, `event_live_updates/${eventId}`);
      const snapshot = await get(updatesRef);

      if (!snapshot.exists()) {
        return [];
      }

      const filteredUpdates = [];
      snapshot.forEach((childSnapshot) => {
        const update = childSnapshot.val();
        if (update.type === type) {
          filteredUpdates.push({
            id: childSnapshot.key,
            ...update
          });
        }
      });

      // Sort by timestamp (most recent first)
      filteredUpdates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return filteredUpdates;

    } catch (error) {
      logger.error('Error getting updates by type:', error);
      throw error;
    }
  }

  /**
   * Get update statistics for an event
   */
  async getUpdateStats(eventId) {
    try {
      const updatesRef = ref(database, `event_live_updates/${eventId}`);
      const snapshot = await get(updatesRef);

      if (!snapshot.exists()) {
        return {
          total: 0,
          byType: {},
          pinned: 0,
          lastUpdate: null
        };
      }

      const stats = {
        total: 0,
        byType: {
          info: 0,
          announcement: 0,
          schedule: 0,
          important: 0
        },
        pinned: 0,
        lastUpdate: null
      };

      let latestTimestamp = null;

      snapshot.forEach((childSnapshot) => {
        const update = childSnapshot.val();
        stats.total++;
        
        if (update.type && stats.byType.hasOwnProperty(update.type)) {
          stats.byType[update.type]++;
        }
        
        if (update.is_pinned) {
          stats.pinned++;
        }

        const updateTime = new Date(update.timestamp);
        if (!latestTimestamp || updateTime > latestTimestamp) {
          latestTimestamp = updateTime;
          stats.lastUpdate = update.timestamp;
        }
      });

      return stats;

    } catch (error) {
      logger.error('Error getting update statistics:', error);
      throw error;
    }
  }

  /**
   * Cleanup all listeners
   */
  cleanup() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
    logger.log('Cleaned up all information board listeners');
  }

  /**
   * Validate update data
   */
  validateUpdateData(updateData) {
    if (!updateData.message || typeof updateData.message !== 'string') {
      return { valid: false, error: 'Message is required and must be a string' };
    }

    if (updateData.message.length > 500) {
      return { valid: false, error: 'Message must be 500 characters or less' };
    }

    const validTypes = ['info', 'announcement', 'schedule', 'important'];
    if (updateData.type && !validTypes.includes(updateData.type)) {
      return { valid: false, error: 'Invalid update type' };
    }

    return { valid: true };
  }
}

export default new InformationBoardService();
