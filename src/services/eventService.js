import { ref, push, set, get, query, orderByChild, equalTo, remove, update } from 'firebase/database';
import { database } from '../lib/firebase';
import { uploadImage } from '../lib/cloudinary';

// Event-related database operations
const eventService = {
  // Get all categories
  getCategories: async () => {
    try {
      console.log('Getting all categories from Firebase');
      const categoriesRef = ref(database, 'categories');
      const snapshot = await get(categoriesRef);

      if (!snapshot.exists()) {
        console.log('No categories found');
        return [];
      }

      const categories = [];
      snapshot.forEach((childSnapshot) => {
        categories.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      console.log(`Found ${categories.length} categories`);
      return categories;
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  },

  // Get all tags
  getAllTags: async () => {
    try {
      console.log('Getting all tags from Firebase');
      const tagsRef = ref(database, 'tags');
      const snapshot = await get(tagsRef);

      if (!snapshot.exists()) {
        console.log('No tags found');
        return [];
      }

      const tags = [];
      snapshot.forEach((childSnapshot) => {
        tags.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      console.log(`Found ${tags.length} tags`);
      return tags;
    } catch (error) {
      console.error('Error getting tags:', error);
      throw error;
    }
  },

  // Add tags to an event
  addTagsToEvent: async (eventId, tagIds) => {
    try {
      console.log(`Adding tags to event ${eventId}:`, tagIds);
      const eventTagsRef = ref(database, `event_tags/${eventId}`);

      // Create an object with tag IDs as keys
      const tagsObject = {};
      tagIds.forEach(tagId => {
        tagsObject[tagId] = true;
      });

      await set(eventTagsRef, tagsObject);
      console.log('Tags added successfully');
      return true;
    } catch (error) {
      console.error('Error adding tags to event:', error);
      throw error;
    }
  },
  // Get all events
  getAllEvents: async () => {
    try {
      console.log('Getting all events from Firebase');
      const eventsRef = ref(database, 'events');
      const snapshot = await get(eventsRef);

      if (!snapshot.exists()) {
        console.log('No events found');
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

      console.log(`Found and processed ${events.length} events with related data`);

      // Sort by start_date descending
      return events.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    } catch (error) {
      console.error('Error getting all events:', error);
      throw error;
    }
  },

  // Get upcoming events
  getUpcomingEvents: async (limit = 10) => {
    try {
      console.log(`Getting upcoming events (limit: ${limit})`);

      // Get all events first
      const allEvents = await eventService.getAllEvents();

      // Filter for upcoming events
      const now = new Date();
      const upcomingEvents = allEvents.filter(event =>
        event.status === 'upcoming' && new Date(event.start_date) >= now
      );

      console.log(`Found ${upcomingEvents.length} upcoming events`);

      // Sort by start_date ascending and limit
      return upcomingEvents
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      throw error;
    }
  },

  // Get a specific event by ID
  getEventById: async (id) => {
    try {
      console.log(`Getting event by ID: ${id}`);
      const eventRef = ref(database, `events/${id}`);
      const snapshot = await get(eventRef);

      if (!snapshot.exists()) {
        console.log('Event not found');
        return null;
      }

      const eventData = {
        id: snapshot.key,
        ...snapshot.val()
      };

      console.log('Found event data:', eventData);

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
          console.log('Found club data for event:', clubData.name);
        } else {
          console.log('Club not found for ID:', eventData.club_id);
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
          console.log('Found category data for event:', categoryData.name);
        } else {
          console.log('Category not found for ID:', eventData.category_id);
        }
      }

      // Get tags from event_tags collection
      let tags = [];
      const eventTagsRef = ref(database, `event_tags/${id}`);
      const eventTagsSnapshot = await get(eventTagsRef);

      if (eventTagsSnapshot.exists()) {
        console.log('Found event tags relationship');
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
        console.log(`Found ${tags.length} tags for event`);
      } else {
        console.log('No tags found for event');
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
      console.error('Error getting event by ID:', error);
      throw error;
    }
  },

  // Create a new event
  createEvent: async (eventData, imageFile = null) => {
    try {
      console.log('Creating new event:', eventData.title);

      // Upload image if provided
      let imageUrl = null;
      if (imageFile) {
        console.log('Uploading event image to Cloudinary');
        const uploadResult = await uploadImage(imageFile, 'event-images');
        imageUrl = uploadResult.url;
        console.log('Image uploaded successfully:', imageUrl);
      }

      // Create event with image URL
      const eventsRef = ref(database, 'events');
      const newEventRef = push(eventsRef);

      // Prepare event data with image URL and timestamps
      const newEvent = {
        ...eventData,
        image_url: imageUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database
      await set(newEventRef, newEvent);
      console.log('Event created successfully with ID:', newEventRef.key);

      return {
        id: newEventRef.key,
        ...newEvent
      };
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  // Update an event
  updateEvent: async (id, updates, imageFile = null) => {
    try {
      console.log(`Updating event with ID: ${id}`);

      // Upload new image if provided
      if (imageFile) {
        console.log('Uploading new event image to Cloudinary');
        const uploadResult = await uploadImage(imageFile, 'event-images');
        updates.image_url = uploadResult.url;
        console.log('New image uploaded successfully:', updates.image_url);
      }

      // Update the event
      const eventRef = ref(database, `events/${id}`);

      // Add updated timestamp
      updates.updated_at = new Date().toISOString();

      await update(eventRef, updates);
      console.log('Event updated successfully');

      // Get the updated event
      const snapshot = await get(eventRef);

      return {
        id: snapshot.key,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  // Delete an event
  deleteEvent: async (id) => {
    try {
      console.log(`Deleting event with ID: ${id}`);
      const eventRef = ref(database, `events/${id}`);
      await remove(eventRef);
      console.log('Event deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  // Get events for a specific club
  getClubEvents: async (clubId) => {
    try {
      console.log(`Getting events for club ID: ${clubId}`);

      // Get all events first (which includes categories and tags)
      const allEvents = await eventService.getAllEvents();

      // Filter for events belonging to the specified club
      const clubEvents = allEvents.filter(event => event.club_id === clubId);

      console.log(`Found ${clubEvents.length} events for club ID: ${clubId}`);

      // Sort by start_date descending
      return clubEvents.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    } catch (error) {
      console.error('Error getting club events:', error);
      throw error;
    }
  },

  // Get featured events
  getFeaturedEvents: async (limit = 5) => {
    try {
      console.log(`Getting featured events (limit: ${limit})`);

      // Get all events first
      const allEvents = await eventService.getAllEvents();

      // Filter for featured events
      const featuredEvents = allEvents.filter(event => event.is_featured);

      console.log(`Found ${featuredEvents.length} featured events`);

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
      console.error('Error getting featured events:', error);
      throw error;
    }
  },

  // Update event status
  updateEventStatus: async (id, status) => {
    try {
      console.log(`Updating event status to ${status} for event ID: ${id}`);
      const eventRef = ref(database, `events/${id}`);

      await update(eventRef, {
        status,
        updated_at: new Date().toISOString()
      });

      console.log('Event status updated successfully');

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
      console.error('Error updating event status:', error);
      throw error;
    }
  },

  // Toggle registration status (open/closed)
  toggleRegistrationStatus: async (id, isOpen) => {
    try {
      console.log(`Setting registration status to ${isOpen ? 'open' : 'closed'} for event ID: ${id}`);
      const eventRef = ref(database, `events/${id}`);

      await update(eventRef, {
        registration_open: isOpen,
        updated_at: new Date().toISOString()
      });

      console.log('Registration status updated successfully');

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
      console.error('Error updating registration status:', error);
      throw error;
    }
  }
};

export default eventService;
