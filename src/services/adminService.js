import supabase from '../lib/supabase';

// Admin-related database operations
const adminService = {
  // Check if a user is an admin
  isAdmin: async (userId) => {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  // Create a club account (admin only)
  createClubAccount: async (email, password, clubData) => {
    try {
      // Use regular signup instead of admin API
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            is_club: true,
            club_name: clubData.name
          }
        }
      });

      if (authError) {
        console.error('Auth error creating club account:', authError);
        throw authError;
      }

      // Create club profile
      if (authData.user) {
        // Add a delay to ensure the user is created in the auth system
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data, error } = await supabase
          .from('clubs')
          .insert([{ ...clubData, id: authData.user.id }])
          .select();

        if (error) {
          console.error('Database error creating club profile:', error);
          throw error;
        }

        // Generate a random password to show to the admin
        const tempPassword = password || Math.random().toString(36).slice(-8);

        return {
          success: true,
          club: data?.[0] || { name: clubData.name, email },
          tempPassword
        };
      }

      throw new Error('Failed to create user');
    } catch (err) {
      console.error('Error creating club account:', err);
      throw err;
    }
  },

  // Get all club requests
  getClubRequests: async () => {
    try {
      const { data, error } = await supabase
        .from('club_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching club requests:', error);
        // Return empty array instead of throwing error
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Unexpected error in getClubRequests:', err);
      return [];
    }
  },

  // Approve a club request
  approveClubRequest: async (requestId, email, password, clubData) => {
    try {
      // Create the club account
      const result = await adminService.createClubAccount(email, password, clubData);

      // Update the request status
      const { error } = await supabase
        .from('club_requests')
        .update({
          status: 'approved',
          admin_notes: 'Account created successfully',
          updated_at: new Date()
        })
        .eq('id', requestId);

      if (error) throw error;

      return result;
    } catch (err) {
      console.error('Error approving club request:', err);
      throw err;
    }
  },

  // Reject a club request
  rejectClubRequest: async (requestId, reason) => {
    const { data, error } = await supabase
      .from('club_requests')
      .update({
        status: 'rejected',
        admin_notes: reason,
        updated_at: new Date()
      })
      .eq('id', requestId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get all events for admin review
  getAllEvents: async () => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        clubs (id, name),
        categories (id, name, color)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Feature or unfeature an event
  toggleEventFeatured: async (eventId, isFeatured) => {
    const { data, error } = await supabase
      .from('events')
      .update({ is_featured: isFeatured })
      .eq('id', eventId)
      .select();

    if (error) throw error;
    return data[0];
  }
};

export default adminService;
