import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import clubService from '../services/clubService';
import eventService from '../services/eventService';
import AdminClubEditor from './AdminClubEditor';

const AdminClubDetails = ({ clubId, onBack, onViewEvent }) => {
  const [club, setClub] = useState(null);
  const [clubEvents, setClubEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);

  // Prevent body scrolling when component mounts
  useEffect(() => {
    // Store original body styles
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;

    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.classList.add('modal-open');

    // Cleanup function to restore original styles
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.classList.remove('modal-open');
    };
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Handle club update
  const handleClubUpdate = (updatedClub) => {
    setClub(updatedClub);
    setIsEditing(false);
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading club details...</p>
      </div>
    );
  }

  // If error, show error state
  if (error || !club) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>
        <p>{error || 'Club not found'}</p>
        <button
          onClick={onBack}
          className="btn"
          style={{ marginTop: '1rem' }}
        >
          Back to Clubs
        </button>
      </div>
    );
  }

  // If editing, show only the editor
  if (isEditing && club) {
    return (
      <AdminClubEditor
        club={club}
        onClose={() => setIsEditing(false)}
        onUpdate={handleClubUpdate}
      />
    );
  }

  return (
    <motion.div
      className="admin-club-details"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ backgroundColor: 'var(--dark-bg)', borderRadius: '10px', overflow: 'hidden' }}
    >
      {/* Header */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'var(--dark-surface)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: 'rgba(var(--primary-rgb), 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem'
          }}>
            {club.logo_url ? (
              <img
                src={club.logo_url}
                alt={club.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              club.name.charAt(0)
            )}
          </div>
          <div>
            <h2 style={{ margin: '0 0 0.25rem' }}>{club.name}</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {club.contact_email}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setIsEditing(true)}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>✏️</span> Edit Club
          </button>
          <button
            onClick={onBack}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Back
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'var(--dark-surface)'
      }}>
        <button
          className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: activeTab === 'details' ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'details' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'details' ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: activeTab === 'details' ? '600' : '400'
          }}
        >
          Club Details
        </button>
        <button
          className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: activeTab === 'events' ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'events' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'events' ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: activeTab === 'events' ? '600' : '400'
          }}
        >
          Club Events
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '1.5rem' }}>
        {activeTab === 'details' && (
          <div className="club-details-tab">
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              <div>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.2rem' }}>Basic Information</h3>
                <div style={{
                  backgroundColor: 'var(--dark-surface)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem 2rem'
                }}>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>CLUB ID</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{club.id}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>CREATED</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{formatDate(club.created_at)}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>EMAIL</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{club.contact_email || club.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>PHONE</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{club.contact_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>WEBSITE</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>
                      {club.website ? (
                        <a
                          href={club.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--primary)' }}
                        >
                          {club.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>LAST UPDATED</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{formatDate(club.updated_at)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.2rem' }}>Social Media</h3>
                <div style={{
                  backgroundColor: 'var(--dark-surface)',
                  borderRadius: '8px',
                  padding: '1.5rem'
                }}>
                  {club.social_links && Object.keys(club.social_links || {}).length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {club.social_links.instagram && (
                        <div>
                          <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>INSTAGRAM</p>
                          <p style={{ margin: 0, fontSize: '0.95rem' }}>
                            <a
                              href={club.social_links.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--primary)' }}
                            >
                              {club.social_links.instagram.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          </p>
                        </div>
                      )}
                      {club.social_links.facebook && (
                        <div>
                          <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>FACEBOOK</p>
                          <p style={{ margin: 0, fontSize: '0.95rem' }}>
                            <a
                              href={club.social_links.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--primary)' }}
                            >
                              {club.social_links.facebook.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          </p>
                        </div>
                      )}
                      {club.social_links.linkedin && (
                        <div>
                          <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>LINKEDIN</p>
                          <p style={{ margin: 0, fontSize: '0.95rem' }}>
                            <a
                              href={club.social_links.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--primary)' }}
                            >
                              {club.social_links.linkedin.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          </p>
                        </div>
                      )}
                      {club.social_links.twitter && (
                        <div>
                          <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>TWITTER</p>
                          <p style={{ margin: 0, fontSize: '0.95rem' }}>
                            <a
                              href={club.social_links.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--primary)' }}
                            >
                              {club.social_links.twitter.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          </p>
                        </div>
                      )}
                      {club.social_links.youtube && (
                        <div>
                          <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>YOUTUBE</p>
                          <p style={{ margin: 0, fontSize: '0.95rem' }}>
                            <a
                              href={club.social_links.youtube}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--primary)' }}
                            >
                              {club.social_links.youtube.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          </p>
                        </div>
                      )}
                      {club.social_links.github && (
                        <div>
                          <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>GITHUB</p>
                          <p style={{ margin: 0, fontSize: '0.95rem' }}>
                            <a
                              href={club.social_links.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--primary)' }}
                            >
                              {club.social_links.github.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No social media links available</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.2rem' }}>Description</h3>
              <div style={{
                backgroundColor: 'var(--dark-surface)',
                borderRadius: '8px',
                padding: '1.5rem'
              }}>
                {club.description ? (
                  <p style={{ margin: 0, lineHeight: '1.6' }}>{club.description}</p>
                ) : (
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No description available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="club-events-tab">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Events by {club.name}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Total: {clubEvents.length} event{clubEvents.length !== 1 ? 's' : ''}
              </p>
            </div>

            {clubEvents.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                {clubEvents.map(event => (
                  <div
                    key={event.id}
                    style={{
                      backgroundColor: 'var(--dark-surface)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => onViewEvent(event.id)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      height: '120px',
                      backgroundColor: 'rgba(var(--primary-rgb), 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem'
                    }}>
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        '🎉'
                      )}
                    </div>
                    <div style={{ padding: '1rem' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '0.8rem',
                          backgroundColor: event.categories ? `${event.categories.color}20` : 'rgba(var(--primary-rgb), 0.2)',
                          color: event.categories ? event.categories.color : 'var(--primary)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          {event.categories ? event.categories.name : 'Event'}
                        </span>
                        <span style={{
                          fontSize: '0.8rem',
                          backgroundColor:
                            event.status === 'upcoming' ? 'rgba(0, 128, 255, 0.2)' :
                            event.status === 'ongoing' ? 'rgba(0, 200, 0, 0.2)' :
                            event.status === 'completed' ? 'rgba(128, 128, 128, 0.2)' :
                            'rgba(255, 0, 0, 0.2)',
                          color:
                            event.status === 'upcoming' ? '#0080ff' :
                            event.status === 'ongoing' ? '#00c800' :
                            event.status === 'completed' ? '#808080' :
                            '#ff0000',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          textTransform: 'capitalize'
                        }}>
                          {event.status}
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>{event.title}</h4>
                      <p style={{
                        margin: '0 0 0.75rem',
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <span>📅</span> {formatDate(event.start_date)}
                      </p>
                      <p style={{
                        margin: 0,
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1.5'
                      }}>
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                backgroundColor: 'var(--dark-surface)',
                borderRadius: '8px',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No events found for this club</p>
              </div>
            )}
          </div>
        )}
      </div>

    </motion.div>
  );
};

export default AdminClubDetails;
