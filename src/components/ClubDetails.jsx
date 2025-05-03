import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import clubService from '../services/clubService';
import eventService from '../services/eventService';
import { navigateTo } from '../utils/navigation';
import ClubGallery from './ClubGallery';
import './MobileTabs.css';

const ClubDetails = ({ setCurrentPage, clubId, setSelectedEventId = () => {} }) => {
  const [club, setClub] = useState(null);
  const [clubEvents, setClubEvents] = useState([]);
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

  // Fetch club data from Supabase
  useEffect(() => {
    const fetchClubData = async () => {
      try {
        setLoading(true);

        // Fetch club details
        const clubData = await clubService.getClubById(clubId);
        setClub(clubData);

        // Fetch club events
        const eventsData = await eventService.getClubEvents(clubId);
        setClubEvents(eventsData);

        setError(null);
      } catch (err) {
        console.error('Error fetching club details:', err);
        setError('Failed to load club details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (clubId) {
      fetchClubData();
    }
  }, [clubId]);

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

  // If loading, show loading state
  if (loading) {
    return (
      <section className="section" id="club-details">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <p>Loading club details...</p>
          </div>
        </div>
      </section>
    );
  }

  // If error, show error state
  if (error || !club) {
    return (
      <section className="section" id="club-details">
        <div className="container">
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              onClick={() => setCurrentPage('clubs-page')}
              className="btn"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>←</span> Back to Clubs
            </button>
          </div>
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--error)' }}>
            <p>{error || 'Club not found'}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section" id="club-details">
      <div className="container">
        {/* Back Button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => setCurrentPage('clubs-page')}
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>←</span> Back to Clubs
          </button>
        </div>

        {/* Club Header */}
        <div
          className="club-header"
          style={{
            position: 'relative',
            height: '300px',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '2rem',
            backgroundColor: 'var(--dark-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}
        >
          <div
            className="club-logo"
            style={{
              marginBottom: '1.5rem'
            }}
          >
            {club.logo_url ? (
              <img
                src={club.logo_url}
                alt={club.name}
                style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }}
              />
            ) : (
              <div style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '5rem',
                border: '3px solid var(--primary)'
              }}>
                🏫
              </div>
            )}
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ marginBottom: '0.5rem', textAlign: 'center' }}
          >
            {club.name}
          </motion.h1>

          {club.type && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{
                display: 'inline-block',
                padding: '0.3rem 0.8rem',
                backgroundColor: 'rgba(var(--primary-rgb), 0.2)',
                borderRadius: '4px',
                color: 'var(--primary)',
                fontSize: '0.9rem',
                fontWeight: '500',
                marginTop: '0.5rem'
              }}
            >
              {club.type}
            </motion.div>
          )}
        </div>

        {/* Mobile Tabs - Only visible on mobile */}
        {isMobileView && club && (
          <div className="mobile-tabs">
            <button
              className={`mobile-tab ${activeMobileTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveMobileTab('about')}
            >
              About
            </button>
            <button
              className={`mobile-tab ${activeMobileTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveMobileTab('events')}
            >
              Events
            </button>
            {club.team_members && club.team_members.length > 0 && (
              <button
                className={`mobile-tab ${activeMobileTab === 'team' ? 'active' : ''}`}
                onClick={() => setActiveMobileTab('team')}
              >
                Team
              </button>
            )}
            <button
              className={`mobile-tab ${activeMobileTab === 'gallery' ? 'active' : ''}`}
              onClick={() => setActiveMobileTab('gallery')}
            >
              Gallery
            </button>
            <button
              className={`mobile-tab ${activeMobileTab === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveMobileTab('contact')}
            >
              Contact
            </button>
          </div>
        )}

        {/* Mobile Tab Content - Only visible on mobile */}
        {isMobileView && club && (
          <div className="mobile-tab-contents">
            {/* About Tab Content */}
            <div className={`mobile-tab-content ${activeMobileTab === 'about' ? 'active' : ''}`}>
              <div className="tab-content-about">
                <h3>About the Club</h3>
                <div style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '2rem' }}>
                  {club.description}
                  {club.additional_info && club.additional_info.full_description && (
                    <div style={{ marginTop: '1rem', whiteSpace: 'pre-line' }}>
                      {club.additional_info.full_description}
                    </div>
                  )}
                </div>

                {club.additional_info && club.additional_info.achievements && (
                  <>
                    <h3 style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>Achievements</h3>
                    <ul style={{ paddingLeft: '1.5rem' }}>
                      {club.additional_info.achievements.map((achievement, index) => (
                        <li key={index} style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>

            {/* Events Tab Content */}
            <div className={`mobile-tab-content ${activeMobileTab === 'events' ? 'active' : ''}`}>
              <div className="tab-content-events">
                <h3>Club Events</h3>
                <p style={{ marginBottom: '2rem' }}>
                  Here are the events organized by {club.name}. Join us to experience exciting activities and showcase your talents!
                </p>

                {clubEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--dark-surface)', borderRadius: '8px' }}>
                    <p>No events found for this club.</p>
                  </div>
                ) : (
                  <div className="club-events-grid" style={{ display: 'grid', gap: '1.5rem' }}>
                    {clubEvents.map((event) => (
                      <div
                        key={event.id}
                        style={{
                          backgroundColor: 'var(--dark-surface)',
                          borderRadius: '10px',
                          padding: '1.5rem',
                          transition: 'transform 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        onClick={(e) => {
                          // Set the selected event ID
                          setSelectedEventId(event.id);

                          // Navigate to the event details page directly
                          setCurrentPage('event-details');

                          // Update the URL for shareable links
                          window.history.pushState({}, '', `/event/${event.id}`);
                        }}
                      >
                        <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{event.title}</h3>
                        <p style={{ margin: '0 0 1rem', color: 'var(--accent)' }}>
                          {formatEventDate(event.start_date, event.end_date)}
                        </p>
                        <p style={{ margin: '0 0 1rem' }}>{event.description}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                          {event.categories && (
                            <div style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.5rem',
                              backgroundColor: `${event.categories.color || 'var(--primary)'}20`,
                              borderRadius: '4px',
                              color: event.categories.color || 'var(--primary)',
                              fontSize: '0.8rem'
                            }}>
                              {event.categories.name}
                            </div>
                          )}
                          <button
                            className="btn"
                            style={{
                              padding: '0.5rem 1rem',
                              fontSize: '0.9rem',
                              backgroundColor: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent the parent div's onClick from firing

                              // First set the selected event ID
                              setSelectedEventId(event.id);

                              // Then navigate to the event details page
                              // We need to make sure setCurrentPage is called directly
                              setCurrentPage('event-details');

                              // Update the URL for shareable links
                              window.history.pushState({}, '', `/event/${event.id}`);
                            }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Team Tab Content */}
            {club.team_members && (
              <div className={`mobile-tab-content ${activeMobileTab === 'team' ? 'active' : ''}`}>
                <div className="tab-content-team">
                  <h3>Our Team</h3>
                  <p style={{ marginBottom: '2rem' }}>
                    Meet the dedicated team behind {club.name}. These individuals work tirelessly to organize events, workshops, and activities for the club.
                  </p>

                  <div className="team-members-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
                    {club.team_members.map((member, index) => (
                      <div
                        key={index}
                        style={{
                          textAlign: 'center'
                        }}
                      >
                        <div
                          style={{
                            width: '150px',
                            height: '150px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            margin: '0 auto 1rem',
                            border: '3px solid var(--primary)'
                          }}
                        >
                          <img
                            src={member.image || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                            alt={member.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem' }}>{member.name}</h3>
                        <p style={{ margin: 0, color: 'var(--accent)' }}>{member.position}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Gallery Tab Content */}
            <div className={`mobile-tab-content ${activeMobileTab === 'gallery' ? 'active' : ''}`}>
              <div className="tab-content-gallery">
                <h3>Gallery</h3>
                <p style={{ marginBottom: '2rem' }}>
                  Take a look at some moments from our past events and activities.
                </p>

                <ClubGallery gallery={club.gallery || []} />
              </div>
            </div>

            {/* Contact Tab Content */}
            <div className={`mobile-tab-content ${activeMobileTab === 'contact' ? 'active' : ''}`}>
              <div className="tab-content-contact">
                <h3>Contact Information</h3>
                <div style={{ backgroundColor: 'var(--dark-surface)', borderRadius: '10px', padding: '1.5rem' }}>
                  <div style={{ marginBottom: '1.2rem' }}>
                    <h4 style={{
                      margin: '0 0 0.5rem',
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{
                        backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem'
                      }}>✉️</span>
                      EMAIL
                    </h4>
                    <p style={{ margin: 0, fontSize: '1rem' }}>{club.contact_email || club.email}</p>
                  </div>

                  {club.contact_phone && (
                    <div style={{ marginBottom: '1.2rem' }}>
                      <h4 style={{
                        margin: '0 0 0.5rem',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{
                          backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem'
                        }}>📞</span>
                        PHONE
                      </h4>
                      <p style={{ margin: 0, fontSize: '1rem' }}>{club.contact_phone}</p>
                    </div>
                  )}

                  {club.website && (
                    <div style={{ marginBottom: '1.2rem' }}>
                      <h4 style={{
                        margin: '0 0 0.5rem',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{
                          backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem'
                        }}>🌐</span>
                        WEBSITE
                      </h4>
                      <a
                        href={club.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--primary)', textDecoration: 'none' }}
                      >
                        {club.website}
                      </a>
                    </div>
                  )}

                  {club.social_links && Object.keys(club.social_links).length > 0 && (
                    <div>
                      <h4 style={{
                        margin: '0 0 0.8rem',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{
                          backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem'
                        }}>🔗</span>
                        SOCIAL MEDIA
                      </h4>
                      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {club.social_links.instagram && (
                          <a
                            href={club.social_links.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Instagram"
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-primary)',
                              textDecoration: 'none',
                              transition: 'all 0.2s ease',
                              border: '1px solid transparent'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.border = '1px solid var(--primary)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.border = '1px solid transparent';
                            }}
                            onTouchStart={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.border = '1px solid var(--primary)';
                            }}
                            onTouchEnd={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.border = '1px solid transparent';
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </a>
                        )}
                        {club.social_links.facebook && (
                          <a
                            href={club.social_links.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Facebook"
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-primary)',
                              textDecoration: 'none',
                              transition: 'all 0.2s ease',
                              border: '1px solid transparent'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.border = '1px solid var(--primary)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.border = '1px solid transparent';
                            }}
                            onTouchStart={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.border = '1px solid var(--primary)';
                            }}
                            onTouchEnd={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.border = '1px solid transparent';
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                            </svg>
                          </a>
                        )}
                        {club.social_links.linkedin && (
                          <a
                            href={club.social_links.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="LinkedIn"
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-primary)',
                              textDecoration: 'none',
                              transition: 'all 0.2s ease',
                              border: '1px solid transparent'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.border = '1px solid var(--primary)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.border = '1px solid transparent';
                            }}
                            onTouchStart={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.border = '1px solid var(--primary)';
                            }}
                            onTouchEnd={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.border = '1px solid transparent';
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
                            </svg>
                          </a>
                        )}
                        {club.social_links.twitter && (
                          <a
                            href={club.social_links.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Twitter"
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-primary)',
                              textDecoration: 'none',
                              transition: 'all 0.2s ease',
                              border: '1px solid transparent'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.border = '1px solid var(--primary)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.border = '1px solid transparent';
                            }}
                            onTouchStart={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.border = '1px solid var(--primary)';
                            }}
                            onTouchEnd={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.border = '1px solid transparent';
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                            </svg>
                          </a>
                        )}
                        {club.social_links.youtube && (
                          <a
                            href={club.social_links.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="YouTube"
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-primary)',
                              textDecoration: 'none',
                              transition: 'all 0.2s ease',
                              border: '1px solid transparent'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.border = '1px solid var(--primary)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.border = '1px solid transparent';
                            }}
                            onTouchStart={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.border = '1px solid var(--primary)';
                            }}
                            onTouchEnd={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.border = '1px solid transparent';
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Club Content - Hidden on mobile when tabs are active */}
        {club && (
          <div className={`club-content-grid ${isMobileView ? 'tabs-active' : ''}`} style={{ display: isMobileView ? 'none' : 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
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
                className={`event-tab tab-button ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => setActiveTab('events')}
                style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: activeTab === 'events' ? 'var(--dark-surface)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'events' ? '2px solid var(--primary)' : 'none',
                  color: activeTab === 'events' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'events' ? '600' : '400'
                }}
              >
                Events
              </button>
              {club.team_members && club.team_members.length > 0 && (
                <button
                  className={`event-tab tab-button ${activeTab === 'team' ? 'active' : ''}`}
                  onClick={() => setActiveTab('team')}
                  style={{
                    padding: '1rem 1.5rem',
                    backgroundColor: activeTab === 'team' ? 'var(--dark-surface)' : 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'team' ? '2px solid var(--primary)' : 'none',
                    color: activeTab === 'team' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: activeTab === 'team' ? '600' : '400'
                  }}
                >
                  Team
                </button>
              )}
              <button
                className={`event-tab tab-button ${activeTab === 'gallery' ? 'active' : ''}`}
                onClick={() => setActiveTab('gallery')}
                style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: activeTab === 'gallery' ? 'var(--dark-surface)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'gallery' ? '2px solid var(--primary)' : 'none',
                  color: activeTab === 'gallery' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'gallery' ? '600' : '400'
                }}
              >
                Gallery
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
                <h2>About the Club</h2>
                <div style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '2rem' }}>
                  {club.description}
                  {club.additional_info && club.additional_info.full_description && (
                    <div style={{ marginTop: '1rem', whiteSpace: 'pre-line' }}>
                      {club.additional_info.full_description}
                    </div>
                  )}
                </div>

                {club.additional_info && club.additional_info.achievements && (
                  <>
                    <h3 style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>Achievements</h3>
                    <ul style={{ paddingLeft: '1.5rem' }}>
                      {club.additional_info.achievements.map((achievement, index) => (
                        <li key={index} style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'events' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="events-tab"
              >
                <h2>Club Events</h2>
                <p style={{ marginBottom: '2rem' }}>
                  Here are the events organized by {club.name}. Join us to experience exciting activities and showcase your talents!
                </p>

                {clubEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--dark-surface)', borderRadius: '8px' }}>
                    <p>No events found for this club.</p>
                  </div>
                ) : (
                  <div className="club-events-grid" style={{ display: 'grid', gap: '1.5rem' }}>
                    {clubEvents.map((event) => (
                      <div
                        key={event.id}
                        style={{
                          backgroundColor: 'var(--dark-surface)',
                          borderRadius: '10px',
                          padding: '1.5rem',
                          transition: 'transform 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        onClick={(e) => {
                          // Set the selected event ID
                          setSelectedEventId(event.id);

                          // Navigate to the event details page directly
                          setCurrentPage('event-details');

                          // Update the URL for shareable links
                          window.history.pushState({}, '', `/event/${event.id}`);
                        }}
                      >
                        <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{event.title}</h3>
                        <p style={{ margin: '0 0 1rem', color: 'var(--accent)' }}>
                          {formatEventDate(event.start_date, event.end_date)}
                        </p>
                        <p style={{ margin: '0 0 1rem' }}>{event.description}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                          {event.categories && (
                            <div style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.5rem',
                              backgroundColor: `${event.categories.color || 'var(--primary)'}20`,
                              borderRadius: '4px',
                              color: event.categories.color || 'var(--primary)',
                              fontSize: '0.8rem'
                            }}>
                              {event.categories.name}
                            </div>
                          )}
                          <button
                            className="btn"
                            style={{
                              padding: '0.5rem 1rem',
                              fontSize: '0.9rem',
                              backgroundColor: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent the parent div's onClick from firing

                              // First set the selected event ID
                              setSelectedEventId(event.id);

                              // Then navigate to the event details page
                              // We need to make sure setCurrentPage is called directly
                              setCurrentPage('event-details');

                              // Update the URL for shareable links
                              window.history.pushState({}, '', `/event/${event.id}`);
                            }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'team' && club.team_members && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="team-tab"
              >
                <h2>Our Team</h2>
                <p style={{ marginBottom: '2rem' }}>
                  Meet the dedicated team behind {club.name}. These individuals work tirelessly to organize events, workshops, and activities for the club.
                </p>

                <div className="team-members-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
                  {club.team_members.map((member, index) => (
                    <div
                      key={index}
                      style={{
                        textAlign: 'center'
                      }}
                    >
                      <div
                        style={{
                          width: '150px',
                          height: '150px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          margin: '0 auto 1rem',
                          border: '3px solid var(--primary)'
                        }}
                      >
                        <img
                          src={member.image || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                          alt={member.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem' }}>{member.name}</h3>
                      <p style={{ margin: 0, color: 'var(--accent)' }}>{member.position}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'gallery' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="gallery-tab"
              >
                <h2>Gallery</h2>
                <p style={{ marginBottom: '2rem' }}>
                  Take a look at some moments from our past events and activities.
                </p>

                <ClubGallery gallery={club.gallery || []} />
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="club-sidebar">
            <div
              style={{
                backgroundColor: 'var(--dark-surface)',
                borderRadius: '10px',
                padding: '1.5rem',
                marginBottom: '2rem',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
              }}
            >
              <h3 style={{
                marginTop: 0,
                marginBottom: '1.5rem',
                fontSize: '1.3rem',
                borderBottom: '2px solid var(--primary)',
                paddingBottom: '0.5rem',
                display: 'inline-block'
              }}>Contact Information</h3>

              <div style={{ marginBottom: '1.2rem' }}>
                <h4 style={{
                  margin: '0 0 0.5rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem'
                  }}>✉️</span>
                  EMAIL
                </h4>
                <p style={{ margin: 0, fontSize: '1rem' }}>{club.contact_email || club.email}</p>
              </div>

              {club.contact_phone && (
                <div style={{ marginBottom: '1.2rem' }}>
                  <h4 style={{
                    margin: '0 0 0.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem'
                    }}>📞</span>
                    PHONE
                  </h4>
                  <p style={{ margin: 0, fontSize: '1rem' }}>{club.contact_phone}</p>
                </div>
              )}

              {club.website && (
                <div style={{ marginBottom: '1.2rem' }}>
                  <h4 style={{
                    margin: '0 0 0.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem'
                    }}>🌐</span>
                    WEBSITE
                  </h4>
                  <p style={{ margin: 0 }}>
                    <a
                      href={club.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--primary)',
                        textDecoration: 'none',
                        borderBottom: '1px dashed var(--primary)',
                        paddingBottom: '2px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.style.borderBottom = '1px solid var(--primary)'}
                      onMouseOut={(e) => e.target.style.borderBottom = '1px dashed var(--primary)'}
                    >
                      {club.website.replace(/^https?:\/\//, '')}
                    </a>
                  </p>
                </div>
              )}

              {club.social_links && Object.keys(club.social_links).length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{
                    margin: '0 0 0.8rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem'
                    }}>🔗</span>
                    SOCIAL MEDIA
                  </h4>
                  <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                    {club.social_links.instagram && (
                      <a
                        href={club.social_links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Instagram"
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          border: '1px solid transparent'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.border = '1px solid var(--primary)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.border = '1px solid transparent';
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    )}
                    {club.social_links.facebook && (
                      <a
                        href={club.social_links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Facebook"
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          border: '1px solid transparent',
                          fontWeight: 'bold'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.border = '1px solid var(--primary)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.border = '1px solid transparent';
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                        </svg>
                      </a>
                    )}
                    {club.social_links.linkedin && (
                      <a
                        href={club.social_links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="LinkedIn"
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          border: '1px solid transparent',
                          fontWeight: 'bold'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.border = '1px solid var(--primary)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.border = '1px solid transparent';
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
                        </svg>
                      </a>
                    )}
                    {club.social_links.twitter && (
                      <a
                        href={club.social_links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Twitter"
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          border: '1px solid transparent'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.border = '1px solid var(--primary)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.border = '1px solid transparent';
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                        </svg>
                      </a>
                    )}
                    {club.social_links.youtube && (
                      <a
                        href={club.social_links.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="YouTube"
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          border: '1px solid transparent'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.border = '1px solid var(--primary)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.border = '1px solid transparent';
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                        </svg>
                      </a>
                    )}
                    {club.social_links.github && (
                      <a
                        href={club.social_links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="GitHub"
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          border: '1px solid transparent'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.border = '1px solid var(--primary)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.border = '1px solid transparent';
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {clubEvents.length > 0 && (
                <div>
                  <h4 style={{
                    margin: '0 0 0.8rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem'
                    }}>📅</span>
                    UPCOMING EVENTS
                  </h4>
                  {clubEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      style={{
                        marginBottom: '1rem',
                        cursor: 'pointer',
                        padding: '0.6rem',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                        border: '1px solid transparent'
                      }}
                      onClick={() => {
                        setSelectedEventId(event.id);
                        navigateTo(setCurrentPage, 'event-details', { eventId: event.id });
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.05)';
                        e.currentTarget.style.transform = 'translateX(3px)';
                        e.currentTarget.style.border = '1px solid rgba(var(--primary-rgb), 0.2)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.border = '1px solid transparent';
                      }}
                    >
                      <h5 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem' }}>{event.title}</h5>
                      <p style={{
                        margin: 0,
                        fontSize: '0.8rem',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        <span style={{ fontSize: '0.7rem' }}>📆</span>
                        {formatEventDate(event.start_date, event.end_date)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </section>
  );
};

export default ClubDetails;