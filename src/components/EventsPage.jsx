import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import eventService from '../services/eventService';
import { navigateTo } from '../utils/navigation';

const EventsPage = ({ setCurrentPage, setSelectedEventId }) => {
  const [filter, setFilter] = useState('all');
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
        setEvents(eventsData);

        // Fetch categories
        const categoriesData = await eventService.getCategories();
        setCategories(categoriesData);

        setError(null);
      } catch (err) {
        console.error('Error fetching events:', err);
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
      console.error('Error formatting date:', err);
      return 'Date not available';
    }
  };

  // Filter events based on category and search term
  const filteredEvents = events.filter(event => {
    // Category filter - check both category and categories for backward compatibility
    const matchesFilter = filter === 'all' ||
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

    return matchesFilter && matchesSearch;
  })
  // Sort to ensure featured events appear first
  .sort((a, b) => {
    // Featured events first
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;

    // If both are featured or both are not featured, sort by start date
    return new Date(a.start_date) - new Date(b.start_date);
  });

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
          <div className="search-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="filter-buttons" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                className={`btn ${filter === 'all' ? 'btn-primary' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              {/* Limit to 6 unique categories */}
              {categories
                .filter((category, index, self) =>
                  // Remove duplicates by name
                  index === self.findIndex(c => c.name.toLowerCase() === category.name.toLowerCase())
                )
                .slice(0, 6)
                .map(category => (
                  <button
                    key={category.id}
                    className={`btn ${filter === category.name.toLowerCase() ? 'btn-primary' : ''}`}
                    onClick={() => setFilter(category.name.toLowerCase())}
                  >
                    {category.name}
                  </button>
                ))}
            </div>

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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="event-date">{formatEventDate(event.start_date, event.end_date)}</span>
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
