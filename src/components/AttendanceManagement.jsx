import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import eventService from '../services/eventService';
import registrationService from '../services/registrationService';
import QRScanner from './QRScanner';

/**
 * Attendance Management Component
 * Interface for club members to manage event attendance
 */
const AttendanceManagement = () => {
  const { club } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanResults, setScanResults] = useState([]);
  const [error, setError] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [markingAttendance, setMarkingAttendance] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'individual', 'team'

  // Load club events on component mount
  useEffect(() => {
    if (club?.id) {
      loadClubEvents();
    }
  }, [club]);

  // Load registrations when event is selected
  useEffect(() => {
    if (selectedEvent) {
      loadEventRegistrations();
    }
  }, [selectedEvent]);

  // Load club events
  const loadClubEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Loading events for club:', club);

      if (!club?.id) {
        throw new Error('No club ID available');
      }

      const clubEvents = await eventService.getClubEvents(club.id);
      console.log('Loaded club events:', clubEvents);

      // Filter for upcoming and ongoing events
      const activeEvents = clubEvents.filter(event =>
        event.status === 'upcoming' || event.status === 'ongoing'
      );

      console.log('Active events for attendance:', activeEvents);
      setEvents(activeEvents);

      if (activeEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(activeEvents[0]);
      }
    } catch (err) {
      console.error('Error loading club events:', err);
      setError(`Failed to load events: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load registrations for selected event
  const loadEventRegistrations = async () => {
    if (!selectedEvent) return;

    try {
      setIsLoading(true);

      const eventRegistrations = await registrationService.getEventRegistrations(selectedEvent.id);
      setRegistrations(eventRegistrations);

      // Calculate attendance statistics
      const stats = {
        total: eventRegistrations.length,
        attended: eventRegistrations.filter(r => r.attendance_status === 'attended').length,
        notAttended: eventRegistrations.filter(r => r.attendance_status === 'not_attended').length,
        attendanceRate: eventRegistrations.length > 0
          ? Math.round((eventRegistrations.filter(r => r.attendance_status === 'attended').length / eventRegistrations.length) * 100)
          : 0
      };

      setAttendanceStats(stats);
    } catch (err) {
      console.error('Error loading event registrations:', err);
      setError('Failed to load registrations');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle QR scan result
  const handleScanResult = (result) => {
    if (result.success) {
      // Add to scan results
      setScanResults(prev => [{
        id: Date.now(),
        timestamp: new Date().toISOString(),
        participantName: result.participantName,
        eventTitle: result.eventTitle,
        success: true
      }, ...prev.slice(0, 9)]); // Keep last 10 results

      // Add to recent activity
      setRecentActivity(prev => [{
        id: Date.now(),
        timestamp: new Date().toISOString(),
        participantName: result.participantName,
        action: 'QR code scanned',
        type: 'qr_scan'
      }, ...prev.slice(0, 9)]); // Keep last 10 activities

      // Show success message
      setSuccessMessage(`✅ ${result.participantName} attendance marked via QR scan!`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reload registrations to update attendance status
      loadEventRegistrations();
    }
  };

  // Manual attendance marking
  const markAttendanceManually = async (registrationId) => {
    try {
      setMarkingAttendance(registrationId);
      setError(null);

      // Find the registration to get participant details
      const registration = registrations.find(r => r.id === registrationId);

      // Use the registration service to update attendance status properly
      const result = await registrationService.updateAttendanceStatus(registrationId, 'attended');

      if (result) {
        // Add to recent activity
        setRecentActivity(prev => [{
          id: Date.now(),
          timestamp: new Date().toISOString(),
          participantName: registration?.participant_name || 'Unknown',
          action: 'Manually marked present',
          type: 'manual'
        }, ...prev.slice(0, 9)]); // Keep last 10 activities

        // Show success message
        setSuccessMessage(`✅ ${registration?.participant_name || 'Participant'} marked as present!`);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);

        // Reload registrations to update the UI
        loadEventRegistrations();
      } else {
        setError('Failed to mark attendance');
      }
    } catch (err) {
      console.error('Error marking attendance manually:', err);
      setError('Failed to mark attendance');
    } finally {
      setMarkingAttendance(null);
    }
  };

  // Show loading only when initially loading and no club data
  if (!club) {
    return (
      <div className="attendance-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading club data...</p>
        </div>
      </div>
    );
  }

  // Show loading when loading events
  if (isLoading && events.length === 0) {
    return (
      <div className="attendance-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-management">
      <div className="attendance-header">
        <h2>📊 Attendance Management</h2>
        <p>Scan QR codes or manually mark attendance for your events</p>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          <span className="success-icon">🎉</span>
          {successMessage}
          <button onClick={() => setSuccessMessage(null)}>✕</button>
        </div>
      )}

      {events.length === 0 ? (
        <div className="no-events">
          <div className="no-events-icon">📅</div>
          <h3>No Active Events</h3>
          <p>You don't have any upcoming or ongoing events for attendance tracking.</p>
        </div>
      ) : (
        <>
          {/* Event Selection */}
          <div className="event-selection">
            <label htmlFor="event-select">Select Event:</label>
            <select
              id="event-select"
              value={selectedEvent?.id || ''}
              onChange={(e) => {
                const event = events.find(ev => ev.id === e.target.value);
                setSelectedEvent(event);
              }}
            >
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title} - {new Date(event.start_date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <>
              {/* Attendance Statistics */}
              {attendanceStats && (
                <div className="attendance-stats">
                  <h3>📊 Attendance Statistics</h3>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-number">{attendanceStats.total}</div>
                      <div className="stat-label">Total Registered</div>
                    </div>
                    <div className="stat-card success">
                      <div className="stat-number">{attendanceStats.attended}</div>
                      <div className="stat-label">Attended</div>
                    </div>
                    <div className="stat-card pending">
                      <div className="stat-number">{attendanceStats.notAttended}</div>
                      <div className="stat-label">Not Attended</div>
                    </div>
                    <div className="stat-card rate">
                      <div className="stat-number">{attendanceStats.attendanceRate}%</div>
                      <div className="stat-label">Attendance Rate</div>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Scanner Controls */}
              <div className="scanner-controls">
                <button
                  className="qr-scan-button"
                  onClick={() => {
                    if (!selectedEvent?.id) {
                      setError('Please select an event first before scanning QR codes.');
                      return;
                    }
                    setShowQRScanner(true);
                  }}
                  disabled={!selectedEvent?.id}
                >
                  📱 Scan QR Code
                </button>

                {(scanResults.length > 0 || recentActivity.length > 0) && (
                  <div className="recent-activity">
                    <h4>📋 Recent Activity:</h4>
                    <div className="activity-list">
                      {recentActivity.slice(0, 5).map(activity => (
                        <div key={activity.id} className={`activity-item ${activity.type}`}>
                          <span className="activity-icon">
                            {activity.type === 'qr_scan' ? '📱' : '👤'}
                          </span>
                          <div className="activity-details">
                            <span className="activity-name">{activity.participantName}</span>
                            <span className="activity-action">{activity.action}</span>
                          </div>
                          <span className="activity-time">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Registrations List */}
              <div className="registrations-section">
                <div className="registrations-header">
                  <h3>👥 Registered Participants</h3>

                  {/* Search and Filter Controls */}
                  <div className="search-filter-controls">
                    <div className="search-box">
                      <input
                        type="text"
                        placeholder="Search by name, email, ID, or department..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                      />
                      <span className="search-icon">🔍</span>
                    </div>

                    <div className="filter-buttons">
                      <button
                        className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterType('all')}
                      >
                        All ({registrations.length})
                      </button>
                      <button
                        className={`filter-btn ${filterType === 'individual' ? 'active' : ''}`}
                        onClick={() => setFilterType('individual')}
                      >
                        Individual ({registrations.filter(r => !r.additional_info?.team_members?.length).length})
                      </button>
                      <button
                        className={`filter-btn ${filterType === 'team' ? 'active' : ''}`}
                        onClick={() => setFilterType('team')}
                      >
                        Team ({registrations.filter(r => r.additional_info?.team_members?.length > 0).length})
                      </button>
                    </div>
                  </div>
                </div>

                {(() => {
                  // Filter registrations based on search term and filter type
                  const filteredRegistrations = registrations.filter(registration => {
                    // Search filter
                    const matchesSearch = searchTerm === '' ||
                      registration.participant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      registration.participant_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      registration.participant_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      registration.additional_info?.department?.toLowerCase().includes(searchTerm.toLowerCase());

                    // Type filter
                    const isTeamRegistration = registration.additional_info?.team_members &&
                                              registration.additional_info.team_members.length > 0;

                    let matchesType = true;
                    if (filterType === 'individual') {
                      matchesType = !isTeamRegistration;
                    } else if (filterType === 'team') {
                      matchesType = isTeamRegistration;
                    }

                    return matchesSearch && matchesType;
                  });

                  return filteredRegistrations.length === 0 ? (
                    <div className="no-registrations">
                      {searchTerm || filterType !== 'all' ? (
                        <p>No participants found matching your search criteria.</p>
                      ) : (
                        <p>No registrations found for this event.</p>
                      )}
                    </div>
                  ) : (
                    <div className="registrations-list">
                      {filteredRegistrations.map(registration => (
                      <div
                        key={registration.id}
                        className={`registration-item ${registration.attendance_status}`}
                      >
                        <div className="participant-info">
                          <div className="participant-name">
                            {registration.participant_name}
                          </div>
                          <div className="participant-details">
                            {registration.participant_email} • {registration.participant_id}
                          </div>
                        </div>

                        <div className="attendance-info">
                          <div className={`attendance-status ${registration.attendance_status}`}>
                            {registration.attendance_status === 'attended' ? (
                              <>
                                <span className="status-icon">✅</span>
                                <span>Attended</span>
                                {registration.attendance_timestamp && (
                                  <div className="attendance-time">
                                    {new Date(registration.attendance_timestamp).toLocaleString()}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="status-icon">⏳</span>
                                <span>Not Attended</span>
                                <button
                                  className="mark-attendance-button"
                                  onClick={() => markAttendanceManually(registration.id)}
                                  disabled={markingAttendance === registration.id}
                                >
                                  {markingAttendance === registration.id ? (
                                    <>
                                      <span className="loading-spinner"></span>
                                      Marking...
                                    </>
                                  ) : (
                                    'Mark Present'
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          eventId={selectedEvent?.id}
          onScanResult={handleScanResult}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      <style jsx>{`
        .attendance-management {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: var(--dark-bg, #050505);
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
          min-height: 100vh;
        }

        .attendance-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .attendance-header h2 {
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
          margin-bottom: 10px;
          font-size: 2.5rem;
          font-weight: 700;
          text-shadow:
            0 0 20px rgba(110, 68, 255, 0.8),
            0 0 40px rgba(255, 68, 227, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
        }



        .attendance-header p {
          color: var(--text-secondary, rgba(255, 255, 255, 0.8));
          font-size: 1.1rem;
          font-weight: 400;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .loading-container {
          text-align: center;
          padding: 50px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--dark-surface, #111111);
          border-top: 4px solid var(--primary, #6e44ff);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          display: inline-block;
          margin-right: 8px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid rgba(220, 53, 69, 0.3);
          color: #ff6b6b;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .success-message {
          background: rgba(40, 167, 69, 0.1);
          border: 1px solid rgba(40, 167, 69, 0.3);
          color: var(--accent, #44ffd2);
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .error-icon, .success-icon {
          margin-right: 10px;
        }

        .no-events {
          text-align: center;
          padding: 50px;
          background: var(--dark-surface, #111111);
          border-radius: 12px;
          border: 1px solid rgba(110, 68, 255, 0.2);
        }

        .no-events-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .no-events h3 {
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
          margin-bottom: 10px;
        }

        .no-events p {
          color: var(--text-secondary, rgba(255, 255, 255, 0.6));
        }

        .event-selection {
          margin-bottom: 30px;
        }

        .event-selection label {
          display: block;
          margin-bottom: 8px;
          font-weight: bold;
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
        }

        .event-selection select {
          width: 100%;
          padding: 12px;
          border: 1px solid rgba(110, 68, 255, 0.3);
          border-radius: 8px;
          font-size: 16px;
          background: var(--dark-surface, #111111);
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
          transition: border-color 0.3s ease;
        }

        .event-selection select:focus {
          outline: none;
          border-color: var(--primary, #6e44ff);
          box-shadow: 0 0 0 2px rgba(110, 68, 255, 0.2);
        }

        .attendance-stats {
          background: var(--dark-surface, #111111);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
          border: 1px solid rgba(110, 68, 255, 0.2);
        }

        .attendance-stats h3 {
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
          margin-bottom: 15px;
        }

        /* Mobile optimization for attendance stats section */
        @media (max-width: 768px) {
          .attendance-stats {
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 8px;
          }

          .attendance-stats h3 {
            font-size: 1.1rem;
            margin-bottom: 10px;
          }
        }

        @media (max-width: 480px) {
          .attendance-stats {
            padding: 12px;
            margin-bottom: 15px;
            border-radius: 6px;
          }

          .attendance-stats h3 {
            font-size: 1rem;
            margin-bottom: 8px;
          }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 15px;
        }

        .stat-card {
          background: rgba(110, 68, 255, 0.1);
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          border-left: 4px solid var(--primary, #6e44ff);
          transition: transform 0.2s ease;
        }

        /* Mobile optimization for stats */
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-top: 12px;
          }

          .stat-card {
            padding: 12px 8px;
            border-radius: 8px;
            border-left-width: 3px;
          }

          .stat-number {
            font-size: 24px !important;
          }

          .stat-label {
            font-size: 12px;
            margin-top: 3px !important;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-top: 10px;
          }

          .stat-card {
            padding: 10px 6px;
            border-radius: 6px;
            border-left-width: 2px;
          }

          .stat-number {
            font-size: 20px !important;
          }

          .stat-label {
            font-size: 11px;
            margin-top: 2px !important;
          }
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-card.success {
          border-left-color: var(--accent, #44ffd2);
          background: rgba(68, 255, 210, 0.1);
        }

        .stat-card.pending {
          border-left-color: #ffc107;
          background: rgba(255, 193, 7, 0.1);
        }

        .stat-card.rate {
          border-left-color: var(--secondary, #ff44e3);
          background: rgba(255, 68, 227, 0.1);
        }

        .stat-number {
          font-size: 32px;
          font-weight: bold;
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
        }

        .stat-label {
          color: var(--text-secondary, rgba(255, 255, 255, 0.6));
          margin-top: 5px;
        }

        .scanner-controls {
          background: var(--dark-surface, #111111);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
          border: 1px solid rgba(110, 68, 255, 0.2);
        }

        .qr-scan-button {
          background: linear-gradient(135deg, var(--primary, #6e44ff), var(--secondary, #ff44e3));
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .qr-scan-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(110, 68, 255, 0.3);
        }

        .qr-scan-button:before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .qr-scan-button:hover:before {
          left: 100%;
        }

        .qr-scan-button:disabled {
          background: rgba(110, 68, 255, 0.3);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .qr-scan-button:disabled:hover {
          transform: none;
          box-shadow: none;
        }

        .qr-scan-button:disabled:before {
          display: none;
        }

        .recent-activity {
          margin-top: 20px;
        }

        .recent-activity h4 {
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
          margin-bottom: 15px;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 10px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(68, 255, 210, 0.1);
          border-radius: 8px;
          border-left: 3px solid var(--accent, #44ffd2);
          transition: transform 0.2s ease;
        }

        .activity-item:hover {
          transform: translateX(5px);
        }

        .activity-item.manual {
          background: rgba(255, 68, 227, 0.1);
          border-left-color: var(--secondary, #ff44e3);
        }

        .activity-icon {
          font-size: 18px;
        }

        .activity-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .activity-name {
          font-weight: 600;
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
        }

        .activity-action {
          font-size: 12px;
          color: var(--text-secondary, rgba(255, 255, 255, 0.6));
        }

        .activity-time {
          font-size: 12px;
          color: var(--text-secondary, rgba(255, 255, 255, 0.6));
        }

        .registrations-section {
          background: var(--dark-surface, #111111);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(110, 68, 255, 0.2);
        }

        .registrations-section h3 {
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
          margin-bottom: 15px;
        }

        .registrations-header {
          margin-bottom: 20px;
        }

        .search-filter-controls {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 20px;
        }

        .search-box {
          position: relative;
          flex: 1;
        }

        .search-input {
          width: 100%;
          padding: 12px 45px 12px 15px;
          border: 1px solid rgba(110, 68, 255, 0.3);
          border-radius: 8px;
          background: var(--dark-bg, #050505);
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary, #6e44ff);
          box-shadow: 0 0 0 2px rgba(110, 68, 255, 0.2);
        }

        .search-input::placeholder {
          color: var(--text-secondary, rgba(255, 255, 255, 0.6));
        }

        .search-icon {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary, rgba(255, 255, 255, 0.6));
          pointer-events: none;
        }

        .filter-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 8px 16px;
          border: 1px solid rgba(110, 68, 255, 0.3);
          border-radius: 20px;
          background: transparent;
          color: var(--text-secondary, rgba(255, 255, 255, 0.6));
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          font-weight: 500;
        }

        .filter-btn:hover {
          border-color: var(--primary, #6e44ff);
          color: var(--primary, #6e44ff);
          transform: translateY(-1px);
        }

        .filter-btn.active {
          background: var(--primary, #6e44ff);
          color: white;
          border-color: var(--primary, #6e44ff);
          box-shadow: 0 2px 8px rgba(110, 68, 255, 0.3);
        }

        .no-registrations {
          text-align: center;
          padding: 30px;
          color: var(--text-secondary, rgba(255, 255, 255, 0.6));
        }

        .registrations-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-top: 15px;
        }

        .registration-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border: 1px solid rgba(110, 68, 255, 0.2);
          border-radius: 8px;
          transition: all 0.2s ease;
          background: rgba(110, 68, 255, 0.05);
        }

        .registration-item:hover {
          transform: translateY(-1px);
          border-color: rgba(110, 68, 255, 0.4);
        }

        .registration-item.attended {
          background: rgba(68, 255, 210, 0.1);
          border-color: var(--accent, #44ffd2);
        }

        .registration-item.not_attended {
          background: rgba(255, 193, 7, 0.1);
          border-color: #ffc107;
        }

        .participant-name {
          font-weight: bold;
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
        }

        .participant-details {
          color: var(--text-secondary, rgba(255, 255, 255, 0.6));
          font-size: 14px;
          margin-top: 5px;
        }

        .attendance-status {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-direction: column;
          align-items: flex-end;
        }

        .attendance-status.attended {
          color: var(--accent, #44ffd2);
        }

        .attendance-status.not_attended {
          color: #ffc107;
        }

        .attendance-time {
          font-size: 12px;
          color: var(--text-secondary, rgba(255, 255, 255, 0.6));
          margin-top: 5px;
        }

        .mark-attendance-button {
          background: linear-gradient(135deg, var(--accent, #44ffd2), var(--primary, #6e44ff));
          color: #000;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          margin-left: 10px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .mark-attendance-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(68, 255, 210, 0.3);
        }

        .mark-attendance-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        @media (min-width: 768px) {
          .search-filter-controls {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }

          .search-box {
            max-width: 400px;
          }
        }

        @media (max-width: 768px) {
          .attendance-management {
            padding: 15px;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .registration-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .filter-buttons {
            justify-content: center;
          }

          .filter-btn {
            flex: 1;
            min-width: 0;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AttendanceManagement;
