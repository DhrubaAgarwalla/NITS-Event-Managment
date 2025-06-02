import { ref, get, set, update, remove } from 'firebase/database';
import { database } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
import logger from '../utils/logger';

// Admin-related database operations
const adminService = {
  // Alias for getAllClubRequests for backward compatibility
  getClubRequests: async () => {
    return adminService.getAllClubRequests();
  },

  // Toggle event featured status
  toggleEventFeatured: async (eventId, isFeatured) => {
    try {
      logger.log(`Setting event ${eventId} featured status to ${isFeatured}`);

      const eventRef = ref(database, `events/${eventId}`);
      await update(eventRef, {
        is_featured: isFeatured,
        updated_at: new Date().toISOString()
      });

      logger.log('Event featured status updated successfully');

      return true;
    } catch (error) {
      logger.error('Error updating event featured status:', error);
      throw error;
    }
  },
  // Check if a user is an admin
  isAdmin: async (userId) => {
    try {
      logger.log(`Checking if user ${userId} is an admin`);
      const adminRef = ref(database, `admins/${userId}`);
      const snapshot = await get(adminRef);

      const isAdmin = snapshot.exists();
      logger.log(`User is admin: ${isAdmin}`);

      return isAdmin;
    } catch (error) {
      logger.error('Error checking admin status:', error);
      throw error;
    }
  },

  // Create a club account (admin only)
  createClubAccount: async (email, password, clubData) => {
    try {
      logger.log(`Creating club account for ${email}`);

      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      logger.log(`Created auth user with ID: ${newUser.uid}`);

      // Update user profile with club name
      await updateProfile(newUser, {
        displayName: clubData.name
      });

      // Create club profile in database
      const clubRef = ref(database, `clubs/${newUser.uid}`);
      await set(clubRef, {
        ...clubData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      logger.log('Club profile created successfully');

      // Generate a random password to show to the admin if none was provided
      const tempPassword = password || Math.random().toString(36).slice(-8);

      return {
        success: true,
        club: {
          id: newUser.uid,
          ...clubData
        },
        tempPassword
      };
    } catch (error) {
      logger.error('Error creating club account:', error);
      throw error;
    }
  },

  // Get all club requests
  getAllClubRequests: async () => {
    try {
      logger.log('Getting all club requests');
      const requestsRef = ref(database, 'club_requests');
      const snapshot = await get(requestsRef);

      if (!snapshot.exists()) {
        logger.log('No club requests found');
        return [];
      }

      const requests = [];
      snapshot.forEach((childSnapshot) => {
        requests.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      logger.log(`Found ${requests.length} club requests`);

      // Sort by creation date (newest first)
      return requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
      logger.error('Error getting club requests:', error);
      throw error;
    }
  },

  // Approve a club request and create account
  approveClubRequest: async (requestId, email, password, clubData = null) => {
    try {
      logger.log(`Approving club request with ID: ${requestId}`);

      // Get the request data
      const requestRef = ref(database, `club_requests/${requestId}`);
      const snapshot = await get(requestRef);

      if (!snapshot.exists()) {
        throw new Error('Club request not found');
      }

      const requestData = snapshot.val();

      // Use provided club data or create from request data
      const finalClubData = clubData || {
        name: requestData.club_name,
        description: requestData.additional_info || '',
        contact_email: requestData.contact_email,
        contact_phone: requestData.contact_phone || '',
        logo_url: requestData.logo_url || '',
        website: '',
        social_links: {}
      };

      // Use provided email or from request data
      const finalEmail = email || requestData.contact_email;

      const result = await adminService.createClubAccount(
        finalEmail,
        password,
        finalClubData
      );

      // Update request status
      await update(requestRef, {
        status: 'approved',
        updated_at: new Date().toISOString()
      });

      logger.log('Club request approved and account created successfully');

      return result;
    } catch (error) {
      logger.error('Error approving club request:', error);
      throw error;
    }
  },

  // Reject a club request
  rejectClubRequest: async (requestId, reason = '') => {
    try {
      logger.log(`Rejecting club request with ID: ${requestId}`);

      const requestRef = ref(database, `club_requests/${requestId}`);
      await update(requestRef, {
        status: 'rejected',
        admin_notes: reason,
        updated_at: new Date().toISOString()
      });

      logger.log('Club request rejected successfully');

      return true;
    } catch (error) {
      logger.error('Error rejecting club request:', error);
      throw error;
    }
  },

  // Get all clubs
  getAllClubs: async () => {
    try {
      logger.log('Getting all clubs');
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

  // Delete a club
  deleteClub: async (clubId) => {
    try {
      logger.log(`Deleting club with ID: ${clubId}`);

      // Note: This only deletes the club profile, not the auth user
      // In a production app, you would use Firebase Admin SDK to delete the auth user as well
      const clubRef = ref(database, `clubs/${clubId}`);
      await remove(clubRef);

      logger.log('Club deleted successfully');

      return true;
    } catch (error) {
      logger.error('Error deleting club:', error);
      throw error;
    }
  },

  // Get all events
  getAllEvents: async () => {
    try {
      logger.log('Getting all events');
      const eventsRef = ref(database, 'events');
      const snapshot = await get(eventsRef);

      if (!snapshot.exists()) {
        logger.log('No events found');
        return [];
      }

      const events = [];
      snapshot.forEach((childSnapshot) => {
        events.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      logger.log(`Found ${events.length} events`);

      // Sort by start date (newest first)
      return events.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    } catch (error) {
      logger.error('Error getting all events:', error);
      throw error;
    }
  }
};

export default adminService;
