import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import eventService from '../services/eventService';
import eventAutomationService from '../services/eventAutomationService';
import { navigateTo } from '../utils/navigation';
import {
  getEventStatus,
  getStatusBadge,
  filterEventsByStatus,
  sortEventsWithFeatured,
  getEventStatusCounts,
  formatEventDateRange,
  getRegistrationStatus,
  getTimeRemaining
} from '../utils/eventUtils';

import logger from '../utils/logger';
const EventsPage = ({ setCurrentPage, setSelectedEventId }) => {
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch events and categories from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all events
        const eventsData = await eventService.getAllEvents();

        // Run automation tasks on the fetched events
        if (eventsData && eventsData.length > 0) {
          logger.log('Running event automation tasks...');

          // Auto-close registrations for completed events
          const automationResults = await eventAutomationService.autoCloseRegistrations(eventsData);

          if (automationResults.length > 0) {
            logger.log(`Auto-closed registration for ${automationResults.length} events`);

            // Refresh events data if any registrations were closed
            const updatedEventsData = await eventService.getAllEvents();
            setEvents(updatedEventsData);
          } else {
            setEvents(eventsData);
          }
        } else {
          setEvents(eventsData);
        }

        // Fetch categories
        const categoriesData = await eventService.getCategories();
        setCategories(categoriesData);

        setError(null);
      } catch (err) {
        logger.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format event date for display
  const formatEventDate = (startDate, endDate) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start.toDateString() === end.toDateString()) {
        // Same day event
        return format(start, 'MMMM d, yyyy');
      } else {
        // Multi-day event
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      }
    } catch (err) {
      logger.error('Error formatting date:', err);
      return 'Date not available';
    }
  };

  // Filter events based on category, status, and search term
  const filteredEvents = (() => {
    let filtered = events.filter(event => {
      // Category filter - check both category and categories for backward compatibility
      const matchesCategory = filter === 'all' ||
        (event.category && event.category.name && event.category.name.toLowerCase() === filter.toLowerCase()) ||
        (event.categories && event.categories.name && event.categories.name.toLowerCase() === filter.toLowerCase());

      // Search filter
      const searchTermLower = searchTerm.toLowerCase().trim();
      const matchesSearch = searchTermLower === '' ||
        (event.title && event.title.toLowerCase().includes(searchTermLower)) ||
        (event.description && event.description.toLowerCase().includes(searchTermLower)) ||
        // Check both club and clubs for backward compatibility
        (event.club && event.club.name && event.club.name.toLowerCase().includes(searchTermLower)) ||
        (event.clubs && event.clubs.name && event.clubs.name.toLowerCase().includes(searchTermLower)) ||
        // Match for tag name (for tag filtering)
        (event.tags && Array.isArray(event.tags) && event.tags.some(tag =>
          tag && tag.name && (
            tag.name.toLowerCase() === searchTermLower ||
            tag.name.toLowerCase().includes(searchTermLower)
          )
        ));

      return matchesCategory && matchesSearch;
    });

    // Apply status filter
    filtered = filterEventsByStatus(filtered, statusFilter);

    // Sort with featured events first, then by creation date (newest first)
    return sortEventsWithFeatured(filtered);
  })();

  // Get status counts for display
  const statusCounts = getEventStatusCounts(events);

  return (
    <section className="section events-page" id="events-page">
      <div className="container">
        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          All <span className="gradient-text">Events</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ marginBottom: '2rem' }}
        >
          {/* Filter Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Filter Dropdowns Row */}
            <div style={{
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              '@media (max-width: 768px)': {
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '1rem'
              }
            }}>
              {/* Category Filter Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <label style={{
                  color: 'var(--text-primary)',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap'
                }}>
                  Category:
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    cursor: 'pointer',
                    minWidth: '160px',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <option value="all" style={{ backgroundColor: 'var(--dark-surface)', color: 'var(--text-primary)' }}>
                    All Categories
                  </option>
                  {categories
                    .filter((category, index, self) =>
                      // Remove duplicates by name
                      index === self.findIndex(c => c.name.toLowerCase() === category.name.toLowerCase())
                    )
                    .map(category => (
                      <option
                        key={category.id}
                        value={category.name.toLowerCase()}
                        style={{ backgroundColor: 'var(--dark-surface)', color: 'var(--text-primary)' }}
                      >
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Status Filter Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <label style={{
                  color: 'var(--text-primary)',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap'
                }}>
                  Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    cursor: 'pointer',
                    minWidth: '180px',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <option value="all" style={{ backgroundColor: 'var(--dark-surface)', color: 'var(--text-primary)' }}>
                    All Events ({statusCounts.all})
                  </option>
                  <option value="upcoming" style={{ backgroundColor: 'var(--dark-surface)', color: 'var(--text-primary)' }}>
                    📅 Upcoming ({statusCounts.upcoming})
                  </option>
                  <option value="ongoing" style={{ backgroundColor: 'var(--dark-surface)', color: 'var(--text-primary)' }}>
                    🔴 Live ({statusCounts.ongoing})
                  </option>
                  <option value="completed" style={{ backgroundColor: 'var(--dark-surface)', color: 'var(--text-primary)' }}>
                    ✅ Completed ({statusCounts.completed})
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Search Container */}
          <div className="search-container" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>

            <div className="search-input-container" style={{ position: 'relative', minWidth: '300px' }}>
              <div className="search-icon" style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '1.1rem',
                pointerEvents: 'none',
                zIndex: 1
              }}>
                🔍
              </div>
              <input
                className="search-input"
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem 3rem 0.8rem 3rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(110, 68, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {searchTerm && (
                <button
                  className="clear-button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease',
                    zIndex: 1
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'var(--primary)';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'rgba(255, 255, 255, 0.5)';
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>Loading events...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--error)' }}>
            <p>{error}</p>
          </div>
        ) : (
          <div className="events-grid content" style={{ marginTop: '2rem' }}>
            {filteredEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--dark-surface)', borderRadius: '8px', gridColumn: '1 / -1' }}>
                <p>No events found matching your criteria.</p>
              </div>
            ) : (
              filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  className="event-card"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -10, transition: { duration: 0.3 } }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}
                >
                  <img
                    src={event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3'}
                    alt={event.title}
                    className="event-image"
                  />
                  <div className="event-content" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    justifyContent: 'space-between'
                  }}>
                    <div className="event-content-top">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span className="event-date">{formatEventDateRange(event.start_date, event.end_date)}</span>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* Event Status Badge */}
                          {(() => {
                            const status = getEventStatus(event);
                            const statusBadge = getStatusBadge(status);
                            return (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: statusBadge.backgroundColor,
                                color: statusBadge.textColor,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}>
                                {statusBadge.text}
                              </span>
                            );
                          })()}
                          {/* Featured Badge */}
                          {event.is_featured && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor: 'rgba(255, 215, 0, 0.15)',
                              color: '#ffd700',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>
                              ⭐ Featured
                            </span>
                          )}
                        </div>
                      </div>
                      <h3 className="event-title">{event.title}</h3>
                      <p className="event-description">{event.description}</p>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: '0.5rem',
                        fontSize: '0.8rem',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                        {/* Category */}
                        {(event.category || event.categories) && (
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            backgroundColor: `${(event.category && event.category.color) || (event.categories && event.categories.color) || 'var(--primary)'}20`,
                            borderRadius: '4px',
                            textTransform: 'capitalize',
                            color: (event.category && event.category.color) || (event.categories && event.categories.color) || 'var(--primary)'
                          }}>
                            {(event.category && event.category.name) || (event.categories && event.categories.name) || 'Uncategorized'}
                          </span>
                        )}

                        {/* Tags - Show limited tags (max 6) */}
                        {event.tags && event.tags.slice(0, 6).map((tag, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '0.2rem 0.5rem',
                              backgroundColor: `${tag.color || '#6c5ce7'}15`,
                              borderRadius: '4px',
                              textTransform: 'capitalize',
                              color: tag.color || '#6c5ce7',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Filter by tag name
                              setSearchTerm(tag.name);
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}

                        {/* Show +X more if there are more tags */}
                        {event.tags && event.tags.length > 6 && (
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '4px',
                            color: 'var(--text-secondary)',
                            fontSize: '0.7rem',
                            cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEventId(event.id);
                            navigateTo(setCurrentPage, 'event-details', { eventId: event.id });
                          }}
                          >
                            +{event.tags.length - 6} more
                          </span>
                        )}

                        {/* Club name */}
                        {(event.club || event.clubs) && (
                          <span style={{
                            marginLeft: 'auto',
                            color: 'var(--primary)',
                            fontWeight: '600',
                            backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span style={{ fontSize: '0.9rem' }}>🏢</span>
                            {(event.club && event.club.name) || (event.clubs && event.clubs.name) || 'Unknown Club'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="event-content-bottom" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                      {/* Registration Status */}
                      {(() => {
                        const registrationStatus = getRegistrationStatus(event);
                        const timeRemaining = getTimeRemaining(event);

                        return (
                          <div style={{ marginBottom: '1rem' }}>
                            {/* Registration Status Badge */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '0.5rem',
                              fontSize: '0.8rem'
                            }}>
                              <span style={{
                                color: registrationStatus.statusColor,
                                fontWeight: '500'
                              }}>
                                {registrationStatus.statusText}
                              </span>

                              {/* Time Remaining */}
                              {timeRemaining.text !== 'Event completed' && (
                                <span style={{
                                  color: timeRemaining.isUrgent ? '#f59e0b' : 'var(--text-secondary)',
                                  fontWeight: timeRemaining.isUrgent ? '600' : '400',
                                  fontSize: '0.75rem'
                                }}>
                                  {timeRemaining.isUrgent ? '⚡' : '⏰'} {timeRemaining.text}
                                </span>
                              )}
                            </div>

                            {/* Registration Progress Bar (if applicable) */}
                            {event.max_participants && event.current_participants && (
                              <div style={{ marginBottom: '0.5rem' }}>
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: '0.75rem',
                                  marginBottom: '0.25rem'
                                }}>
                                  <span>Registrations</span>
                                  <span>{event.current_participants}/{event.max_participants}</span>
                                </div>
                                <div style={{
                                  width: '100%',
                                  height: '4px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  borderRadius: '2px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: `${Math.min((event.current_participants / event.max_participants) * 100, 100)}%`,
                                    height: '100%',
                                    backgroundColor: event.current_participants >= event.max_participants ? '#ef4444' : 'var(--primary)',
                                    transition: 'width 0.3s ease'
                                  }} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <button
                        onClick={() => {
                          setSelectedEventId(event.id);
                          navigateTo(setCurrentPage, 'event-details', { eventId: event.id });
                        }}
                        className="btn"
                        style={{ width: '100%' }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default EventsPage;
