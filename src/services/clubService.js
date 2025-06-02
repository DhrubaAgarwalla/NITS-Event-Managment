 import { ref, push, set, get, query, orderByChild, equalTo, remove, update } from 'firebase/database';
import { database } from '../lib/firebase';

import logger from '../utils/logger';
// Club-related database operations
const clubService = {
  // Get all clubs
  getAllClubs: async () => {
    try {
      logger.log('Getting all clubs from Firebase');
      const clubsRef = ref(database, 'clubs');
      const snapshot = await get(clubsRef);

      if (!snapshot.exists()) {
        logger.log('No clubs found');
        return [];
      }

      const clubs = [];
      snapshot.forEach((childSnapshot) => {
        clubs.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      logger.log(`Found ${clubs.length} clubs`);

      // Sort by name
      return clubs.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      logger.error('Error getting all clubs:', error);
      throw error;
    }
  },

  // Get a specific club by ID
  getClubById: async (id) => {
    try {
      logger.log(`Getting club by ID: ${id}`);
      const clubRef = ref(database, `clubs/${id}`);
      const snapshot = await get(clubRef);

      if (!snapshot.exists()) {
        logger.log('Club not found');
        return null;
      }

      return {
        id: snapshot.key,
        ...snapshot.val()
      };
    } catch (error) {
      logger.error('Error getting club by ID:', error);
      throw error;
    }
  },

  // Update club profile
  updateClubProfile: async (id, updates) => {
    try {
      logger.log(`Updating club profile for ID: ${id}`);
      const clubRef = ref(database, `clubs/${id}`);

      // Add updated timestamp
      updates.updated_at = new Date().toISOString();

      await update(clubRef, updates);
      logger.log('Club profile updated successfully');

      // Get the updated club
      const snapshot = await get(clubRef);

      return {
        id: snapshot.key,
        ...snapshot.val()
      };
    } catch (error) {
      logger.error('Error updating club profile:', error);
      throw error;
    }
  },

  // Add image to club gallery
  addGalleryImage: async (clubId, imageUrl) => {
    try {
      logger.log(`Adding image to gallery for club ID: ${clubId}`);
      const clubRef = ref(database, `clubs/${clubId}`);

      // Get current club data
      const snapshot = await get(clubRef);
      if (!snapshot.exists()) {
        throw new Error('Club not found');
      }

      const clubData = snapshot.val();

      // Initialize gallery array if it doesn't exist
      const gallery = clubData.gallery || [];

      // Check if we've reached the maximum number of images (15)
      if (gallery.length >= 15) {
        throw new Error('Gallery limit reached (maximum 15 images)');
      }

      // Add new image to gallery
      gallery.push(imageUrl);

      // Update club with new gallery
      await update(clubRef, {
        gallery,
        updated_at: new Date().toISOString()
      });

      logger.log('Gallery image added successfully');
      return gallery;
    } catch (error) {
      logger.error('Error adding gallery image:', error);
      throw error;
    }
  },

  // Remove image from club gallery
  removeGalleryImage: async (clubId, imageUrl) => {
    try {
      logger.log(`Removing image from gallery for club ID: ${clubId}`);
      const clubRef = ref(database, `clubs/${clubId}`);

      // Get current club data
      const snapshot = await get(clubRef);
      if (!snapshot.exists()) {
        throw new Error('Club not found');
      }

      const clubData = snapshot.val();

      // Check if gallery exists
      if (!clubData.gallery || !Array.isArray(clubData.gallery)) {
        throw new Error('Gallery not found');
      }

      // Remove image from gallery
      const updatedGallery = clubData.gallery.filter(url => url !== imageUrl);

      // Update club with new gallery
      await update(clubRef, {
        gallery: updatedGallery,
        updated_at: new Date().toISOString()
      });

      logger.log('Gallery image removed successfully');
      return updatedGallery;
    } catch (error) {
      logger.error('Error removing gallery image:', error);
      throw error;
    }
  },

  // Submit club request (for non-admin users)
  submitClubRequest: async (requestData) => {
    try {
      logger.log('Submitting club request:', requestData.club_name);

      // Create club request with logo URL (already included in requestData)
      const requestsRef = ref(database, 'club_requests');
      const newRequestRef = push(requestsRef);

      const newRequest = {
        ...requestData,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database
      await set(newRequestRef, newRequest);
      logger.log('Club request submitted successfully with ID:', newRequestRef.key);

      return {
        id: newRequestRef.key,
        ...newRequest
      };
    } catch (error) {
      logger.error('Error submitting club request:', error);
      throw error;
    }
  },

  // Get pending club requests (admin only)
  getPendingRequests: async () => {
    try {
      logger.log('Getting pending club requests');
      const requestsRef = ref(database, 'club_requests');
      const pendingRequestsQuery = query(
        requestsRef,
        orderByChild('status'),
        equalTo('pending')
      );

      const snapshot = await get(pendingRequestsQuery);

      if (!snapshot.exists()) {
        logger.log('No pending requests found');
        return [];
      }

      const requests = [];
      snapshot.forEach((childSnapshot) => {
        requests.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      logger.log(`Found ${requests.length} pending requests`);

      // Sort by creation date (newest first)
      return requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
      logger.error('Error getting pending club requests:', error);
      throw error;
    }
  },

  // Approve or reject club request (admin only)
  updateRequestStatus: async (requestId, status, adminNotes = '') => {
    try {
      logger.log(`Updating club request status to ${status} for request ID: ${requestId}`);
      const requestRef = ref(database, `club_requests/${requestId}`);

      await update(requestRef, {
        status,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      });

      logger.log('Club request status updated successfully');
      return true;
    } catch (error) {
      logger.error('Error updating club request status:', error);
      throw error;
    }
  },

  // Get club events
  getClubEvents: async (clubId) => {
    try {
      logger.log(`Getting events for club ID: ${clubId}`);
      const eventsRef = ref(database, 'events');
      const clubEventsQuery = query(
        eventsRef,
        orderByChild('club_id'),
        equalTo(clubId)
      );

      const snapshot = await get(clubEventsQuery);

      if (!snapshot.exists()) {
        logger.log('No events found for this club');
        return [];
      }

      const events = [];
      snapshot.forEach((childSnapshot) => {
        events.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      logger.log(`Found ${events.length} events for club`);

      // Sort by start_date descending
      return events.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    } catch (error) {
      logger.error('Error getting club events:', error);
      throw error;
    }
  }
};

export default clubService;
