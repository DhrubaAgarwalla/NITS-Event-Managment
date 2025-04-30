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

      const events = [];
      snapshot.forEach((childSnapshot) => {
        const eventData = childSnapshot.val();
        events.push({
          id: childSnapshot.key,
          ...eventData
        });
      });

      console.log(`Found ${events.length} events`);

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
      const eventsRef = ref(database, 'events');
      const snapshot = await get(eventsRef);

      if (!snapshot.exists()) {
        console.log('No events found');
        return [];
      }

      const now = new Date();
      const events = [];

      snapshot.forEach((childSnapshot) => {
        const eventData = childSnapshot.val();

        // Check if event is upcoming and start date is in the future
        if (
          eventData.status === 'upcoming' &&
          new Date(eventData.start_date) >= now
        ) {
          events.push({
            id: childSnapshot.key,
            ...eventData
          });
        }
      });

      console.log(`Found ${events.length} upcoming events`);

      // Sort by start_date ascending and limit
      return events
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
        }
      }

      // Get tags if available
      let tags = [];
      if (eventData.tags) {
        // If tags are stored as an array of IDs, fetch each tag
        if (Array.isArray(eventData.tags)) {
          const tagPromises = eventData.tags.map(async (tagId) => {
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
        }
        // If tags are stored as an object with tag IDs as keys
        else if (typeof eventData.tags === 'object') {
          tags = Object.keys(eventData.tags).map(tagId => ({
            id: tagId,
            ...eventData.tags[tagId]
          }));
        }
      }

      // Return event with related data
      return {
        ...eventData,
        clubs: clubData,
        categories: categoryData,
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
  },

  // Get featured events
  getFeaturedEvents: async (limit = 5) => {
    try {
      console.log(`Getting featured events (limit: ${limit})`);
      const eventsRef = ref(database, 'events');
      const snapshot = await get(eventsRef);

      if (!snapshot.exists()) {
        console.log('No events found');
        return [];
      }

      const events = [];
      snapshot.forEach((childSnapshot) => {
        const eventData = childSnapshot.val();

        // Check if event is featured
        if (eventData.is_featured) {
          events.push({
            id: childSnapshot.key,
            ...eventData
          });
        }
      });

      console.log(`Found ${events.length} featured events`);

      // Sort by start_date and limit
      return events
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
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
      return true;
    } catch (error) {
      console.error('Error updating event status:', error);
      throw error;
    }
  }
};

export default eventService;
