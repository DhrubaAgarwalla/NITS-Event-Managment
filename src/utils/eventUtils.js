/**
 * Event utility functions for status determination and sorting
 */

/**
 * Determine the status of an event based on current date and event dates
 * @param {Object} event - Event object with start_date and end_date
 * @returns {string} - 'upcoming', 'ongoing', or 'completed'
 */
export const getEventStatus = (event) => {
  if (!event.start_date || !event.end_date) {
    return 'upcoming'; // Default to upcoming if dates are missing
  }

  const now = new Date();
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);

  // Set time to start/end of day for accurate comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const eventEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  if (today < eventStart) {
    return 'upcoming';
  } else if (today >= eventStart && today <= eventEnd) {
    return 'ongoing';
  } else {
    return 'completed';
  }
};

/**
 * Get status badge color and text for display
 * @param {string} status - Event status ('upcoming', 'ongoing', 'completed')
 * @returns {Object} - Object with color and text properties
 */
export const getStatusBadge = (status) => {
  switch (status) {
    case 'upcoming':
      return {
        color: '#3b82f6', // Blue
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        text: '📅 Upcoming',
        textColor: '#3b82f6'
      };
    case 'ongoing':
      return {
        color: '#10b981', // Green
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        text: '🔴 Live',
        textColor: '#10b981'
      };
    case 'completed':
      return {
        color: '#6b7280', // Gray
        backgroundColor: 'rgba(107, 114, 128, 0.15)',
        text: '✅ Completed',
        textColor: '#6b7280'
      };
    default:
      return {
        color: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        text: '📅 Upcoming',
        textColor: '#3b82f6'
      };
  }
};

/**
 * Filter events by status
 * @param {Array} events - Array of events
 * @param {string} statusFilter - Status to filter by ('all', 'upcoming', 'ongoing', 'completed')
 * @returns {Array} - Filtered events
 */
export const filterEventsByStatus = (events, statusFilter) => {
  if (statusFilter === 'all') {
    return events;
  }

  return events.filter(event => getEventStatus(event) === statusFilter);
};

/**
 * Sort events with featured events first, then by creation date (newest first)
 * @param {Array} events - Array of events to sort
 * @returns {Array} - Sorted events
 */
export const sortEventsWithFeatured = (events) => {
  return events.sort((a, b) => {
    // Featured events first
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;

    // If both are featured or both are not featured, sort by creation date (newest first)
    const aCreated = new Date(a.created_at || a.start_date);
    const bCreated = new Date(b.created_at || b.start_date);
    return bCreated - aCreated;
  });
};

/**
 * Get event status counts for display
 * @param {Array} events - Array of events
 * @returns {Object} - Object with counts for each status
 */
export const getEventStatusCounts = (events) => {
  const counts = {
    all: events.length,
    upcoming: 0,
    ongoing: 0,
    completed: 0
  };

  events.forEach(event => {
    const status = getEventStatus(event);
    counts[status]++;
  });

  return counts;
};

/**
 * Format event date range for display
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @returns {string} - Formatted date range
 */
export const formatEventDateRange = (startDate, endDate) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start.toDateString() === end.toDateString()) {
      // Same day event
      return start.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } else {
      // Multi-day event
      const startFormatted = start.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      const endFormatted = end.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      return `${startFormatted} - ${endFormatted}`;
    }
  } catch (err) {
    return 'Date not available';
  }
};
