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

/**
 * Check if event registration should be automatically closed
 * @param {Object} event - Event object
 * @returns {boolean} - True if registration should be closed
 */
export const shouldAutoCloseRegistration = (event) => {
  if (!event.start_date || !event.end_date) {
    return false;
  }

  const status = getEventStatus(event);

  // Auto-close registration for completed events
  if (status === 'completed') {
    return true;
  }

  // Auto-close registration if registration deadline has passed
  if (event.registration_deadline) {
    const deadline = new Date(event.registration_deadline);
    const now = new Date();
    if (now > deadline) {
      return true;
    }
  }

  return false;
};

/**
 * Get registration status with automatic closure logic
 * @param {Object} event - Event object
 * @returns {Object} - Registration status info
 */
export const getRegistrationStatus = (event) => {
  const shouldClose = shouldAutoCloseRegistration(event);
  const eventStatus = getEventStatus(event);

  // If event is manually closed or should be auto-closed
  const isClosed = !event.registration_open || shouldClose;

  let statusText = '';
  let statusColor = '';
  let canRegister = false;

  if (eventStatus === 'completed') {
    statusText = '🔒 Registration Closed (Event Completed)';
    statusColor = '#6b7280';
    canRegister = false;
  } else if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
    statusText = '⏰ Registration Deadline Passed';
    statusColor = '#f59e0b';
    canRegister = false;
  } else if (!event.registration_open) {
    statusText = '🔒 Registration Closed';
    statusColor = '#ef4444';
    canRegister = false;
  } else if (eventStatus === 'ongoing') {
    statusText = '⚡ Late Registration (Event Started)';
    statusColor = '#f59e0b';
    canRegister = true;
  } else {
    statusText = '✅ Registration Open';
    statusColor = '#10b981';
    canRegister = true;
  }

  return {
    isClosed,
    canRegister,
    statusText,
    statusColor,
    shouldAutoClose: shouldClose,
    eventStatus
  };
};

/**
 * Get time remaining until event starts/ends
 * @param {Object} event - Event object
 * @returns {Object} - Time remaining info
 */
export const getTimeRemaining = (event) => {
  if (!event.start_date || !event.end_date) {
    return { text: 'Date not available', isUrgent: false };
  }

  const now = new Date();
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const status = getEventStatus(event);

  let targetDate, prefix, isUrgent = false;

  if (status === 'upcoming') {
    targetDate = startDate;
    prefix = 'Starts in';
    // Mark as urgent if less than 24 hours
    isUrgent = (targetDate - now) < (24 * 60 * 60 * 1000);
  } else if (status === 'ongoing') {
    targetDate = endDate;
    prefix = 'Ends in';
    isUrgent = true; // Ongoing events are always urgent
  } else {
    return { text: 'Event completed', isUrgent: false };
  }

  const timeDiff = targetDate - now;

  if (timeDiff <= 0) {
    return { text: status === 'upcoming' ? 'Starting now' : 'Ending now', isUrgent: true };
  }

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  let timeText = '';
  if (days > 0) {
    timeText = `${days}d ${hours}h`;
  } else if (hours > 0) {
    timeText = `${hours}h ${minutes}m`;
  } else {
    timeText = `${minutes}m`;
  }

  return {
    text: `${prefix} ${timeText}`,
    isUrgent,
    days,
    hours,
    minutes
  };
};

/**
 * Check if event needs attention (for admin dashboard)
 * @param {Object} event - Event object
 * @returns {Array} - Array of attention items
 */
export const getEventAttentionItems = (event) => {
  const attention = [];
  const status = getEventStatus(event);
  const registrationStatus = getRegistrationStatus(event);
  const timeRemaining = getTimeRemaining(event);

  // Registration issues
  if (registrationStatus.shouldAutoClose && event.registration_open) {
    attention.push({
      type: 'warning',
      message: 'Registration should be closed automatically',
      action: 'auto_close_registration'
    });
  }

  // Upcoming events without registration deadline
  if (status === 'upcoming' && !event.registration_deadline) {
    attention.push({
      type: 'info',
      message: 'No registration deadline set',
      action: 'set_deadline'
    });
  }

  // Events starting soon
  if (timeRemaining.isUrgent && status === 'upcoming') {
    attention.push({
      type: 'urgent',
      message: `Event starts in ${timeRemaining.days > 0 ? timeRemaining.days + 'd' : timeRemaining.hours + 'h'}`,
      action: 'prepare_event'
    });
  }

  // Ongoing events
  if (status === 'ongoing') {
    attention.push({
      type: 'active',
      message: 'Event is currently running',
      action: 'monitor_event'
    });
  }

  // Events without images
  if (!event.image_url) {
    attention.push({
      type: 'info',
      message: 'No event image uploaded',
      action: 'add_image'
    });
  }

  return attention;
};
