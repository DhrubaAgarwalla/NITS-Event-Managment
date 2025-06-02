import React, { useState, useEffect } from 'react';
import eventService from '../services/eventService';
import registrationService from '../services/registrationService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Component to view and access auto-created Google Sheets
 * @param {string} clubId - Optional club ID to filter events for specific club
 */
const AutoCreatedSheetsViewer = ({ clubId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'with-sheets', 'without-sheets'
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [syncingSheets, setSyncingSheets] = useState(new Set());
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

      // Sort events by creation date (newest first)
      const sortedEvents = eventsToLoad.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });

      setEvents(sortedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshEvents = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  // Auto-sync sheet and then open it
  const syncAndOpenSheet = async (event) => {
    if (!event.google_sheet_id || !event.google_sheet_url) {
      // If no sheet exists, just try to open the URL (shouldn't happen, but safety check)
      window.open(event.google_sheet_url, '_blank');
      return;
    }

    try {
      // Add this sheet to syncing state
      setSyncingSheets(prev => new Set([...prev, event.id]));

      console.log(`🔄 Auto-syncing sheet for event ${event.id} before opening...`);

      // Use the smart generation function which will update the existing sheet
      const result = await registrationService.smartGenerateGoogleSheet(
        event.id,
        event.title
      );

      if (result.success) {
        console.log(`✅ Sheet synced successfully, opening: ${result.shareableLink}`);

        // Update the event in our local state with any new info
        setEvents(prevEvents =>
          prevEvents.map(e =>
            e.id === event.id
              ? {
                  ...e,
                  google_sheet_url: result.shareableLink,
                  last_sync_at: new Date().toISOString(),
                  last_sync_type: 'manual_sync'
                }
              : e
          )
        );

        // Open the sheet
        window.open(result.shareableLink, '_blank');
      } else {
        console.warn(`⚠️ Failed to sync sheet, opening anyway: ${result.message}`);
        // If sync fails, still open the existing sheet
        window.open(event.google_sheet_url, '_blank');
      }
    } catch (error) {
      console.error('Error syncing sheet:', error);
      // If there's an error, still try to open the existing sheet
      window.open(event.google_sheet_url, '_blank');
    } finally {
      // Remove from syncing state
      setSyncingSheets(prev => {
        const newSet = new Set(prev);
        newSet.delete(event.id);
        return newSet;
      });
    }
  };

  const filteredEvents = events.filter(event => {
    // Filter by sheet status
    let matchesFilter = true;
    if (filter === 'with-sheets') {
      matchesFilter = event.google_sheet_id && event.google_sheet_url;
    } else if (filter === 'without-sheets') {
      matchesFilter = !event.google_sheet_id;
    }

    // Filter by search term
    let matchesSearch = true;
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      matchesSearch =
        event.title?.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        event.location?.toLowerCase().includes(searchLower);
    }

    return matchesFilter && matchesSearch;
  });

  const eventsWithSheets = events.filter(e => e.google_sheet_id).length;
  const eventsWithoutSheets = events.filter(e => !e.google_sheet_id).length;

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
    <div
      className="sheets-container"
      style={{
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'var(--dark-bg)',
        color: 'var(--text-primary)',
        minHeight: '100vh'
      }}
    >
      {/* Add CSS for animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @media (max-width: 768px) {
            .sheets-container {
              padding: 10px;
            }
            .stats-grid {
              grid-template-columns: 1fr 1fr;
              gap: 8px;
            }
            .filter-buttons {
              flex-direction: column;
              align-items: stretch;
            }
            .filter-buttons button {
              width: 100%;
              margin-bottom: 8px;
            }

            /* Mobile-specific event card optimizations */
            .mobile-event-card {
              padding: 16px !important;
              margin-bottom: 12px !important;
            }

            .mobile-event-title {
              font-size: 16px !important;
              margin-bottom: 8px !important;
              line-height: 1.3 !important;
            }

            .mobile-event-meta {
              font-size: 13px !important;
              gap: 10px !important;
              margin-bottom: 10px !important;
            }

            .mobile-event-meta span {
              display: flex !important;
              align-items: center !important;
              gap: 4px !important;
            }

            .mobile-status-badge {
              font-size: 11px !important;
              padding: 3px 8px !important;
            }

            .mobile-sync-status {
              font-size: 11px !important;
              padding: 2px 6px !important;
              margin-bottom: 8px !important;
            }

            .mobile-buttons-container {
              display: flex !important;
              flex-direction: column !important;
              gap: 8px !important;
              width: 100% !important;
            }

            .mobile-button {
              padding: 12px 16px !important;
              font-size: 13px !important;
              width: 100% !important;
              justify-content: center !important;
            }

            .mobile-hidden {
              display: none !important;
            }

            .mobile-compact-info {
              display: block !important;
              background-color: rgba(110, 68, 255, 0.05) !important;
              padding: 8px !important;
              border-radius: 6px !important;
              font-size: 11px !important;
              margin-top: 8px !important;
            }

            .mobile-compact-help {
              display: block !important;
            }

            /* Desktop layout adjustments */
            @media (min-width: 769px) {
              .mobile-event-card > div {
                flex-direction: row !important;
                align-items: flex-start !important;
              }

              .mobile-buttons-container {
                flex-direction: column !important;
                width: auto !important;
                justify-content: flex-start !important;
              }

              .mobile-button {
                width: auto !important;
              }

              .mobile-compact-info {
                display: none !important;
              }

              .mobile-compact-help {
                display: none !important;
              }
            }
          }
        `}
      </style>
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

      {/* Loading State */}
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          color: 'var(--text-secondary)'
        }}>
          <div style={{
            border: '3px solid rgba(110, 68, 255, 0.3)',
            borderTop: '3px solid var(--primary)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            marginRight: '15px'
          }}></div>
          Loading events...
        </div>
      ) : (
        <>
          {/* Summary Stats - Mobile Optimized */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(68, 255, 210, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(68, 255, 210, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'var(--accent)',
                marginBottom: '4px'
              }}>
                {eventsWithSheets}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>With Sheets</div>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#fbbf24',
                marginBottom: '4px'
              }}>
                {eventsWithoutSheets}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Without Sheets</div>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(110, 68, 255, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(110, 68, 255, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'var(--primary)',
                marginBottom: '4px'
              }}>
                {events.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Events</div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            marginBottom: '20px'
          }}>
            {/* Search Bar */}
            <div style={{
              position: 'relative',
              width: '100%'
            }}>
              <input
                type="text"
                placeholder="Search events by title, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 45px 12px 16px',
                  backgroundColor: 'var(--dark-surface)',
                  border: '1px solid rgba(110, 68, 255, 0.3)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(110, 68, 255, 0.3)';
                }}
              />
              <span style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
                fontSize: '1.1rem'
              }}>
                🔍
              </span>
            </div>

            {/* Filter Buttons and Refresh */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {['all', 'with-sheets', 'without-sheets'].map(filterOption => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: filter === filterOption
                        ? '2px solid var(--primary)'
                        : '1px solid rgba(110, 68, 255, 0.3)',
                      backgroundColor: filter === filterOption
                        ? 'rgba(110, 68, 255, 0.2)'
                        : 'var(--dark-surface)',
                      color: filter === filterOption
                        ? 'var(--primary)'
                        : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: filter === filterOption ? '600' : '400',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseOver={(e) => {
                      if (filter !== filterOption) {
                        e.target.style.backgroundColor = 'rgba(110, 68, 255, 0.1)';
                        e.target.style.borderColor = 'rgba(110, 68, 255, 0.5)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (filter !== filterOption) {
                        e.target.style.backgroundColor = 'var(--dark-surface)';
                        e.target.style.borderColor = 'rgba(110, 68, 255, 0.3)';
                      }
                    }}
                  >
                    {filterOption === 'all' && `📊 All (${events.length})`}
                    {filterOption === 'with-sheets' && `✅ With Sheets (${eventsWithSheets})`}
                    {filterOption === 'without-sheets' && `❌ No Sheets (${eventsWithoutSheets})`}
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
              <button
                onClick={refreshEvents}
                disabled={refreshing}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid rgba(68, 255, 210, 0.3)',
                  backgroundColor: refreshing ? 'rgba(68, 255, 210, 0.1)' : 'var(--dark-surface)',
                  color: 'var(--accent)',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: refreshing ? 0.7 : 1
                }}
                onMouseOver={(e) => {
                  if (!refreshing) {
                    e.target.style.backgroundColor = 'rgba(68, 255, 210, 0.1)';
                    e.target.style.borderColor = 'rgba(68, 255, 210, 0.5)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!refreshing) {
                    e.target.style.backgroundColor = 'var(--dark-surface)';
                    e.target.style.borderColor = 'rgba(68, 255, 210, 0.3)';
                  }
                }}
              >
                <span style={{
                  animation: refreshing ? 'spin 1s linear infinite' : 'none'
                }}>
                  🔄
                </span>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
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
              className="mobile-event-card"
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
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexDirection: 'column',
                gap: '15px'
              }}>
                <div style={{ flex: 1, width: '100%' }}>
                  <h3
                    className="mobile-event-title"
                    style={{
                      margin: '0 0 10px 0',
                      color: 'var(--text-primary)',
                      fontSize: '18px',
                      fontWeight: '600'
                    }}
                  >
                    {event.title}
                  </h3>

                  <div style={{ marginBottom: '8px' }}>
                    <span className="mobile-status-badge">
                      {getStatusBadge(event)}
                    </span>
                    <span
                      className="mobile-hidden"
                      style={{
                        marginLeft: '10px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        fontFamily: 'monospace'
                      }}
                    >
                      Event ID: {event.id}
                    </span>
                  </div>

                  <div
                    className="mobile-event-meta"
                    style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      marginBottom: '8px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '15px'
                    }}
                  >
                    <span>📅 {new Date(event.start_date).toLocaleDateString()}</span>
                    <span>📍 {event.location || 'No location'}</span>
                    <span>👥 {event.participation_type || 'individual'}</span>
                  </div>

                  {getSyncStatus(event) && (
                    <div className="mobile-sync-status" style={{ marginBottom: '8px' }}>
                      {getSyncStatus(event)}
                    </div>
                  )}

                  {event.google_sheet_id && (
                    <div
                      className="mobile-hidden"
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        fontFamily: 'monospace',
                        backgroundColor: 'rgba(110, 68, 255, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}
                    >
                      Sheet ID: {event.google_sheet_id}
                    </div>
                  )}

                  {/* Mobile compact info */}
                  {event.google_sheet_id && (
                    <div className="mobile-compact-info" style={{ display: 'none' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Sheet created • ID: {event.google_sheet_id.substring(0, 8)}...
                      </div>
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
                  <div
                    className="mobile-buttons-container"
                    style={{
                      display: 'flex',
                      gap: '10px',
                      flexDirection: 'row',
                      width: '100%',
                      justifyContent: 'flex-end'
                    }}
                  >
                    <button
                      className="mobile-button"
                      onClick={() => syncAndOpenSheet(event)}
                      disabled={syncingSheets.has(event.id)}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: syncingSheets.has(event.id)
                          ? 'rgba(68, 255, 210, 0.3)'
                          : 'var(--accent)',
                        color: syncingSheets.has(event.id)
                          ? 'var(--text-secondary)'
                          : 'var(--dark-bg)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: syncingSheets.has(event.id) ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        opacity: syncingSheets.has(event.id) ? 0.7 : 1
                      }}
                      onMouseOver={(e) => {
                        if (!syncingSheets.has(event.id)) {
                          e.target.style.backgroundColor = 'var(--primary)';
                          e.target.style.color = 'white';
                          e.target.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!syncingSheets.has(event.id)) {
                          e.target.style.backgroundColor = 'var(--accent)';
                          e.target.style.color = 'var(--dark-bg)';
                          e.target.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      {syncingSheets.has(event.id) ? (
                        <>
                          <span style={{
                            animation: 'spin 1s linear infinite'
                          }}>
                            🔄
                          </span>
                          Syncing...
                        </>
                      ) : (
                        <>
                          📊 Sync & Open
                        </>
                      )}
                    </button>

                    <button
                      className="mobile-button"
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
      <div
        className="mobile-hidden"
        style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: 'var(--dark-surface)',
          borderRadius: '12px',
          border: '1px solid rgba(68, 255, 210, 0.2)',
          boxShadow: '0 4px 20px rgba(68, 255, 210, 0.1)'
        }}
      >
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
          <li><strong style={{ color: 'var(--text-primary)' }}>Auto-Sync:</strong> Clicking "Sync & Open" updates the sheet with latest data before opening</li>
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

      {/* Mobile Help Section - Compact */}
      <div
        style={{
          marginTop: '15px',
          padding: '12px',
          backgroundColor: 'rgba(68, 255, 210, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(68, 255, 210, 0.1)',
          display: 'none'
        }}
        className="mobile-compact-help"
      >
        <div style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          textAlign: 'center'
        }}>
          💡 <strong style={{ color: 'var(--accent)' }}>Tip:</strong> Sheets auto-sync when you register, mark attendance, or verify payments
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default AutoCreatedSheetsViewer;
