import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import EventRegistration from './EventRegistration';
import eventService from '../services/eventService';
import registrationService from '../services/registrationService';
import './MobileTabs.css';
import './EventDetails.css';

const EventDetails = ({ setCurrentPage, eventId }) => {
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [activeMobileTab, setActiveMobileTab] = useState('about');
  const [isMobileView, setIsMobileView] = useState(false);

  // Set initial mobile view state after component mounts to avoid hydration issues
  useEffect(() => {
    setIsMobileView(window.innerWidth <= 992);
  }, []);

  // Handle window resize to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 992);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [shareUrl, setShareUrl] = useState('');
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  // Fetch event data from Supabase
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);

        // Fetch event details
        const eventData = await eventService.getEventById(eventId);
        console.log('Fetched event data:', eventData);
        console.log('Participation type:', eventData?.participation_type);
        console.log('Min participants:', eventData?.min_participants);
        console.log('Max participants:', eventData?.max_participants);
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

  // Format date for display
  const formatDate = (date) => {
    try {
      return format(new Date(date), 'MMMM d, yyyy');
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Date not available';
    }
  };

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

  const shareOnInstagram = () => {
    // For Instagram Stories, we need to use the Instagram app's URL scheme
    // Since direct sharing to Instagram Stories via URL is limited, we'll create a shareable image
    // and prompt the user to share it on Instagram

    // First, copy the URL to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      // Create a message to guide the user
      const message = `Event URL copied to clipboard!\n\nTo share on Instagram Stories:\n1. Open Instagram app\n2. Create a new Story\n3. Paste the URL as a sticker\n4. Add the event banner image from your gallery`;

      // Alert the user with instructions
      alert(message);

      // Try to open Instagram app if on mobile
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      if (/android/i.test(userAgent)) {
        // For Android
        window.location.href = 'intent://instagram.com/_n/mainfeed/#Intent;package=com.instagram.android;scheme=https;end';
      } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        // For iOS
        window.location.href = 'instagram://';
      } else {
        // For desktop, open Instagram website
        window.open('https://www.instagram.com', '_blank');
      }
    }).catch(err => {
      console.error('Failed to copy URL for Instagram sharing: ', err);
      alert('Failed to copy URL. Please try again.');
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShowShareTooltip(true);
      setTimeout(() => setShowShareTooltip(false), 2000);
    }).catch(err => {
      console.error('Failed to copy URL: ', err);
    });
  };

  // Debug event data
  useEffect(() => {
    if (event) {
      console.log('Event data loaded:', event);
      console.log('Mobile view:', isMobileView);
    }
  }, [event, isMobileView]);

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
              onClick={() => setCurrentPage('events-page')}
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
            onClick={() => setCurrentPage('events-page')}
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>←</span> Back to Events
          </button>
        </div>

        {/* Event Header */}
        <div
          className="event-banner"
          style={{
            position: 'relative',
            height: isMobileView ? '300px' : '400px',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '2rem',
            width: '100%'
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
              filter: 'brightness(1)',
              boxShadow: 'none'
            }}
          ></div>

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              padding: isMobileView ? '1.5rem' : '2rem',
              background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 85%, transparent 100%)'
            }}
          >
            <motion.h1
              className="event-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                marginBottom: '0.5rem',
                fontSize: isMobileView ? '1.8rem' : '2.5rem',
                textShadow: '0 2px 5px rgba(0,0,0,0.7)',
                fontWeight: '700'
              }}
            >
              {event.title}
            </motion.h1>

            <motion.div
              className="event-meta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{
                display: 'flex',
                gap: isMobileView ? '1rem' : '2rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                fontSize: isMobileView ? '0.9rem' : '1rem',
                textShadow: '0 1px 3px rgba(0,0,0,0.7)'
              }}
            >
              <div className="event-meta-item">
                <span style={{ color: 'var(--accent)' }}>📅</span>
                <span>{formatEventDate(event.start_date, event.end_date)}</span>
              </div>

              <div className="event-meta-item">
                <span style={{ color: 'var(--accent)' }}>📍</span>
                <span>{event.location}</span>
              </div>

              {event.clubs && (
                <div className="event-meta-item">
                  <span style={{ color: 'var(--accent)' }}>👥</span>
                  <span>{event.clubs.name}</span>
                </div>
              )}

              {event.categories && (
                <div className="event-meta-item">
                  <span className="event-category-tag" style={{
                    color: event.categories.color || 'var(--primary)',
                    backgroundColor: `${event.categories.color || 'var(--primary)'}20`,
                  }}>
                    {event.categories.name}
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Mobile Tabs - Only visible on mobile */}
        {isMobileView && event && (
          <div className="mobile-tabs">
            <button
              className={`mobile-tab ${activeMobileTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveMobileTab('about')}
            >
              About
            </button>
            <button
              className={`mobile-tab ${activeMobileTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveMobileTab('schedule')}
            >
              Schedule
            </button>
            <button
              className={`mobile-tab ${activeMobileTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveMobileTab('register')}
            >
              Register
            </button>
            <button
              className={`mobile-tab ${activeMobileTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveMobileTab('details')}
            >
              Details
            </button>
          </div>
        )}

        {/* Mobile Tab Content - Only visible on mobile */}
        {isMobileView && event && (
          <div className="mobile-tab-contents" style={{ marginBottom: '2rem' }}>
            {/* About Tab Content */}
            <div className={`mobile-tab-content ${activeMobileTab === 'about' ? 'active' : ''}`}>
              <div className="tab-content-about">
                <h3 style={{ fontSize: '1.8rem', marginBottom: '1.2rem', color: 'var(--primary)' }}>About This Event</h3>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>{event.description}</p>
                {event.long_description && (
                  <div style={{ marginTop: '1.5rem', backgroundColor: 'rgba(var(--primary-rgb), 0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(var(--primary-rgb), 0.1)' }}>
                    <p style={{ whiteSpace: 'pre-line', fontSize: '1.05rem', lineHeight: '1.7' }}>{event.long_description}</p>
                  </div>
                )}

                {/* Event Highlights Section */}
                {event.highlights && event.highlights.length > 0 && (
                  <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ fontSize: '1.6rem', marginBottom: '1.2rem', color: 'var(--primary)' }}>Event Highlights</h3>
                    <ul className="event-highlights-grid" style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {event.highlights.map((highlight, index) => (
                        <li
                          key={index}
                          style={{
                            backgroundColor: 'var(--dark-surface)',
                            padding: '1rem',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.8rem',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <span style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>✨</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Club Information Section */}
                {event.clubs && event.clubs.description && (
                  <div style={{ marginTop: '2.5rem', marginBottom: '1.5rem', backgroundColor: 'var(--dark-surface)', padding: '1.5rem', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' }}>
                    <h3 style={{ marginBottom: '1.2rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>👥</span> About the Organizer
                    </h3>

                    {event.clubs.logo_url && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.2rem' }}>
                        <img
                          src={event.clubs.logo_url}
                          alt={event.clubs.name}
                          style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }}
                        />
                      </div>
                    )}

                    <h4 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.3rem' }}>{event.clubs.name}</h4>

                    <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                      {event.clubs.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule Tab Content */}
            <div className={`mobile-tab-content ${activeMobileTab === 'schedule' ? 'active' : ''}`}>
              <div className="tab-content-schedule">
                <h3 style={{ fontSize: '1.8rem', marginBottom: '1.2rem', color: 'var(--primary)' }}>Event Schedule</h3>
                <p style={{ marginBottom: '1.5rem' }}>Here's the detailed schedule for this event. Please note that times may be subject to minor changes.</p>
                {event.additional_info && event.additional_info.schedule ? (
                  <div>
                    {event.additional_info.schedule.map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        style={{
                          marginBottom: '2rem',
                          backgroundColor: 'var(--dark-surface)',
                          borderRadius: '10px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                            padding: '1rem 1.5rem',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}
                        >
                          <h4 style={{ margin: 0, color: 'var(--primary)' }}>{day.day}</h4>
                        </div>

                        <div>
                          {day.events.map((eventItem, eventIndex) => (
                            <div
                              key={eventIndex}
                              className="event-schedule-item"
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 2fr 1fr',
                                padding: '1rem',
                                borderBottom: eventIndex < day.events.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                              }}
                            >
                              <div style={{ color: 'var(--accent)' }}>{eventItem.time}</div>
                              <div style={{ fontWeight: '500' }}>{eventItem.title}</div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{eventItem.location}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--dark-surface)', borderRadius: '8px', marginTop: '1rem' }}>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>No detailed schedule available for this event yet.</p>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Please check back later for updates.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Register Tab Content */}
            <div className={`mobile-tab-content ${activeMobileTab === 'register' ? 'active' : ''}`}>
              <div className="tab-content-register">
                <EventRegistration eventData={event} registrations={registrations} />
              </div>
            </div>

            {/* Details Tab Content */}
            <div className={`mobile-tab-content ${activeMobileTab === 'details' ? 'active' : ''}`}>
              <div className="tab-content-details">
                <h3>Event Details</h3>
                <div style={{ backgroundColor: 'var(--dark-surface)', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ marginBottom: '1.2rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>DATE & TIME</h4>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--accent)' }}>📅</span>
                      <span>{formatEventDate(event.start_date, event.end_date)}</span>
                    </p>
                  </div>

                  <div style={{ marginBottom: '1.2rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>LOCATION</h4>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--accent)' }}>📍</span>
                      <span>{event.location}</span>
                    </p>
                  </div>

                  {event.participation_type && (
                    <div style={{ marginBottom: '1.2rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>PARTICIPATION</h4>
                      <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--accent)' }}>{event.participation_type === 'team' ? '👥' : '👤'}</span>
                        <span>{event.participation_type === 'team' ? 'Team Event' : 'Individual Event'}</span>
                      </p>
                      {event.participation_type === 'team' && (
                        <p style={{ margin: '0.5rem 0 0 1.8rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          Team size: {event.min_participants || 2} to {event.max_participants || 'unlimited'} members
                        </p>
                      )}
                    </div>
                  )}

                  {event.registration_deadline && (
                    <div style={{ marginBottom: '1.2rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>REGISTRATION DEADLINE</h4>
                      <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--accent)' }}>⏰</span>
                        <span>{format(new Date(event.registration_deadline), 'MMMM d, yyyy')}</span>
                      </p>
                    </div>
                  )}

                  {event.fee && (
                    <div style={{ marginBottom: '1.2rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ENTRY FEE</h4>
                      <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--accent)' }}>💰</span>
                        <span>{event.fee === 0 ? 'Free Entry' : `₹${event.fee}`}</span>
                      </p>
                    </div>
                  )}

                  {event.prizes && (
                    <div style={{ marginBottom: '1.2rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>PRIZES</h4>
                      <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--accent)' }}>🏆</span>
                        <span>{event.prizes}</span>
                      </p>
                    </div>
                  )}

                  {event.contact_info && (
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>CONTACT</h4>
                      <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--accent)' }}>📞</span>
                        <span>{event.contact_info}</span>
                      </p>
                    </div>
                  )}
                </div>

                <h3 style={{ fontSize: '1.6rem', marginBottom: '1rem', color: 'var(--primary)', textAlign: 'center' }}>Share This Event</h3>
                <div className="social-share-buttons" style={{ marginBottom: '2rem' }}>
                  <button
                    className="social-share-button"
                    style={{
                      backgroundColor: 'rgba(59, 89, 152, 0.2)',
                      color: '#4267B2'
                    }}
                    onClick={shareOnFacebook}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                    </svg>
                  </button>

                  <button
                    className="social-share-button"
                    style={{
                      backgroundColor: 'rgba(29, 161, 242, 0.2)',
                      color: '#1DA1F2'
                    }}
                    onClick={shareOnTwitter}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </button>

                  <button
                    className="social-share-button"
                    style={{
                      backgroundColor: 'rgba(0, 119, 181, 0.2)',
                      color: '#0077B5'
                    }}
                    onClick={shareOnLinkedIn}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                    </svg>
                  </button>

                  <button
                    className="social-share-button"
                    style={{
                      backgroundColor: 'rgba(37, 211, 102, 0.2)',
                      color: '#25D366'
                    }}
                    onClick={shareOnWhatsApp}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                  </button>

                  <button
                    className="social-share-button"
                    style={{
                      background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                      color: 'white'
                    }}
                    onClick={shareOnInstagram}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </button>

                  <button
                    className="social-share-button"
                    style={{
                      backgroundColor: 'rgba(110, 68, 255, 0.2)',
                      color: 'var(--primary)'
                    }}
                    onClick={copyToClipboard}
                    onMouseLeave={() => setTimeout(() => setShowShareTooltip(false), 1500)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6.188 8.719c.439-.439.926-.801 1.444-1.087 2.887-1.591 6.589-.745 8.445 2.069l-2.246 2.245c-.644-1.469-2.243-2.305-3.834-1.949-.599.134-1.168.433-1.633.898l-4.304 4.306c-1.307 1.307-1.307 3.433 0 4.74 1.307 1.307 3.433 1.307 4.74 0l1.327-1.327c1.207.479 2.501.67 3.779.575l-2.929 2.929c-2.511 2.511-6.582 2.511-9.093 0s-2.511-6.582 0-9.093l4.304-4.306zm6.836-6.836l-2.929 2.929c1.277-.096 2.572.096 3.779.574l1.326-1.326c1.307-1.307 3.433-1.307 4.74 0 1.307 1.307 1.307 3.433 0 4.74l-4.305 4.305c-1.311 1.311-3.44 1.3-4.74 0-.303-.303-.564-.68-.727-1.051l-2.246 2.245c.236.358.481.667.796.982.812.812 1.846 1.417 3.036 1.704 1.542.371 3.194.166 4.613-.617.518-.286 1.005-.648 1.444-1.087l4.304-4.305c2.512-2.511 2.512-6.582.001-9.093-2.511-2.51-6.581-2.51-9.092 0z" />
                    </svg>
                    {showShareTooltip && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-40px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap'
                      }}>
                        Link copied to clipboard!
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Event Content - Hidden on mobile when tabs are active */}
        {event && (
          <div className={`event-content-grid ${isMobileView ? 'tabs-active' : ''}`} style={{ display: isMobileView ? 'none' : 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', position: 'relative', marginTop: '3rem' }}>
          {/* Main Content */}
          <div>
            {/* Tabs */}
            <div
              className="event-tabs"
              style={{
                display: 'flex',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '2rem'
              }}
            >
              <button
                className={`event-tab tab-button ${activeTab === 'about' ? 'active' : ''}`}
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
                className={`event-tab tab-button ${activeTab === 'schedule' ? 'active' : ''}`}
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
                className={`event-tab tab-button ${activeTab === 'register' ? 'active' : ''}`}
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
                <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--primary)', fontWeight: '600' }}>About the Event</h2>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '2rem', color: 'var(--text-primary)' }}>
                  {event.description}
                </p>

                {event.additional_info && event.additional_info.long_description && (
                  <div style={{ marginBottom: '2rem', backgroundColor: 'rgba(var(--primary-rgb), 0.05)', padding: '1.8rem', borderRadius: '10px', border: '1px solid rgba(var(--primary-rgb), 0.1)' }}>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-line' }}>
                      {event.additional_info.long_description}
                    </p>
                  </div>
                )}

                {event.clubs && event.clubs.description && (
                  <div style={{ marginTop: '3rem', marginBottom: '2rem', backgroundColor: 'var(--dark-surface)', padding: '1.8rem', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>👥</span> About the Organizer
                    </h3>

                    {event.clubs.logo_url && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <img
                          src={event.clubs.logo_url}
                          alt={event.clubs.name}
                          style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }}
                        />
                      </div>
                    )}

                    <h4 style={{ textAlign: 'center', marginBottom: '1.2rem', fontSize: '1.4rem' }}>{event.clubs.name}</h4>

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
                    <ul className="event-highlights-grid" style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
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
                <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--primary)', fontWeight: '600' }}>Event Schedule</h2>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '2rem', color: 'var(--text-primary)' }}>
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
                            className="event-schedule-item"
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
                  <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--dark-surface)', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' }}>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>No detailed schedule available for this event yet.</p>
                    <p style={{ marginTop: '0.8rem', fontSize: '0.95rem' }}>Please check back later for updates.</p>
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
          <div className="event-details-sidebar" style={{ position: 'sticky', top: '2rem', marginTop: '3rem' }}>
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

              <div style={{ marginBottom: '1.2rem' }}>
                <h4 style={{ margin: '0 0 0.6rem', color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '0.5px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '0.5rem' }}>👥</span> PARTICIPATION TYPE
                </h4>
                <p style={{ margin: 0, fontSize: '1.05rem' }}>
                  {event.participation_type === 'individual' ? 'Solo Event (Individual)' :
                   event.participation_type === 'team' ? 'Team Event' : 'Both (Solo & Team)'}
                </p>
                {event.participation_type !== 'individual' && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Team size: {event.min_participants || 2} to {event.max_participants || 'unlimited'} members
                  </p>
                )}
              </div>

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

              <div style={{ marginBottom: '1.8rem' }}>
                <h4 style={{ margin: '0 0 0.6rem', color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '0.5px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '0.5rem' }}>📊</span> REGISTRATIONS
                </h4>
                <p style={{ fontSize: '1rem', color: 'white', margin: 0, fontWeight: '500', display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '0.5rem' }}>👥</span> {registrations.length} {event.participation_type === 'individual' ? 'participants' : 'teams'} registered
                </p>
              </div>

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

              <div className="social-share-buttons">
                {/* Facebook */}
                <button
                  className="social-share-button"
                  style={{
                    backgroundColor: 'rgba(59, 89, 152, 0.2)',
                    color: '#4267B2'
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
                  className="social-share-button"
                  style={{
                    backgroundColor: 'rgba(29, 161, 242, 0.2)',
                    color: '#1DA1F2'
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
                  className="social-share-button"
                  style={{
                    backgroundColor: 'rgba(0, 119, 181, 0.2)',
                    color: '#0077B5'
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
                  className="social-share-button"
                  style={{
                    backgroundColor: 'rgba(37, 211, 102, 0.2)',
                    color: '#25D366'
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

                {/* Instagram */}
                <button
                  className="social-share-button"
                  style={{
                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                    color: 'white'
                  }}
                  onClick={shareOnInstagram}
                  title="Share on Instagram"
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </button>

                {/* Copy Link */}
                <button
                  className="social-share-button"
                  style={{
                    backgroundColor: 'rgba(110, 68, 255, 0.2)',
                    color: 'var(--primary)'
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
        )}
      </div>
    </section>
  );
};

export default EventDetails;
