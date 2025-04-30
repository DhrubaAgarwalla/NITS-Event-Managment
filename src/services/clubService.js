 import { ref, push, set, get, query, orderByChild, equalTo, remove, update } from 'firebase/database';
import { database } from '../lib/firebase';

// Club-related database operations
const clubService = {
  // Get all clubs
  getAllClubs: async () => {
    try {
      console.log('Getting all clubs from Firebase');
      const clubsRef = ref(database, 'clubs');
      const snapshot = await get(clubsRef);

      if (!snapshot.exists()) {
        console.log('No clubs found');
        return [];
      }

      const clubs = [];
      snapshot.forEach((childSnapshot) => {
        clubs.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      console.log(`Found ${clubs.length} clubs`);

      // Sort by name
      return clubs.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting all clubs:', error);
      throw error;
    }
  },

  // Get a specific club by ID
  getClubById: async (id) => {
    try {
      console.log(`Getting club by ID: ${id}`);
      const clubRef = ref(database, `clubs/${id}`);
      const snapshot = await get(clubRef);

      if (!snapshot.exists()) {
        console.log('Club not found');
        return null;
      }

      return {
        id: snapshot.key,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error getting club by ID:', error);
      throw error;
    }
  },

  // Update club profile
  updateClubProfile: async (id, updates) => {
    try {
      console.log(`Updating club profile for ID: ${id}`);
      const clubRef = ref(database, `clubs/${id}`);

      // Add updated timestamp
      updates.updated_at = new Date().toISOString();

      await update(clubRef, updates);
      console.log('Club profile updated successfully');

      // Get the updated club
      const snapshot = await get(clubRef);

      return {
        id: snapshot.key,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error updating club profile:', error);
      throw error;
    }
  },

  // Submit club request (for non-admin users)
  submitClubRequest: async (requestData) => {
    try {
      console.log('Submitting club request:', requestData.club_name);

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
      console.log('Club request submitted successfully with ID:', newRequestRef.key);

      return {
        id: newRequestRef.key,
        ...newRequest
      };
    } catch (error) {
      console.error('Error submitting club request:', error);
      throw error;
    }
  },

  // Get pending club requests (admin only)
  getPendingRequests: async () => {
    try {
      console.log('Getting pending club requests');
      const requestsRef = ref(database, 'club_requests');
      const pendingRequestsQuery = query(
        requestsRef,
        orderByChild('status'),
        equalTo('pending')
      );

      const snapshot = await get(pendingRequestsQuery);

      if (!snapshot.exists()) {
        console.log('No pending requests found');
        return [];
      }

      const requests = [];
      snapshot.forEach((childSnapshot) => {
        requests.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      console.log(`Found ${requests.length} pending requests`);

      // Sort by creation date (newest first)
      return requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
      console.error('Error getting pending club requests:', error);
      throw error;
    }
  },

  // Approve or reject club request (admin only)
  updateRequestStatus: async (requestId, status, adminNotes = '') => {
    try {
      console.log(`Updating club request status to ${status} for request ID: ${requestId}`);
      const requestRef = ref(database, `club_requests/${requestId}`);

      await update(requestRef, {
        status,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      });

      console.log('Club request status updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating club request status:', error);
      throw error;
    }
  },

  // Get club events
  getClubEvents: async (clubId) => {
    try {
      console.log(`Getting events for club ID: ${clubId}`);
      const eventsRef = ref(database, 'events');
      const clubEventsQuery = query(
        eventsRef,
        orderByChild('club_id'),
        equalTo(clubId)
      );

      const snapshot = await get(clubEventsQuery);

      if (!snapshot.exists()) {
        console.log('No events found for this club');
        return [];
      }

      const events = [];
      snapshot.forEach((childSnapshot) => {
        events.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      console.log(`Found ${events.length} events for club`);

      // Sort by start_date descending
      return events.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    } catch (error) {
      console.error('Error getting club events:', error);
      throw error;
    }
  }
};

export default clubService;
