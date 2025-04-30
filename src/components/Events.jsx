import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { format } from 'date-fns';
import eventService from '../services/eventService';
import { navigateTo } from '../utils/navigation';

const Events = ({ setCurrentPage, setSelectedEventId }) => {
  const sectionRef = useRef(null);
  const [filter, setFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState(null);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for tag filter in localStorage
  useEffect(() => {
    const selectedTag = window.localStorage.getItem('selectedTag');
    if (selectedTag) {
      setTagFilter(selectedTag);
      // Clear the localStorage item after reading it
      window.localStorage.removeItem('selectedTag');
    }
  }, []);

  // Fetch events and categories from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch featured and upcoming events
        const featuredEvents = await eventService.getFeaturedEvents(6);
        const upcomingEvents = await eventService.getUpcomingEvents(6);

        // Combine and remove duplicates
        const combinedEvents = [...featuredEvents];
        upcomingEvents.forEach(event => {
          if (!combinedEvents.some(e => e.id === event.id)) {
            combinedEvents.push(event);
          }
        });

        // Limit to 12 events
        const limitedEvents = combinedEvents.slice(0, 12);
        setEvents(limitedEvents);

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

  // Filter events based on category and tags
  const filteredEvents = events.filter(event => {
    // First apply category filter
    const passesCategory = filter === 'all' ||
      (event.categories && event.categories.name.toLowerCase() === filter.toLowerCase());

    // Then apply tag filter if it exists
    const passesTag = !tagFilter ||
      (event.tags && event.tags.some(tag => tag.name.toLowerCase() === tagFilter.toLowerCase()));

    return passesCategory && passesTag;
  });

  useEffect(() => {
    if (sectionRef.current) {
      // Animate cards on scroll
      const cards = sectionRef.current.querySelectorAll('.event-card');

      gsap.fromTo(
        cards,
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            end: 'center center',
            scrub: 1,
          },
        }
      );
    }
  }, [filter]);

  return (
    <section className="section" id="events" ref={sectionRef}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{ margin: 0 }}
          >
            Upcoming <span className="gradient-text">Events</span>
          </motion.h2>

          <motion.button
            className="btn btn-primary"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            onClick={() => setCurrentPage('events-page')}
          >
            View All Events
          </motion.button>
        </div>

        {tagFilter && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(108, 92, 231, 0.1)',
              borderRadius: '4px',
              color: 'var(--text-primary)'
            }}
          >
            <span>Filtering by tag: <strong>{tagFilter}</strong></span>
            <button
              onClick={() => setTagFilter(null)}
              style={{
                marginLeft: '1rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                transition: 'all 0.2s ease'
              }}
            >
              Clear Filter
            </button>
          </motion.div>
        )}

        <motion.div
          className="filter-buttons"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}
        >
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
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>Loading events...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--error)' }}>
            <p>{error}</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>No events found. Check back later!</p>
          </div>
        ) : (
          <div className="events-grid content">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                className="event-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
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
                          setTagFilter(tag.name);
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
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Events;
