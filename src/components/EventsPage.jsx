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
    // Category filter
    const matchesFilter = filter === 'all' ||
      (event.categories && event.categories.name.toLowerCase() === filter.toLowerCase());

    // Search filter
    const searchTermLower = searchTerm.toLowerCase().trim();
    const matchesSearch = searchTermLower === '' ||
      event.title.toLowerCase().includes(searchTermLower) ||
      event.description.toLowerCase().includes(searchTermLower) ||
      (event.clubs && event.clubs.name.toLowerCase().includes(searchTermLower)) ||
      // Exact match for tag name (for tag filtering)
      (event.tags && event.tags.some(tag =>
        tag.name.toLowerCase() === searchTermLower ||
        tag.name.toLowerCase().includes(searchTermLower)
      ));

    return matchesFilter && matchesSearch;
  });

  return (
    <section className="section" id="events-page">
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
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

            <div>
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)'
                }}
              />
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
                >
                  <img
                    src={event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3'}
                    alt={event.title}
                    className="event-image"
                  />
                  <div className="event-content">
                    <span className="event-date">{formatEventDate(event.start_date, event.end_date)}</span>
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
                      {event.categories && (
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          backgroundColor: `${event.categories.color || 'var(--primary)'}20`,
                          borderRadius: '4px',
                          textTransform: 'capitalize',
                          color: event.categories.color || 'var(--primary)'
                        }}>
                          {event.categories.name}
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
                      {event.clubs && (
                        <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}>
                          {event.clubs.name}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEventId(event.id);
                        navigateTo(setCurrentPage, 'event-details', { eventId: event.id });
                      }}
                      className="btn"
                      style={{ marginTop: '1rem' }}
                    >
                      View Details
                    </button>
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
