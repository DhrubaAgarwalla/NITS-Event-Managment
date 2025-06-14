import { ref, push, set, get, query, orderByChild, equalTo, remove, update } from 'firebase/database';
import { database } from '../lib/firebase';
import { uploadImage } from '../lib/cloudinary';
import { ensureCategories } from '../utils/ensureCategories';
import logger from '../utils/logger';

// Event-related database operations
const eventService = {
  // Get all categories
  getCategories: async () => {
    try {
      logger.log('Getting all categories from Firebase');

      // Use ensureCategories to guarantee categories exist
      const categories = await ensureCategories();

      logger.log(`Found ${categories.length} categories:`, categories.map(c => c.name));
      return categories;
    } catch (error) {
      logger.error('Error getting categories:', error);

      // Return fallback categories if everything fails
      return [
        { id: 'technical', name: 'Technical', color: '#3498db' },
        { id: 'cultural', name: 'Cultural', color: '#e74c3c' },
        { id: 'sports', name: 'Sports', color: '#2ecc71' },
        { id: 'academic', name: 'Academic', color: '#f39c12' },
        { id: 'workshop', name: 'Workshop', color: '#9b59b6' }
      ];
    }
  },

  // Get all tags
  getAllTags: async () => {
    try {
      logger.log('Getting all tags from Firebase');
      const tagsRef = ref(database, 'tags');
      const snapshot = await get(tagsRef);

      if (!snapshot.exists()) {
        logger.log('No tags found');
        return [];
      }

      // Use a Map to ensure unique tags by ID
      const uniqueTagsMap = new Map();

      snapshot.forEach((childSnapshot) => {
        const tagId = childSnapshot.key;
        const tagData = childSnapshot.val();

        // Only add if not already in the map
        if (!uniqueTagsMap.has(tagId)) {
          uniqueTagsMap.set(tagId, {
            id: tagId,
            ...tagData
          });
        }
      });

      // Convert Map to array and sort by name
      const tags = Array.from(uniqueTagsMap.values())
        .sort((a, b) => a.name.localeCompare(b.name));

      logger.log(`Found ${tags.length} unique tags`);
      return tags;
    } catch (error) {
      logger.error('Error getting tags:', error);
      throw error;
    }
  },

  // Add tags to an event
  addTagsToEvent: async (eventId, tagIds) => {
    try {
      logger.log(`Adding tags to event ${eventId}:`, tagIds);
      const eventTagsRef = ref(database, `event_tags/${eventId}`);

      // Create an object with tag IDs as keys
      const tagsObject = {};
      tagIds.forEach(tagId => {
        tagsObject[tagId] = true;
      });

      await set(eventTagsRef, tagsObject);
      logger.log('Tags added successfully');
      return true;
    } catch (error) {
      logger.error('Error adding tags to event:', error);
      throw error;
    }
  },

  // Get tags for a specific event
  getEventTags: async (eventId) => {
    try {
      logger.log(`Getting tags for event ID: ${eventId}`);
      const eventTagsRef = ref(database, `event_tags/${eventId}`);
      const eventTagsSnapshot = await get(eventTagsRef);

      if (!eventTagsSnapshot.exists()) {
        logger.log('No tags found for this event');
        return [];
      }

      // Get tag IDs from the event_tags relationship
      const tagIds = Object.keys(eventTagsSnapshot.val());

      // Fetch each tag by ID
      const tagPromises = tagIds.map(async (tagId) => {
        const tagRef = ref(database, `tags/${tagId}`);
        const tagSnapshot = await get(tagRef);
        if (tagSnapshot.exists()) {
          return {
            id: tagSnapshot.key,
            ...tagSnapshot.val()
          };
        }
        return null;
      });

      const tags = (await Promise.all(tagPromises)).filter(tag => tag !== null);
      logger.log(`Found ${tags.length} tags for event ID: ${eventId}`);
      return tags;
    } catch (error) {
      logger.error('Error getting event tags:', error);
      throw error;
    }
  },

  // Remove tags from an event
  removeTagsFromEvent: async (eventId, tagIds) => {
    try {
      logger.log(`Removing tags from event ${eventId}:`, tagIds);
      const eventTagsRef = ref(database, `event_tags/${eventId}`);

      // Get current tags
      const snapshot = await get(eventTagsRef);
      if (!snapshot.exists()) {
        logger.log('No tags found for this event');
        return true;
      }

      const currentTags = snapshot.val();

      // Create an updated tags object without the removed tags
      const updatedTags = {};
      Object.keys(currentTags).forEach(tagId => {
        if (!tagIds.includes(tagId)) {
          updatedTags[tagId] = true;
        }
      });

      // Update the event_tags node
      await set(eventTagsRef, updatedTags);
      logger.log('Tags removed successfully');
      return true;
    } catch (error) {
      logger.error('Error removing tags from event:', error);
      throw error;
    }
  },
  // Get all events
  getAllEvents: async () => {
    try {
      logger.log('Getting all events from Firebase');
      const eventsRef = ref(database, 'events');
      const snapshot = await get(eventsRef);

      if (!snapshot.exists()) {
        logger.log('No events found');
        return [];
      }

      // Get all categories for lookup
      const categoriesRef = ref(database, 'categories');
      const categoriesSnapshot = await get(categoriesRef);
      const categoriesMap = {};

      if (categoriesSnapshot.exists()) {
        categoriesSnapshot.forEach((childSnapshot) => {
          categoriesMap[childSnapshot.key] = {
            id: childSnapshot.key,
            ...childSnapshot.val()
          };
        });
      }

      // Get all clubs for lookup
      const clubsRef = ref(database, 'clubs');
      const clubsSnapshot = await get(clubsRef);
      const clubsMap = {};

      if (clubsSnapshot.exists()) {
        clubsSnapshot.forEach((childSnapshot) => {
          clubsMap[childSnapshot.key] = {
            id: childSnapshot.key,
            ...childSnapshot.val()
          };
        });
      }

      // Get all tags for lookup
      const tagsRef = ref(database, 'tags');
      const tagsSnapshot = await get(tagsRef);
      const tagsMap = {};

      if (tagsSnapshot.exists()) {
        tagsSnapshot.forEach((childSnapshot) => {
          tagsMap[childSnapshot.key] = {
            id: childSnapshot.key,
            ...childSnapshot.val()
          };
        });
      }

      // Get all event tags relationships
      const eventTagsRef = ref(database, 'event_tags');
      const eventTagsSnapshot = await get(eventTagsRef);
      const eventTagsMap = {};

      if (eventTagsSnapshot.exists()) {
        eventTagsSnapshot.forEach((childSnapshot) => {
          const eventId = childSnapshot.key;
          const tagIds = Object.keys(childSnapshot.val());
          eventTagsMap[eventId] = tagIds;
        });
      }

      // Process events with related data
      const events = [];
      snapshot.forEach((childSnapshot) => {
        const eventId = childSnapshot.key;
        const eventData = childSnapshot.val();

        // Add category data if available
        let categoryData = null;
        if (eventData.category_id && categoriesMap[eventData.category_id]) {
          categoryData = categoriesMap[eventData.category_id];
        }

        // Add club data if available
        let clubData = null;
        if (eventData.club_id && clubsMap[eventData.club_id]) {
          clubData = clubsMap[eventData.club_id];
        }

        // Add tags if available
        let tags = [];
        if (eventTagsMap[eventId]) {
          tags = eventTagsMap[eventId]
            .map(tagId => tagsMap[tagId])
            .filter(tag => tag !== undefined);
        }

        events.push({
          id: eventId,
          ...eventData,
          category: categoryData,
          categories: categoryData, // For backward compatibility
          club: clubData,
          clubs: clubData, // For backward compatibility
          tags
        });
      });

      logger.log(`Found and processed ${events.length} events with related data`);

      // Sort by start_date descending
      return events.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    } catch (error) {
      logger.error('Error getting all events:', error);
      throw error;
    }
  },

  // Get upcoming events
  getUpcomingEvents: async (limit = 10) => {
    try {
      logger.log(`Getting upcoming events (limit: ${limit})`);

      // Get all events first
      const allEvents = await eventService.getAllEvents();

      // Filter for upcoming events
      const now = new Date();
      const upcomingEvents = allEvents.filter(event =>
        event.status === 'upcoming' && new Date(event.start_date) >= now
      );

      logger.log(`Found ${upcomingEvents.length} upcoming events`);

      // Sort by start_date ascending and limit
      return upcomingEvents
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting upcoming events:', error);
      throw error;
    }
  },

  // Get a specific event by ID
  getEventById: async (id) => {
    try {
      logger.log(`Getting event by ID: ${id}`);
      const eventRef = ref(database, `events/${id}`);
      const snapshot = await get(eventRef);

      if (!snapshot.exists()) {
        logger.log('Event not found');
        return null;
      }

      const eventData = {
        id: snapshot.key,
        ...snapshot.val()
      };

      logger.log('Found event data:', eventData);

      // Get club data if available
      let clubData = null;
      if (eventData.club_id) {
        const clubRef = ref(database, `clubs/${eventData.club_id}`);
        const clubSnapshot = await get(clubRef);

        if (clubSnapshot.exists()) {
          clubData = {
            id: clubSnapshot.key,
            ...clubSnapshot.val()
          };
          logger.log('Found club data for event:', clubData.name);
        } else {
          logger.log('Club not found for ID:', eventData.club_id);
        }
      }

      // Get category data if available
      let categoryData = null;
      if (eventData.category_id) {
        const categoryRef = ref(database, `categories/${eventData.category_id}`);
        const categorySnapshot = await get(categoryRef);

        if (categorySnapshot.exists()) {
          categoryData = {
            id: categorySnapshot.key,
            ...categorySnapshot.val()
          };
          logger.log('Found category data for event:', categoryData.name);
        } else {
          logger.log('Category not found for ID:', eventData.category_id);
        }
      }

      // Get tags from event_tags collection
      let tags = [];
      const eventTagsRef = ref(database, `event_tags/${id}`);
      const eventTagsSnapshot = await get(eventTagsRef);

      if (eventTagsSnapshot.exists()) {
        logger.log('Found event tags relationship');
        const tagIds = Object.keys(eventTagsSnapshot.val());

        // Fetch each tag by ID
        const tagPromises = tagIds.map(async (tagId) => {
          const tagRef = ref(database, `tags/${tagId}`);
          const tagSnapshot = await get(tagRef);
          if (tagSnapshot.exists()) {
            return {
              id: tagSnapshot.key,
              ...tagSnapshot.val()
            };
          }
          return null;
        });

        tags = (await Promise.all(tagPromises)).filter(tag => tag !== null);
        logger.log(`Found ${tags.length} tags for event`);
      } else {
        logger.log('No tags found for event');
      }

      // Return event with related data - use consistent naming
      return {
        ...eventData,
        club: clubData,         // Singular for consistency
        category: categoryData, // Singular for consistency
        categories: categoryData, // Keep plural for backward compatibility
        clubs: clubData,        // Keep plural for backward compatibility
        tags
      };
    } catch (error) {
      logger.error('Error getting event by ID:', error);
      throw error;
    }
  },

  // Create a new event
  createEvent: async (eventData, imageFile = null, verticalImageFile = null) => {
    try {
      logger.log('Creating new event:', eventData.title);

      // Upload horizontal banner if provided
      let imageUrl = eventData.image_url || null;
      if (imageFile) {
        logger.log('Uploading horizontal banner to Cloudinary');
        const uploadResult = await uploadImage(imageFile, 'event-images');
        imageUrl = uploadResult.url;
        logger.log('Horizontal banner uploaded successfully:', imageUrl);
      }

      // Upload vertical banner if provided
      let verticalImageUrl = eventData.vertical_image_url || null;
      if (verticalImageFile) {
        logger.log('Uploading vertical banner to Cloudinary');
        const uploadResult = await uploadImage(verticalImageFile, 'event-images-vertical');
        verticalImageUrl = uploadResult.url;
        logger.log('Vertical banner uploaded successfully:', verticalImageUrl);
      }

      // Create event with image URLs
      const eventsRef = ref(database, 'events');
      const newEventRef = push(eventsRef);

      // Prepare event data with image URLs and timestamps
      const newEvent = {
        ...eventData,
        image_url: imageUrl,
        vertical_image_url: verticalImageUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database
      await set(newEventRef, newEvent);
      logger.log('Event created successfully with ID:', newEventRef.key);

      const createdEvent = {
        id: newEventRef.key,
        ...newEvent
      };

      // Auto-create Google Sheet for the event (don't wait for it to complete)
      try {
        logger.log('🚀 Initiating auto-creation of Google Sheet...');
        const { default: autoSyncService } = await import('./autoSyncService.js');

        // Run auto-creation in background (don't await)
        autoSyncService.autoCreateSheetForEvent(newEventRef.key, newEvent)
          .then(result => {
            if (result.success) {
              logger.log(`✅ Google Sheet auto-created for event ${newEventRef.key}: ${result.data?.shareableLink}`);
            } else {
              logger.warn(`⚠️ Google Sheet auto-creation failed for event ${newEventRef.key}: ${result.error}`);
            }
          })
          .catch(error => {
            logger.error(`❌ Google Sheet auto-creation error for event ${newEventRef.key}:`, error);
          });
      } catch (error) {
        logger.warn('⚠️ Failed to initiate Google Sheet auto-creation:', error);
        // Don't fail event creation if auto-sync fails
      }

      return createdEvent;
    } catch (error) {
      logger.error('Error creating event:', error);
      throw error;
    }
  },

  // Update an event
  updateEvent: async (id, updates, imageFile = null, verticalImageFile = null) => {
    try {
      logger.log(`Updating event with ID: ${id}`);

      // Upload new horizontal banner if provided
      if (imageFile) {
        logger.log('Uploading new horizontal banner to Cloudinary');
        const uploadResult = await uploadImage(imageFile, 'event-images');
        updates.image_url = uploadResult.url;
        logger.log('New horizontal banner uploaded successfully:', updates.image_url);
      }

      // Upload new vertical banner if provided
      if (verticalImageFile) {
        logger.log('Uploading new vertical banner to Cloudinary');
        const uploadResult = await uploadImage(verticalImageFile, 'event-images-vertical');
        updates.vertical_image_url = uploadResult.url;
        logger.log('New vertical banner uploaded successfully:', updates.vertical_image_url);
      }

      // Update the event
      const eventRef = ref(database, `events/${id}`);

      // Add updated timestamp
      updates.updated_at = new Date().toISOString();

      await update(eventRef, updates);
      logger.log('Event updated successfully');

      // Get the updated event
      const snapshot = await get(eventRef);

      return {
        id: snapshot.key,
        ...snapshot.val()
      };
    } catch (error) {
      logger.error('Error updating event:', error);
      throw error;
    }
  },

  // Delete an event
  deleteEvent: async (id) => {
    try {
      logger.log(`Deleting event with ID: ${id}`);
      const eventRef = ref(database, `events/${id}`);
      await remove(eventRef);
      logger.log('Event deleted successfully');
      return true;
    } catch (error) {
      logger.error('Error deleting event:', error);
      throw error;
    }
  },

  // Get events for a specific club
  getClubEvents: async (clubId) => {
    try {
      logger.log(`Getting events for club ID: ${clubId}`);

      // Get all events first (which includes categories and tags)
      const allEvents = await eventService.getAllEvents();

      // Filter for events belonging to the specified club
      const clubEvents = allEvents.filter(event => event.club_id === clubId);

      logger.log(`Found ${clubEvents.length} events for club ID: ${clubId}`);

      // Sort by start_date descending
      return clubEvents.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    } catch (error) {
      logger.error('Error getting club events:', error);
      throw error;
    }
  },

  // Get featured events
  getFeaturedEvents: async (limit = 5) => {
    try {
      logger.log(`Getting featured events (limit: ${limit})`);

      // Get all events first
      const allEvents = await eventService.getAllEvents();

      // Filter for featured events
      const featuredEvents = allEvents.filter(event => event.is_featured);

      logger.log(`Found ${featuredEvents.length} featured events`);

      // Sort by updated_at (most recently featured first) then by start_date
      return featuredEvents
        .sort((a, b) => {
          // First sort by updated_at (most recent first)
          if (a.updated_at && b.updated_at) {
            const dateComparison = new Date(b.updated_at) - new Date(a.updated_at);
            if (dateComparison !== 0) return dateComparison;
          }
          // Then sort by start_date (soonest first)
          return new Date(a.start_date) - new Date(b.start_date);
        })
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting featured events:', error);
      throw error;
    }
  },

  // Update event status
  updateEventStatus: async (id, status) => {
    try {
      logger.log(`Updating event status to ${status} for event ID: ${id}`);
      const eventRef = ref(database, `events/${id}`);

      await update(eventRef, {
        status,
        updated_at: new Date().toISOString()
      });

      logger.log('Event status updated successfully');

      // Get the updated event
      const snapshot = await get(eventRef);

      if (!snapshot.exists()) {
        throw new Error('Event not found after update');
      }

      return {
        id: snapshot.key,
        ...snapshot.val()
      };
    } catch (error) {
      logger.error('Error updating event status:', error);
      throw error;
    }
  },

  // Toggle registration status (open/closed)
  toggleRegistrationStatus: async (id, isOpen) => {
    try {
      logger.log(`Setting registration status to ${isOpen ? 'open' : 'closed'} for event ID: ${id}`);
      const eventRef = ref(database, `events/${id}`);

      await update(eventRef, {
        registration_open: isOpen,
        updated_at: new Date().toISOString()
      });

      logger.log('Registration status updated successfully');

      // Get the updated event
      const snapshot = await get(eventRef);

      if (!snapshot.exists()) {
        throw new Error('Event not found after update');
      }

      return {
        id: snapshot.key,
        ...snapshot.val()
      };
    } catch (error) {
      logger.error('Error updating registration status:', error);
      throw error;
    }
  }
};

export default eventService;
