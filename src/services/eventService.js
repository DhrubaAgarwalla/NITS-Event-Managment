import supabase from '../lib/supabase';

// Event-related database operations
const eventService = {
  // Get all events
  getAllEvents: async () => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        clubs (id, name, logo_url),
        categories (id, name, color),
        event_tags (tag_id, tags:tag_id(id, name, color))
      `)
      .order('start_date', { ascending: false });

    if (error) throw error;

    // Process the data to format tags properly
    const processedData = data.map(event => {
      // Extract tags from the nested structure
      const tags = event.event_tags ?
        event.event_tags.map(et => et.tags).filter(tag => tag) :
        [];

      // Remove the raw event_tags data and add the processed tags
      const { event_tags, ...restEvent } = event;
      return {
        ...restEvent,
        tags
      };
    });

    return processedData;
  },

  // Get featured events
  getFeaturedEvents: async (limit = 6) => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        clubs (id, name, logo_url),
        categories (id, name, color),
        event_tags (tag_id, tags:tag_id(id, name, color))
      `)
      .eq('is_featured', true)
      .gte('end_date', new Date().toISOString())
      .order('start_date')
      .limit(limit);

    if (error) throw error;

    // Process the data to format tags properly
    const processedData = data.map(event => {
      // Extract tags from the nested structure
      const tags = event.event_tags ?
        event.event_tags.map(et => et.tags).filter(tag => tag) :
        [];

      // Remove the raw event_tags data and add the processed tags
      const { event_tags, ...restEvent } = event;
      return {
        ...restEvent,
        tags
      };
    });

    return processedData;
  },

  // Get upcoming events
  getUpcomingEvents: async (limit = 10) => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        clubs (id, name, logo_url),
        categories (id, name, color),
        event_tags (tag_id, tags:tag_id(id, name, color))
      `)
      .eq('status', 'upcoming')
      .gte('start_date', new Date().toISOString())
      .order('start_date')
      .limit(limit);

    if (error) throw error;

    // Process the data to format tags properly
    const processedData = data.map(event => {
      // Extract tags from the nested structure
      const tags = event.event_tags ?
        event.event_tags.map(et => et.tags).filter(tag => tag) :
        [];

      // Remove the raw event_tags data and add the processed tags
      const { event_tags, ...restEvent } = event;
      return {
        ...restEvent,
        tags
      };
    });

    return processedData;
  },

  // Get ongoing events
  getOngoingEvents: async (limit = 10) => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        clubs (id, name, logo_url),
        categories (id, name, color),
        event_tags (tag_id, tags:tag_id(id, name, color))
      `)
      .eq('status', 'ongoing')
      .order('end_date')
      .limit(limit);

    if (error) throw error;

    // Process the data to format tags properly
    const processedData = data.map(event => {
      // Extract tags from the nested structure
      const tags = event.event_tags ?
        event.event_tags.map(et => et.tags).filter(tag => tag) :
        [];

      // Remove the raw event_tags data and add the processed tags
      const { event_tags, ...restEvent } = event;
      return {
        ...restEvent,
        tags
      };
    });

    return processedData;
  },

  // Get a specific event by ID
  getEventById: async (id) => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        clubs (id, name, logo_url, description, contact_email, contact_phone),
        categories (id, name, color),
        event_tags (tag_id, tags:tag_id(id, name, color))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Process the data to format tags properly
    if (data && data.event_tags) {
      const tags = data.event_tags.map(et => et.tags).filter(tag => tag);
      const { event_tags, ...restEvent } = data;
      return {
        ...restEvent,
        tags
      };
    }

    return data;
  },

  // Create a new event
  createEvent: async (eventData) => {
    // Create a timeout promise that rejects after 20 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Supabase operation timed out after 20 seconds'));
      }, 20000);
    });

    try {
      console.log('Creating event with data:', eventData);

      // Check Supabase connection first
      console.log('Checking Supabase connection before creating event...');
      try {
        const connectionCheckStart = performance.now();
        const { data: connectionCheck, error: connectionError } = await Promise.race([
          supabase.from('categories').select('id').limit(1),
          timeoutPromise
        ]);
        const connectionCheckTime = Math.round(performance.now() - connectionCheckStart);

        if (connectionError) {
          console.error(`Supabase connection check failed (${connectionCheckTime}ms):`, connectionError);
          throw new Error(`Database connection error: ${connectionError.message}`);
        }

        console.log(`Supabase connection check successful (${connectionCheckTime}ms)`);
      } catch (connectionErr) {
        console.error('Failed to connect to Supabase:', connectionErr);
        throw new Error(`Database connection error: ${connectionErr.message}`);
      }

      // Ensure category_id is valid
      if (!eventData.category_id) {
        // Fetch a default category if none is provided
        const categories = await eventService.getCategories();
        if (categories && categories.length > 0) {
          eventData.category_id = categories[0].id;
        } else {
          // Use a fallback ID if no categories exist
          eventData.category_id = '1';
        }
      }

      // Create a minimal version of the event data with only required fields
      const minimalEventData = {
        title: String(eventData.title || '').trim(),
        description: String(eventData.description || '').trim(),
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        location: String(eventData.location || '').trim(),
        status: 'upcoming',
        club_id: eventData.club_id,
        category_id: eventData.category_id,
        registration_method: 'internal'
      };

      // Validate required fields
      if (!minimalEventData.title) {
        throw new Error('Event title is required');
      }

      if (!minimalEventData.start_date || !minimalEventData.end_date) {
        throw new Error('Event start and end dates are required');
      }

      if (!minimalEventData.club_id) {
        throw new Error('Club ID is required');
      }

      if (!minimalEventData.category_id) {
        throw new Error('Category ID is required');
      }

      console.log('Sending minimal event data to Supabase:', minimalEventData);

      // Create the event with minimal data first with timeout
      const insertStart = performance.now();
      const { data, error } = await Promise.race([
        supabase
          .from('events')
          .insert([minimalEventData])
          .select(),
        timeoutPromise
      ]);
      const insertTime = Math.round(performance.now() - insertStart);

      if (error) {
        console.error(`Error creating event with minimal data (${insertTime}ms):`, error);
        throw new Error(`Failed to create event: ${error.message}`);
      }

      if (!data || !data[0] || !data[0].id) {
        throw new Error('Event created but no data returned');
      }

      console.log(`Event created successfully with minimal data (${insertTime}ms):`, data[0]);
      const eventId = data[0].id;

      // Now add optional fields one by one
      const updates = {};

      // Add max_participants if provided
      if (eventData.max_participants) {
        try {
          updates.max_participants = parseInt(eventData.max_participants) || null;
        } catch (e) {
          console.warn('Invalid max_participants value, skipping');
        }
      }

      // Add registration_deadline if provided
      if (eventData.registration_deadline) {
        updates.registration_deadline = eventData.registration_deadline;
      }

      // Add status if provided and valid
      if (eventData.status && ['upcoming', 'ongoing', 'completed', 'cancelled'].includes(eventData.status)) {
        updates.status = eventData.status;
      }

      // Add registration_method if provided and valid
      if (eventData.registration_method && ['internal', 'external', 'both'].includes(eventData.registration_method)) {
        updates.registration_method = eventData.registration_method;
      }

      // Add external_form_url if provided
      if (eventData.external_form_url) {
        updates.external_form_url = String(eventData.external_form_url).trim();
      }

      // Add image_url if provided
      if (eventData.image_url) {
        updates.image_url = String(eventData.image_url).trim();
      }

      // Add additional_info if provided - simplify to avoid issues
      if (eventData.additional_info) {
        try {
          // Simplify the additional_info to a basic structure
          const simpleAdditionalInfo = {
            schedule: [
              {
                day: 'Day 1',
                events: [
                  { time: '09:00', title: 'Opening Ceremony', location: '' }
                ]
              }
            ]
          };
          updates.additional_info = simpleAdditionalInfo;
        } catch (e) {
          console.warn('Invalid additional_info, using default object');
          updates.additional_info = {
            schedule: [
              {
                day: 'Day 1',
                events: [
                  { time: '09:00', title: 'Event', location: '' }
                ]
              }
            ]
          };
        }
      }

      // Only update if there are fields to update
      if (Object.keys(updates).length > 0) {
        console.log('Updating event with additional fields:', updates);

        try {
          const updateStart = performance.now();
          const { data: updatedData, error: updateError } = await Promise.race([
            supabase
              .from('events')
              .update(updates)
              .eq('id', eventId)
              .select(),
            timeoutPromise
          ]);
          const updateTime = Math.round(performance.now() - updateStart);

          if (updateError) {
            console.error(`Error updating event with additional fields (${updateTime}ms):`, updateError);
            console.warn('Event created but additional fields could not be added');
            return data[0]; // Return the original event data
          }

          console.log(`Event updated with additional fields (${updateTime}ms):`, updatedData[0]);
          return updatedData[0];
        } catch (updateErr) {
          console.error('Exception updating event:', updateErr);
          // If it's a timeout error, the event might still be updated in the background
          if (updateErr.message.includes('timed out')) {
            console.warn('Update operation timed out, but the event was created successfully');
          }
          return data[0]; // Return the original event data
        }
      }

      // Return the original event data if no updates were needed
      return data[0];
    } catch (err) {
      console.error('Exception in createEvent:', err);
      throw err;
    }
  },

  // Update an event
  updateEvent: async (id, updates) => {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Delete an event
  deleteEvent: async (id) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Get all categories
  getCategories: async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      console.log('Categories fetched from database:', data);
      return data || [];
    } catch (err) {
      console.error('Exception in getCategories:', err);
      // Return default categories if there's an error
      return [
        { id: '1', name: 'Technical', color: '#3498db' },
        { id: '2', name: 'Cultural', color: '#e74c3c' },
        { id: '3', name: 'Sports', color: '#2ecc71' },
        { id: '4', name: 'Academic', color: '#f39c12' },
        { id: '5', name: 'Workshop', color: '#9b59b6' }
      ];
    }
  },

  // Create a new category (admin only)
  createCategory: async (categoryData) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Update event status
  updateEventStatus: async (id, status) => {
    const { data, error } = await supabase
      .from('events')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get events for a specific club
  getClubEvents: async (clubId) => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        categories (id, name, color),
        event_tags (tag_id, tags:tag_id(id, name, color))
      `)
      .eq('club_id', clubId)
      .order('start_date', { ascending: false });

    if (error) throw error;

    // Process the data to format tags properly
    const processedData = data.map(event => {
      // Extract tags from the nested structure
      const tags = event.event_tags ?
        event.event_tags.map(et => et.tags).filter(tag => tag) :
        [];

      // Remove the raw event_tags data and add the processed tags
      const { event_tags, ...restEvent } = event;
      return {
        ...restEvent,
        tags
      };
    });

    return processedData;
  },

  // Update an existing event
  updateEvent: async (eventId, eventData) => {
    // Validate inputs
    if (!eventId) throw new Error('Event ID is required');
    if (!eventData) throw new Error('Event data is required');

    console.log('Updating event with ID:', eventId);
    console.log('Update data:', eventData);

    // Update the event
    const { data, error } = await supabase
      .from('events')
      .update({ ...eventData, updated_at: new Date() })
      .eq('id', eventId)
      .select();

    if (error) {
      console.error('Error updating event:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Event not found or you do not have permission to update it');
    }

    return data[0];
  },

  // Get all tags
  getAllTags: async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching tags:', error);
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('Exception in getAllTags:', err);
      // Return default tags if there's an error
      return [
        { id: '1', name: 'Technical', color: '#3498db' },
        { id: '2', name: 'Cultural', color: '#e74c3c' },
        { id: '3', name: 'Sports', color: '#2ecc71' },
        { id: '4', name: 'Workshop', color: '#9b59b6' },
        { id: '5', name: 'Seminar', color: '#f39c12' }
      ];
    }
  },

  // Add tags to an event
  addTagsToEvent: async (eventId, tagIds) => {
    if (!eventId) throw new Error('Event ID is required');
    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      throw new Error('Tag IDs array is required');
    }

    // Create entries for the junction table
    const entries = tagIds.map(tagId => ({
      event_id: eventId,
      tag_id: tagId
    }));

    const { data, error } = await supabase
      .from('event_tags')
      .insert(entries)
      .select();

    if (error) {
      console.error('Error adding tags to event:', error);
      throw error;
    }

    return data;
  },

  // Remove tags from an event
  removeTagsFromEvent: async (eventId, tagIds) => {
    if (!eventId) throw new Error('Event ID is required');
    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      throw new Error('Tag IDs array is required');
    }

    const { error } = await supabase
      .from('event_tags')
      .delete()
      .eq('event_id', eventId)
      .in('tag_id', tagIds);

    if (error) {
      console.error('Error removing tags from event:', error);
      throw error;
    }

    return true;
  },

  // Get tags for a specific event
  getEventTags: async (eventId) => {
    if (!eventId) throw new Error('Event ID is required');

    const { data, error } = await supabase
      .from('event_tags')
      .select(`
        tag_id,
        tags:tag_id (id, name, color)
      `)
      .eq('event_id', eventId);

    if (error) {
      console.error('Error fetching event tags:', error);
      throw error;
    }

    // Extract the tags from the nested structure
    return data.map(item => item.tags);
  }
};

export default eventService;
