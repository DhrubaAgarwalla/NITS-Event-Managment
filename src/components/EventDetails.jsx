import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import EventRegistration from './EventRegistration';
import eventService from '../services/eventService';
import registrationService from '../services/registrationService';

const EventDetails = ({ setCurrentPage, eventId }) => {
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [shareUrl, setShareUrl] = useState('');
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  // Fetch event data from Supabase
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);

        // Fetch event details
        const eventData = await eventService.getEventById(eventId);
        setEvent(eventData);

        // Fetch registrations count
        const registrationsData = await registrationService.getEventRegistrations(eventId);
        setRegistrations(registrationsData);

        setError(null);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  // Set share URL when component mounts
  useEffect(() => {
    // Use Vercel deployment URL instead of dynamic URL
    const baseUrl = 'https://nits-event-managment.vercel.app';
    // Create a shareable URL with the event ID
    const shareableUrl = `${baseUrl}/event/${eventId}`;
    setShareUrl(shareableUrl);
  }, [eventId]);

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

  // Format event time for display
  const formatEventTime = (startDate, endDate) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
    } catch (err) {
      console.error('Error formatting time:', err);
      return 'Time not available';
    }
  };

  // Share functions
  const shareOnFacebook = () => {
    // Include event title and image in Facebook share
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    // Create a more detailed tweet with event info
    const text = event
      ? `Check out ${event.title} at NIT Silchar! ${formatEventDate(event.start_date, event.end_date)} at ${event.location}`
      : 'Check out this event!';
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnLinkedIn = () => {
    // LinkedIn sharing with title and summary
    const title = event ? encodeURIComponent(event.title) : encodeURIComponent('NIT Silchar Event');
    const summary = event ? encodeURIComponent(`${formatEventDate(event.start_date, event.end_date)} at ${event.location}`) : '';
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${title}&summary=${summary}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnWhatsApp = () => {
    // Create a more detailed WhatsApp message with event info
    const text = event
      ? `Check out ${event.title} at NIT Silchar!\n\n📅 ${formatEventDate(event.start_date, event.end_date)}\n⏰ ${formatEventTime(event.start_date, event.end_date)}\n📍 ${event.location}\n\n${event.description?.substring(0, 100)}${event.description?.length > 100 ? '...' : ''}\n\n${shareUrl}`
      : `Check out this event: ${shareUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShowShareTooltip(true);
      setTimeout(() => setShowShareTooltip(false), 2000);
    }).catch(err => {
      console.error('Failed to copy URL: ', err);
    });
  };

  // If loading, show loading state
  if (loading) {
    return (
      <section className="section" id="event-details">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <p>Loading event details...</p>
          </div>
        </div>
      </section>
    );
  }

  // If error, show error state
  if (error || !event) {
    return (
      <section className="section" id="event-details">
        <div className="container">
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              onClick={() => setCurrentPage('home')}
              className="btn"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>←</span> Back to Events
            </button>
          </div>
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--error)' }}>
            <p>{error || 'Event not found'}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section" id="event-details">
      <div className="container">
        {/* Back Button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => setCurrentPage('home')}
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>←</span> Back to Events
          </button>
        </div>

        {/* Event Header */}
        <div
          style={{
            position: 'relative',
            height: '400px',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '2rem'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.6)'
            }}
          ></div>

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              padding: '2rem',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
            }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              style={{ marginBottom: '0.5rem' }}
            >
              {event.title}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--accent)' }}>📅</span>
                <span>{formatEventDate(event.start_date, event.end_date)}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--accent)' }}>📍</span>
                <span>{event.location}</span>
              </div>

              {event.clubs && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--accent)' }}>👥</span>
                  <span>{event.clubs.name}</span>
                </div>
              )}

              {event.categories && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    color: event.categories.color || 'var(--primary)',
                    backgroundColor: `${event.categories.color || 'var(--primary)'}20`,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}>
                    {event.categories.name}
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Event Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', position: 'relative', marginTop: '3rem' }}>
          {/* Main Content */}
          <div>
            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '2rem'
              }}
            >
              <button
                className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
                onClick={() => setActiveTab('about')}
                style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: activeTab === 'about' ? 'var(--dark-surface)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'about' ? '2px solid var(--primary)' : 'none',
                  color: activeTab === 'about' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'about' ? '600' : '400'
                }}
              >
                About
              </button>
              <button
                className={`tab-button ${activeTab === 'schedule' ? 'active' : ''}`}
                onClick={() => setActiveTab('schedule')}
                style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: activeTab === 'schedule' ? 'var(--dark-surface)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'schedule' ? '2px solid var(--primary)' : 'none',
                  color: activeTab === 'schedule' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'schedule' ? '600' : '400'
                }}
              >
                Schedule
              </button>
              <button
                className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}
                style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: activeTab === 'register' ? 'var(--dark-surface)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'register' ? '2px solid var(--primary)' : 'none',
                  color: activeTab === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'register' ? '600' : '400'
                }}
              >
                Register
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'about' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="about-tab"
              >
                <h2>About the Event</h2>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '2rem' }}>
                  {event.description}
                </p>

                {event.additional_info && event.additional_info.long_description && (
                  <p style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '2rem' }}>
                    {event.additional_info.long_description}
                  </p>
                )}

                {event.clubs && event.clubs.description && (
                  <div style={{ marginTop: '3rem', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>About the Organizer</h3>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.7' }}>
                      {event.clubs.description}
                    </p>
                  </div>
                )}

                {/* Event Tags Section */}
                <div style={{ marginTop: '3rem', marginBottom: '2rem' }}>
                  <h3 style={{ marginBottom: '1.5rem' }}>Tags</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem' }}>
                    {/* Show category as a tag */}
                    {event.categories && (
                      <span style={{
                        backgroundColor: 'var(--dark-surface)',
                        borderLeft: `4px solid ${event.categories.color || 'var(--primary)'}`,
                        color: 'var(--text-primary)',
                        padding: '0.7rem 1.2rem',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}>
                        {event.categories.name}
                      </span>
                    )}

                    {/* Show actual tags from the event */}
                    {event.tags && event.tags.length > 0 ? (
                      event.tags.map((tag, index) => (
                        <span
                          key={index}
                          style={{
                            backgroundColor: 'var(--dark-surface)',
                            borderLeft: `4px solid ${tag.color || 'var(--primary)'}`,
                            color: 'var(--text-primary)',
                            padding: '0.7rem 1.2rem',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          {tag.name}
                        </span>
                      ))
                    ) : (
                      /* Show default tags if no tags are available */
                      <>
                        <span style={{
                          backgroundColor: 'var(--dark-surface)',
                          borderLeft: '4px solid var(--primary)',
                          color: 'var(--text-primary)',
                          padding: '0.7rem 1.2rem',
                          borderRadius: '4px',
                          fontSize: '1rem',
                          fontWeight: '500',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}>
                          {new Date(event.start_date).getFullYear()}
                        </span>
                        <span style={{
                          backgroundColor: 'var(--dark-surface)',
                          borderLeft: '4px solid var(--accent)',
                          color: 'var(--text-primary)',
                          padding: '0.7rem 1.2rem',
                          borderRadius: '4px',
                          fontSize: '1rem',
                          fontWeight: '500',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}>
                          {event.location}
                        </span>
                        {event.clubs && (
                          <span style={{
                            backgroundColor: 'var(--dark-surface)',
                            borderLeft: '4px solid var(--secondary)',
                            color: 'var(--text-primary)',
                            padding: '0.7rem 1.2rem',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                          }}>
                            {event.clubs.name}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {event.additional_info && event.additional_info.highlights && (
                  <>
                    <h3 style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>Event Highlights</h3>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {event.additional_info.highlights.map((highlight, index) => (
                        <li
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            backgroundColor: 'var(--dark-surface)',
                            borderRadius: '8px'
                          }}
                        >
                          <span style={{ fontSize: '1.5rem' }}>{highlight.icon || '✨'}</span>
                          <div>
                            <h4 style={{ margin: '0 0 0.5rem' }}>{highlight.title}</h4>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{highlight.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'schedule' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="schedule-tab"
              >
                <h2>Event Schedule</h2>
                <p style={{ marginBottom: '2rem' }}>
                  Here's the detailed schedule for the event. Please note that the schedule may be subject to minor changes.
                </p>

                {event.additional_info && event.additional_info.schedule ? (
                  event.additional_info.schedule.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      style={{
                        marginBottom: '2.5rem',
                        backgroundColor: 'var(--dark-surface)',
                        borderRadius: '10px',
                        overflow: 'hidden'
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          padding: '1rem 1.5rem',
                          backgroundColor: 'rgba(110, 68, 255, 0.1)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        {day.day}
                      </h3>

                      <div style={{ padding: '0.5rem' }}>
                        {day.events.map((eventItem, eventIndex) => (
                          <div
                            key={eventIndex}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 2fr 1fr',
                              padding: '1rem',
                              borderBottom: eventIndex < day.events.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                            }}
                          >
                            <div style={{ color: 'var(--primary)' }}>{eventItem.time}</div>
                            <div style={{ fontWeight: '500' }}>{eventItem.title}</div>
                            <div style={{ color: 'var(--text-secondary)' }}>{eventItem.location}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--dark-surface)', borderRadius: '8px' }}>
                    <p>No detailed schedule available for this event.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'register' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="register-tab"
              >
                <EventRegistration eventData={event} registrations={registrations} />
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: '2rem', marginTop: '3rem' }}>
            <div
              style={{
                backgroundColor: 'var(--dark-surface)',
                borderRadius: '10px',
                padding: '1.8rem',
                marginBottom: '2rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '1.8rem', fontSize: '1.4rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🎉</span> Event Details
              </h3>

              <div style={{ marginBottom: '1.2rem' }}>
                <h4 style={{ margin: '0 0 0.6rem', color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '0.5px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '0.5rem' }}>📅</span> DATE & TIME
                </h4>
                <p style={{ margin: 0, fontSize: '1.05rem' }}>
                  {formatEventDate(event.start_date, event.end_date)}<br />
                  {formatEventTime(event.start_date, event.end_date)}
                </p>
              </div>

              <div style={{ marginBottom: '1.2rem' }}>
                <h4 style={{ margin: '0 0 0.6rem', color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '0.5px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '0.5rem' }}>📍</span> LOCATION
                </h4>
                <p style={{ margin: 0, fontSize: '1.05rem' }}>{event.location}</p>
              </div>

              {event.clubs && (
                <div style={{ marginBottom: '1.2rem' }}>
                  <h4 style={{ margin: '0 0 0.6rem', color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '0.5px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '0.5rem' }}>👥</span> ORGANIZER
                  </h4>
                  <p style={{ margin: 0, fontSize: '1.05rem' }}>{event.clubs.name}</p>
                </div>
              )}

              {event.categories && (
                <div style={{ marginBottom: '1.2rem' }}>
                  <h4 style={{ margin: '0 0 0.6rem', color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '0.5px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '0.5rem' }}>🏷️</span> CATEGORY
                  </h4>
                  <p style={{ margin: 0, fontSize: '1.05rem' }}>{event.categories.name}</p>
                </div>
              )}

              {event.registration_fee && (
                <div style={{ marginBottom: '1.2rem' }}>
                  <h4 style={{ margin: '0 0 0.6rem', color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '0.5px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '0.5rem' }}>💰</span> REGISTRATION FEE
                  </h4>
                  <p style={{ margin: 0, fontSize: '1.05rem' }}>{event.registration_fee || 'Free'}</p>
                </div>
              )}

              <div style={{ marginBottom: '1.8rem' }}>
                <h4 style={{ margin: '0 0 0.6rem', color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '0.5px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '0.5rem' }}>⏰</span> REGISTRATION DEADLINE
                </h4>
                <p style={{ margin: 0, fontSize: '1.05rem' }}>{formatEventDate(event.registration_deadline, event.registration_deadline)}</p>
              </div>

              {event.max_participants > 0 && (
                <div style={{ marginBottom: '1.8rem' }}>
                  <div
                    style={{
                      width: '100%',
                      height: '10px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      marginBottom: '0.8rem'
                    }}
                  >
                    <div
                      style={{
                        width: `${(registrations.length / event.max_participants) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--primary), var(--secondary))'
                      }}
                    ></div>
                  </div>
                  <p style={{ fontSize: '1rem', color: 'white', textAlign: 'center', margin: 0, fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ marginRight: '0.5rem' }}>👥</span> {registrations.length} / {event.max_participants} spots filled
                  </p>
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.9rem', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                onClick={() => setActiveTab('register')}
              >
                <span>📝</span> Register Now
              </button>
            </div>

            <div
              style={{
                backgroundColor: 'var(--dark-surface)',
                borderRadius: '10px',
                padding: '1.8rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.4rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🔗</span> Share Event
              </h3>

              <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', position: 'relative' }}>
                {/* Facebook */}
                <button
                  style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(59, 89, 152, 0.2)',
                    border: 'none',
                    color: '#4267B2',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                  }}
                  onClick={shareOnFacebook}
                  title="Share on Facebook"
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 89, 152, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 89, 152, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </button>

                {/* Twitter/X */}
                <button
                  style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(29, 161, 242, 0.2)',
                    border: 'none',
                    color: '#1DA1F2',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                  }}
                  onClick={shareOnTwitter}
                  title="Share on Twitter/X"
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(29, 161, 242, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(29, 161, 242, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </button>

                {/* LinkedIn */}
                <button
                  style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 119, 181, 0.2)',
                    border: 'none',
                    color: '#0077B5',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                  }}
                  onClick={shareOnLinkedIn}
                  title="Share on LinkedIn"
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 119, 181, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 119, 181, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                  </svg>
                </button>

                {/* WhatsApp */}
                <button
                  style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(37, 211, 102, 0.2)',
                    border: 'none',
                    color: '#25D366',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                  }}
                  onClick={shareOnWhatsApp}
                  title="Share on WhatsApp"
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(37, 211, 102, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(37, 211, 102, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </button>

                {/* Copy Link */}
                <button
                  style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(110, 68, 255, 0.2)',
                    border: 'none',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                  }}
                  onClick={copyToClipboard}
                  title="Copy Link"
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(110, 68, 255, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(110, 68, 255, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.188 8.719c.439-.439.926-.801 1.444-1.087 2.887-1.591 6.589-.745 8.445 2.069l-2.246 2.245c-.644-1.469-2.243-2.305-3.834-1.949-.599.134-1.168.433-1.633.898l-4.304 4.306c-1.307 1.307-1.307 3.433 0 4.74 1.307 1.307 3.433 1.307 4.74 0l1.327-1.327c1.207.479 2.501.67 3.779.575l-2.929 2.929c-2.511 2.511-6.582 2.511-9.093 0s-2.511-6.582 0-9.093l4.304-4.306zm6.836-6.836l-2.929 2.929c1.277-.096 2.572.096 3.779.574l1.326-1.326c1.307-1.307 3.433-1.307 4.74 0 1.307 1.307 1.307 3.433 0 4.74l-4.305 4.305c-1.311 1.311-3.44 1.3-4.74 0-.303-.303-.564-.68-.727-1.051l-2.246 2.245c.236.358.481.667.796.982.812.812 1.846 1.417 3.036 1.704 1.542.371 3.194.166 4.613-.617.518-.286 1.005-.648 1.444-1.087l4.304-4.305c2.512-2.511 2.512-6.582.001-9.093-2.511-2.51-6.581-2.51-9.092 0z" />
                  </svg>
                </button>

                {/* Tooltip for copy link */}
                {showShareTooltip && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--dark-surface)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                    zIndex: 10,
                    whiteSpace: 'nowrap'
                  }}>
                    Link copied to clipboard!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventDetails;
