import supabase from '../lib/supabase';

// Registration-related database operations
const registrationService = {
  // Get all registrations for an event
  getEventRegistrations: async (eventId) => {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Register for an event (internal registration)
  registerForEvent: async (registrationData) => {
    const { data, error } = await supabase
      .from('registrations')
      .insert([registrationData])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Check if a participant is already registered
  checkExistingRegistration: async (eventId, email) => {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('participant_email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Update registration status
  updateRegistrationStatus: async (id, status) => {
    const { data, error } = await supabase
      .from('registrations')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Delete a registration
  deleteRegistration: async (id) => {
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Get registration statistics for an event
  getRegistrationStats: async (eventId) => {
    const { data, error } = await supabase
      .from('registrations')
      .select('status')
      .eq('event_id', eventId);

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total: data.length,
      registered: data.filter(r => r.status === 'registered').length,
      attended: data.filter(r => r.status === 'attended').length,
      cancelled: data.filter(r => r.status === 'cancelled').length
    };

    return stats;
  },

  // Add external registrations (for Google Form registrations)
  addExternalRegistrations: async (registrationsData) => {
    const { data, error } = await supabase
      .from('registrations')
      .insert(registrationsData)
      .select();

    if (error) throw error;
    return data;
  },

  // Export registrations as CSV
  exportRegistrationsAsCSV: async (eventId, eventTitle) => {
    try {
      // Get all registrations for the event
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        return { success: false, message: 'No registrations found for this event' };
      }

      // Define CSV headers
      const headers = [
        'Name',
        'Email',
        'Phone',
        'ID/Roll Number',
        'Department',
        'Year',
        'Team Type',
        'Status',
        'Registration Date'
      ];

      // Format the data for CSV
      const csvRows = [];

      // Add headers
      csvRows.push(headers.join(','));

      // Add data rows
      data.forEach(registration => {
        const row = [
          `"${registration.participant_name || ''}"`,
          `"${registration.participant_email || ''}"`,
          `"${registration.participant_phone || ''}"`,
          `"${registration.participant_id || ''}"`,
          `"${registration.additional_info?.department || ''}"`,
          `"${registration.additional_info?.year || ''}"`,
          `"${registration.additional_info?.team_type || 'individual'}"`,
          `"${registration.status || ''}"`,
          `"${new Date(registration.created_at).toLocaleString() || ''}"`
        ];

        csvRows.push(row.join(','));
      });

      // If there are team members, create a separate CSV for team members
      const teamMembers = [];
      let hasTeamMembers = false;

      // Add team members header
      teamMembers.push(['Registration Email', 'Team Member Name', 'Team Member Email', 'Team Member ID'].join(','));

      // Add team members data
      data.forEach(registration => {
        if (registration.additional_info?.team_type === 'team' &&
            registration.additional_info?.team_members &&
            registration.additional_info.team_members.length > 0) {

          hasTeamMembers = true;

          registration.additional_info.team_members.forEach(member => {
            const row = [
              `"${registration.participant_email || ''}"`,
              `"${member.name || ''}"`,
              `"${member.email || ''}"`,
              `"${member.rollNumber || ''}"`
            ];

            teamMembers.push(row.join(','));
          });
        }
      });

      // Create CSV content
      const csvContent = csvRows.join('\n');
      const teamMembersCSV = hasTeamMembers ? teamMembers.join('\n') : null;

      // Format event title for filename
      const safeEventTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);

      return {
        success: true,
        registrationsCSV: {
          content: csvContent,
          filename: `${safeEventTitle}_registrations_${timestamp}.csv`
        },
        teamMembersCSV: hasTeamMembers ? {
          content: teamMembersCSV,
          filename: `${safeEventTitle}_team_members_${timestamp}.csv`
        } : null
      };
    } catch (error) {
      console.error('Error exporting registrations:', error);
      return { success: false, message: error.message || 'Failed to export registrations' };
    }
  }
};

export default registrationService;
