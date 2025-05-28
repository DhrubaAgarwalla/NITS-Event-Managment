import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import eventService from '../services/eventService';
import registrationService from '../services/registrationService';
import AdminEventEditor from './AdminEventEditor';
import GoogleSheetsSuccessDialog from './GoogleSheetsSuccessDialog';
import GoogleSheetsInfo from './GoogleSheetsInfo';

const AdminEventDetails = ({ eventId, onBack, onViewClub }) => {
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showGoogleSheetsDialog, setShowGoogleSheetsDialog] = useState(false);
  const [googleSheetsResult, setGoogleSheetsResult] = useState(null);

  // Fetch event data from Supabase
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);

        // Fetch event details
        const eventData = await eventService.getEventById(eventId);
        setEvent(eventData);

        // Fetch registrations
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch (error) {
      return 'Invalid time';
    }
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date/time';
    }
  };

  // Handle event update
  const handleEventUpdate = (updatedEvent) => {
    setEvent(updatedEvent);
    setIsEditing(false);
  };

  // Handle export registrations
  const handleExportRegistrations = async (format = 'excel') => {
    try {
      setExportLoading(true);

      const result = await registrationService.exportRegistrationsAsCSV(
        event.id,
        event.title,
        format
      );

      if (!result.success) {
        alert(result.message || 'Failed to export registrations');
        return;
      }

      // Handle different export formats
      if (format === 'google_sheets') {
        // Show the new Google Sheets success dialog
        setGoogleSheetsResult(result);
        setShowGoogleSheetsDialog(true);
      } else {
        // For Excel and PDF, download the file
        if (result.url && result.filename) {
          const link = document.createElement('a');
          link.href = result.url;
          link.download = result.filename;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (err) {
      console.error('Error exporting registrations:', err);
      alert('Failed to export registrations: ' + (err.message || 'Unknown error'));
    } finally {
      setExportLoading(false);
    }
  };

  // Toggle event featured status
  const toggleEventFeatured = async () => {
    try {
      const updatedEvent = await eventService.updateEvent(event.id, {
        is_featured: !event.is_featured
      });
      setEvent(updatedEvent);
    } catch (err) {
      console.error('Error toggling featured status:', err);
      alert('Failed to update featured status: ' + (err.message || 'Unknown error'));
    }
  };

  // Google Sheets dialog handlers
  const handleOpenSheet = (shareableLink) => {
    window.open(shareableLink, '_blank');
  };

  const handleCopyLink = async (shareableLink) => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      alert('Google Sheet link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareableLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Google Sheet link copied to clipboard!');
    }
  };

  const handleShareWhatsApp = (whatsappUrl) => {
    console.log('Opening WhatsApp URL:', whatsappUrl);
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank');
    } else {
      console.error('WhatsApp URL is empty or undefined');
      alert('WhatsApp URL is not available. Please try copying the link instead.');
    }
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading event details...</p>
      </div>
    );
  }

  // If error, show error state
  if (error || !event) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>
        <p>{error || 'Event not found'}</p>
        <button
          onClick={onBack}
          className="btn"
          style={{ marginTop: '1rem' }}
        >
          Back to Events
        </button>
      </div>
    );
  }

  // If editing, show only the editor
  if (isEditing && event) {
    return (
      <AdminEventEditor
        event={event}
        onClose={() => setIsEditing(false)}
        onUpdate={handleEventUpdate}
      />
    );
  }

  return (
    <motion.div
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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
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
            {event.is_featured && (
              <span style={{
                fontSize: '0.8rem',
                backgroundColor: 'rgba(255, 215, 0, 0.2)',
                color: '#ffd700',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <span>⭐</span> Featured
              </span>
            )}
          </div>
          <h2 style={{ margin: '0 0 0.25rem' }}>{event.title}</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {formatDate(event.start_date)} • {event.location}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={toggleEventFeatured}
            style={{
              backgroundColor: event.is_featured ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
              color: event.is_featured ? '#ffd700' : 'var(--text-secondary)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>⭐</span> {event.is_featured ? 'Unfeature' : 'Feature'}
          </button>
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
            <span>✏️</span> Edit Event
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
          Event Details
        </button>
        <button
          className={`tab-button ${activeTab === 'registrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('registrations')}
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: activeTab === 'registrations' ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'registrations' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'registrations' ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: activeTab === 'registrations' ? '600' : '400'
          }}
        >
          Registrations ({registrations.length})
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '1.5rem' }}>
        {activeTab === 'details' && (
          <div className="event-details-tab">
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
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>EVENT ID</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{event.id}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>CREATED</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{formatDate(event.created_at)}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>START DATE</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{formatDate(event.start_date)}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>START TIME</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{formatTime(event.start_date)}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>END DATE</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{formatDate(event.end_date)}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>END TIME</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{formatTime(event.end_date)}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>LOCATION</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{event.location}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>STATUS</p>
                    <p style={{ margin: 0, fontSize: '0.95rem', textTransform: 'capitalize' }}>{event.status}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>CATEGORY</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{event.categories ? event.categories.name : 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>FEATURED</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{event.is_featured ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.2rem' }}>Registration Information</h3>
                <div style={{
                  backgroundColor: 'var(--dark-surface)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem 2rem'
                }}>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>REGISTRATION METHOD</p>
                    <p style={{ margin: 0, fontSize: '0.95rem', textTransform: 'capitalize' }}>
                      {event.registration_method || 'Internal'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>REGISTRATION DEADLINE</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{formatDate(event.registration_deadline)}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>MAX PARTICIPANTS</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{event.max_participants || 'Unlimited'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>CURRENT REGISTRATIONS</p>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{registrations.length}</p>
                  </div>
                  {event.external_form_url && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ margin: '0 0 0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>EXTERNAL FORM URL</p>
                      <p style={{ margin: 0, fontSize: '0.95rem' }}>
                        <a
                          href={event.external_form_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--primary)' }}
                        >
                          {event.external_form_url}
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.2rem' }}>Organizer</h3>
                <div
                  style={{
                    backgroundColor: 'var(--dark-surface)',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onClick={() => event.clubs && onViewClub(event.clubs.id)}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--dark-surface)'}
                >
                  {event.clubs ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        backgroundColor: 'rgba(var(--primary-rgb), 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem'
                      }}>
                        {event.clubs.logo_url ? (
                          <img
                            src={event.clubs.logo_url}
                            alt={event.clubs.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          event.clubs.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem' }}>{event.clubs.name}</h4>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          {event.clubs.contact_email}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No organizer information available</p>
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
                {event.description ? (
                  <p style={{ margin: 0, lineHeight: '1.6' }}>{event.description}</p>
                ) : (
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No description available</p>
                )}
              </div>

              {/* Google Sheets Information */}
              <GoogleSheetsInfo event={event} />
            </div>
          </div>
        )}

        {activeTab === 'registrations' && (
          <div className="registrations-tab">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Registrations for {event.title}</h3>
              <div className="export-buttons" style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => handleExportRegistrations('pdf')}
                  disabled={exportLoading || registrations.length === 0}
                  style={{
                    backgroundColor: 'rgba(255, 68, 68, 0.15)',
                    color: '#ff5555',
                    border: '1px solid rgba(255, 68, 68, 0.3)',
                    borderRadius: '4px',
                    padding: '0.5rem 1rem',
                    cursor: registrations.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    opacity: registrations.length === 0 ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>{exportLoading ? '⏳' : '📄'}</span> {exportLoading ? 'Exporting...' : 'PDF'}
                </button>

                <button
                  onClick={() => handleExportRegistrations('excel_styled')}
                  disabled={exportLoading || registrations.length === 0}
                  style={{
                    backgroundColor: 'rgba(52, 168, 83, 0.15)',
                    color: '#34A853',
                    border: '1px solid rgba(52, 168, 83, 0.3)',
                    borderRadius: '4px',
                    padding: '0.5rem 1rem',
                    cursor: registrations.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    opacity: registrations.length === 0 ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>{exportLoading ? '⏳' : '📊'}</span> {exportLoading ? 'Exporting...' : 'Excel (Styled)'}
                </button>

                <button
                  className="export-google-sheets-btn"
                  onClick={() => handleExportRegistrations('google_sheets')}
                  disabled={exportLoading || registrations.length === 0}
                  style={{
                    backgroundColor: 'rgba(66, 133, 244, 0.15)',
                    color: '#4285F4',
                    border: '1px solid rgba(66, 133, 244, 0.3)',
                    borderRadius: '4px',
                    padding: '0.5rem 1rem',
                    cursor: registrations.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    opacity: registrations.length === 0 ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>{exportLoading ? '⏳' : '📋'}</span> {exportLoading ? 'Exporting...' : 'Google Sheets'}
                </button>
              </div>
            </div>

            {registrations.length > 0 ? (
              <div style={{
                backgroundColor: 'var(--dark-surface)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem' }}>Name</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem' }}>Email</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem' }}>Phone</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem' }}>ID/Roll Number</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem' }}>Team Type</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem' }}>Status</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem' }}>Registered On</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem' }}>Team Members</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map(registration => (
                        <tr
                          key={registration.id}
                          style={{
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '1rem' }}>{registration.participant_name}</td>
                          <td style={{ padding: '1rem' }}>{registration.participant_email}</td>
                          <td style={{ padding: '1rem' }}>{registration.participant_phone || 'N/A'}</td>
                          <td style={{ padding: '1rem' }}>{registration.participant_id || 'N/A'}</td>
                          <td style={{ padding: '1rem', textTransform: 'capitalize' }}>
                            {registration.additional_info?.team_type || 'Individual'}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              backgroundColor:
                                registration.status === 'registered' ? 'rgba(0, 128, 255, 0.2)' :
                                registration.status === 'attended' ? 'rgba(0, 200, 0, 0.2)' :
                                'rgba(255, 0, 0, 0.2)',
                              color:
                                registration.status === 'registered' ? '#0080ff' :
                                registration.status === 'attended' ? '#00c800' :
                                '#ff0000',
                              textTransform: 'capitalize'
                            }}>
                              {registration.status}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>{formatDate(registration.created_at)}</td>
                          <td style={{ padding: '1rem' }}>
                            {registration.additional_info?.team_members &&
                             registration.additional_info.team_members.length > 0 ? (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer'
                              }}>
                                <span>{registration.additional_info.team_members.length}</span>
                                <button
                                  onClick={() => {
                                    alert(`Team Members:\n\n${registration.additional_info.team_members.map(
                                      member => `${member.name} (${member.email})`
                                    ).join('\n')}`);
                                  }}
                                  style={{
                                    backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                                    color: 'var(--primary)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '0.25rem 0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  View
                                </button>
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: 'var(--dark-surface)',
                borderRadius: '8px',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No registrations found for this event</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {/* AdminEventEditor is now rendered as a full page component */}

      {/* Google Sheets Success Dialog */}
      {showGoogleSheetsDialog && googleSheetsResult && (
        <GoogleSheetsSuccessDialog
          result={googleSheetsResult}
          onClose={() => {
            setShowGoogleSheetsDialog(false);
            setGoogleSheetsResult(null);
          }}
          onOpenSheet={handleOpenSheet}
          onCopyLink={handleCopyLink}
          onShareWhatsApp={handleShareWhatsApp}
        />
      )}
    </motion.div>
  );
};

export default AdminEventDetails;
