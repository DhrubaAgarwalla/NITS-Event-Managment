import supabase from '../lib/supabase';

// Club-related database operations
const clubService = {
  // Get all clubs
  getAllClubs: async () => {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  // Get a specific club by ID
  getClubById: async (id) => {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update club profile
  updateClubProfile: async (id, updates) => {
    const { data, error } = await supabase
      .from('clubs')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get club events
  getClubEvents: async (clubId) => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        categories (name, color)
      `)
      .eq('club_id', clubId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Submit club profile request (for non-admin users)
  submitClubRequest: async (requestData) => {
    try {
      // Add default values for required fields
      const requestWithDefaults = {
        ...requestData,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      };

      const { data, error } = await supabase
        .from('club_requests')
        .insert([requestWithDefaults])
        .select();

      if (error) {
        console.error('Error submitting club request:', error);

        // Check for RLS policy violation
        if (error.message.includes('row-level security') || error.message.includes('policy')) {
          throw new Error('Permission denied. Please contact an administrator for assistance.');
        }

        throw error;
      }

      return data?.[0] || { success: true };
    } catch (err) {
      console.error('Unexpected error in submitClubRequest:', err);
      throw err;
    }
  },

  // Get pending club requests (admin only)
  getPendingRequests: async () => {
    const { data, error } = await supabase
      .from('club_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Approve or reject club request (admin only)
  updateRequestStatus: async (requestId, status, adminNotes) => {
    const { data, error } = await supabase
      .from('club_requests')
      .update({
        status,
        admin_notes: adminNotes,
        updated_at: new Date()
      })
      .eq('id', requestId)
      .select();

    if (error) throw error;
    return data[0];
  }
};

export default clubService;
