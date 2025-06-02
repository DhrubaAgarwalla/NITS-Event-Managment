import React, { useState, useEffect } from 'react';
import eventService from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Component to view and access auto-created Google Sheets
 * @param {string} clubId - Optional club ID to filter events for specific club
 */
const AutoCreatedSheetsViewer = ({ clubId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'with-sheets', 'without-sheets'
  const { club, isAdmin } = useAuth();

  useEffect(() => {
    loadEvents();
  }, [clubId]);

  const loadEvents = async () => {
    try {
      setLoading(true);

      // Determine which events to load based on context
      let eventsToLoad;
      if (clubId) {
        // Load events for specific club
        eventsToLoad = await eventService.getClubEvents(clubId);
      } else if (club && !isAdmin) {
        // Load events for current club (when used in club dashboard)
        eventsToLoad = await eventService.getClubEvents(club.id);
      } else {
        // Load all events (admin view)
        eventsToLoad = await eventService.getAllEvents();
      }

      setEvents(eventsToLoad);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'with-sheets') {
      return event.google_sheet_id && event.google_sheet_url;
    } else if (filter === 'without-sheets') {
      return !event.google_sheet_id;
    }
    return true; // 'all'
  });

  const eventsWithSheets = events.filter(e => e.google_sheet_id).length;
  const eventsWithoutSheets = events.filter(e => !e.google_sheet_id).length;

  const openSheet = (url) => {
    window.open(url, '_blank');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('URL copied to clipboard!');
    });
  };

  const getStatusBadge = (event) => {
    if (event.google_sheet_id) {
      return (
        <span style={{
          backgroundColor: 'var(--accent)',
          color: 'var(--dark-bg)',
          padding: '4px 12px',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          ✅ Sheet Created
        </span>
      );
    } else if (event.sheet_creation_error) {
      return (
        <span style={{
          backgroundColor: 'var(--secondary)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          ❌ Creation Failed
        </span>
      );
    } else {
      return (
        <span style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: 'var(--text-secondary)',
          padding: '4px 12px',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          ⏳ No Sheet
        </span>
      );
    }
  };

  const getSyncStatus = (event) => {
    if (!event.google_sheet_id) return null;

    if (event.auto_sync_enabled === false) {
      return (
        <span style={{
          color: 'var(--secondary)',
          fontSize: '12px',
          backgroundColor: 'rgba(255, 68, 227, 0.1)',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          🔇 Auto-sync disabled
        </span>
      );
    } else if (event.sync_error) {
      return (
        <span style={{
          color: 'var(--secondary)',
          fontSize: '12px',
          backgroundColor: 'rgba(255, 68, 227, 0.1)',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          ⚠️ Sync error: {event.sync_error}
        </span>
      );
    } else if (event.last_sync_at) {
      return (
        <span style={{
          color: 'var(--accent)',
          fontSize: '12px',
          backgroundColor: 'rgba(68, 255, 210, 0.1)',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          ✅ Last sync: {new Date(event.last_sync_at).toLocaleString()}
        </span>
      );
    } else {
      return (
        <span style={{
          color: 'var(--primary)',
          fontSize: '12px',
          backgroundColor: 'rgba(110, 68, 255, 0.1)',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          🔄 Auto-sync enabled
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'var(--text-primary)',
        backgroundColor: 'var(--dark-bg)'
      }}>
        <p>Loading events...</p>
      </div>
    );
  }

  // Get context-specific title
  const getTitle = () => {
    if (clubId || (club && !isAdmin)) {
      const clubName = club?.name || 'Club';
      return `📊 ${clubName} - Auto-Created Google Sheets`;
    }
    return '📊 Auto-Created Google Sheets';
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: 'var(--dark-bg)',
      color: 'var(--text-primary)',
      minHeight: '100vh'
    }}>
      <h2 style={{
        color: 'var(--text-primary)',
        marginBottom: '10px',
        background: 'linear-gradient(90deg, var(--primary), var(--accent))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        {getTitle()}
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
        View and access automatically created Google Sheets for your events.
      </p>

      {/* Summary Stats */}
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: 'var(--dark-surface)',
        borderRadius: '12px',
        border: '1px solid rgba(110, 68, 255, 0.2)',
        boxShadow: '0 4px 20px rgba(110, 68, 255, 0.1)'
      }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'var(--accent)',
            marginBottom: '5px'
          }}>
            {eventsWithSheets}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>With Sheets</div>
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'var(--secondary)',
            marginBottom: '5px'
          }}>
            {eventsWithoutSheets}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Without Sheets</div>
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'var(--primary)',
            marginBottom: '5px'
          }}>
            {events.length}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Events</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '15px',
        backgroundColor: 'var(--dark-surface)',
        borderRadius: '8px',
        border: '1px solid rgba(110, 68, 255, 0.1)'
      }}>
        <label style={{
          color: 'var(--text-primary)',
          fontWeight: '500'
        }}>
          Filter:
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(110, 68, 255, 0.3)',
            backgroundColor: 'var(--dark-bg)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Events ({events.length})</option>
          <option value="with-sheets">With Sheets ({eventsWithSheets})</option>
          <option value="without-sheets">Without Sheets ({eventsWithoutSheets})</option>
        </select>

        <button
          onClick={loadEvents}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = 'var(--accent)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'var(--primary)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Events List */}
      <div style={{
        border: '1px solid rgba(110, 68, 255, 0.2)',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: 'var(--dark-surface)'
      }}>
        {filteredEvents.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--dark-surface)'
          }}>
            No events found for the selected filter.
          </div>
        ) : (
          filteredEvents.map(event => (
            <div
              key={event.id}
              style={{
                padding: '20px',
                borderBottom: '1px solid rgba(110, 68, 255, 0.1)',
                backgroundColor: event.google_sheet_id
                  ? 'rgba(68, 255, 210, 0.05)'
                  : 'var(--dark-surface)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = event.google_sheet_id
                  ? 'rgba(68, 255, 210, 0.1)'
                  : 'rgba(110, 68, 255, 0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = event.google_sheet_id
                  ? 'rgba(68, 255, 210, 0.05)'
                  : 'var(--dark-surface)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: '0 0 10px 0',
                    color: 'var(--text-primary)',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    {event.title}
                  </h3>

                  <div style={{ marginBottom: '8px' }}>
                    {getStatusBadge(event)}
                    <span style={{
                      marginLeft: '10px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      fontFamily: 'monospace'
                    }}>
                      Event ID: {event.id}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '15px'
                  }}>
                    <span>📅 {new Date(event.start_date).toLocaleDateString()}</span>
                    <span>📍 {event.location || 'No location'}</span>
                    <span>👥 {event.participation_type || 'individual'}</span>
                  </div>

                  {getSyncStatus(event) && (
                    <div style={{ marginBottom: '8px' }}>
                      {getSyncStatus(event)}
                    </div>
                  )}

                  {event.google_sheet_id && (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(110, 68, 255, 0.1)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      Sheet ID: {event.google_sheet_id}
                    </div>
                  )}

                  {event.sheet_creation_error && (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--secondary)',
                      marginTop: '5px',
                      backgroundColor: 'rgba(255, 68, 227, 0.1)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      Error: {event.sheet_creation_error}
                    </div>
                  )}
                </div>

                {event.google_sheet_url && (
                  <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                    <button
                      onClick={() => openSheet(event.google_sheet_url)}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: 'var(--accent)',
                        color: 'var(--dark-bg)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = 'var(--primary)';
                        e.target.style.color = 'white';
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = 'var(--accent)';
                        e.target.style.color = 'var(--dark-bg)';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      📊 Open Sheet
                    </button>

                    <button
                      onClick={() => copyToClipboard(event.google_sheet_url)}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: 'var(--secondary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = 'var(--primary)';
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = 'var(--secondary)';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      📋 Copy URL
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Help Section */}
      <div style={{
        marginTop: '20px',
        padding: '20px',
        backgroundColor: 'var(--dark-surface)',
        borderRadius: '12px',
        border: '1px solid rgba(68, 255, 210, 0.2)',
        boxShadow: '0 4px 20px rgba(68, 255, 210, 0.1)'
      }}>
        <h4 style={{
          color: 'var(--accent)',
          marginBottom: '15px',
          fontSize: '16px'
        }}>
          💡 About Auto-Created Sheets:
        </h4>
        <ul style={{
          margin: '0',
          paddingLeft: '20px',
          color: 'var(--text-secondary)',
          lineHeight: '1.6'
        }}>
          <li><strong style={{ color: 'var(--text-primary)' }}>Location:</strong> Sheets are saved in the Google Drive of your service account</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Access:</strong> Sheets are publicly editable (anyone with link can edit)</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Updates:</strong> Sheets update automatically when registrations, attendance, or payments change</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Naming:</strong> Sheets are named "{`{Event Title} - Event Registrations`}"</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Sharing:</strong> You can share the sheet URL with anyone who needs access</li>
        </ul>

        <p style={{
          marginTop: '15px',
          marginBottom: '0',
          color: 'var(--text-secondary)',
          fontSize: '14px'
        }}>
          <strong style={{ color: 'var(--primary)' }}>Note:</strong> If you don't see a sheet for an event, check the console logs for any creation errors.
        </p>
      </div>
    </div>
  );
};

export default AutoCreatedSheetsViewer;
