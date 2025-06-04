import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import adminService from '../services/adminService';
import clubService from '../services/clubService';
import eventService from '../services/eventService';
import { logoutAndRedirect, navigateToHome } from '../utils/navigation';
import AdminClubDetails from './AdminClubDetails';
import AdminEventDetails from './AdminEventDetails';
import AutoCreatedSheetsViewer from './AutoCreatedSheetsViewer';
import DataPipelineDashboard from './DataPipelineDashboard';

import logger from '../utils/logger';
export default function AdminDashboard({ setCurrentPage }) {
  const { user, isAdmin, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [clubRequests, setClubRequests] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state for creating a new club
  const [newClubForm, setNewClubForm] = useState({
    email: '',
    password: '',
    name: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    logo_url: ''
  });

  // Selected request for approval
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Selected club and event for details view
  const [selectedClubId, setSelectedClubId] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        if (activeTab === 'requests') {
          try {
            const requests = await adminService.getClubRequests();
            setClubRequests(requests || []);
          } catch (requestErr) {
            logger.error('Error loading club requests:', requestErr);
            setClubRequests([]);
            setError('Failed to load club requests. This might be due to a database policy issue.');
          }
        } else if (activeTab === 'clubs') {
          try {
            const clubsList = await clubService.getAllClubs();
            setClubs(clubsList || []);
          } catch (clubsErr) {
            logger.error('Error loading clubs:', clubsErr);
            setClubs([]);
            setError('Failed to load clubs. Please try again later.');
          }
        } else if (activeTab === 'events') {
          try {
            const eventsList = await adminService.getAllEvents();
            setEvents(eventsList || []);
          } catch (eventsErr) {
            logger.error('Error loading events:', eventsErr);
            setEvents([]);
            setError('Failed to load events. Please try again later.');
          }
        }
      } catch (err) {
        logger.error(`General error loading ${activeTab}:`, err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClubForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle club creation
  const handleCreateClub = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validate form
      if (!newClubForm.email || !newClubForm.password || !newClubForm.name) {
        throw new Error('Please fill in all required fields');
      }

      // Create club account
      const result = await adminService.createClubAccount(
        newClubForm.email,
        newClubForm.password,
        {
          name: newClubForm.name,
          description: newClubForm.description,
          contact_email: newClubForm.contact_email,
          contact_phone: newClubForm.contact_phone,
          website: newClubForm.website,
          logo_url: newClubForm.logo_url
        }
      );

      if (result.success) {
        setSuccess(`Club account created successfully for ${newClubForm.name}`);

        // Reset form
        setNewClubForm({
          email: '',
          password: '',
          name: '',
          description: '',
          contact_email: '',
          contact_phone: '',
          website: '',
          logo_url: ''
        });

        // Refresh clubs list if on clubs tab
        if (activeTab === 'clubs') {
          const clubsList = await clubService.getAllClubs();
          setClubs(clubsList);
        }
      }
    } catch (err) {
      logger.error('Error creating club account:', err);
      setError(err.message || 'Failed to create club account');
    } finally {
      setLoading(false);
    }
  };

  // Handle request approval
  const handleApproveRequest = async (request) => {
    setSelectedRequest(request);
  };

  // Confirm request approval
  const confirmApproval = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (!selectedRequest) return;

      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8);

      // Approve request and create account
      const result = await adminService.approveClubRequest(
        selectedRequest.id,
        selectedRequest.contact_email,
        tempPassword,
        {
          name: selectedRequest.club_name,
          description: selectedRequest.description,
          contact_email: selectedRequest.contact_email,
          contact_phone: selectedRequest.contact_phone,
          logo_url: selectedRequest.logo_url || null
        }
      );

      if (result.success) {
        // Use the password from the result if available, otherwise use the generated one
        const displayPassword = result.tempPassword || tempPassword;

        setSuccess(`Club account created successfully for ${selectedRequest.club_name}. Temporary password: ${displayPassword}`);

        // Refresh requests list
        try {
          const requests = await adminService.getClubRequests();
          setClubRequests(requests);
        } catch (refreshErr) {
          logger.error('Error refreshing requests:', refreshErr);
          // Don't show an error for this, as the main operation succeeded
        }

        // Clear selected request
        setSelectedRequest(null);
      }
    } catch (err) {
      logger.error('Error approving request:', err);
      setError(err.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  // Handle request rejection
  const handleRejectRequest = async (requestId) => {
    try {
      setLoading(true);
      setError('');

      // Reject request
      await adminService.rejectClubRequest(requestId, 'Request rejected by administrator');

      // Refresh requests list
      const requests = await adminService.getClubRequests();
      setClubRequests(requests);

      setSuccess('Request rejected successfully');
    } catch (err) {
      logger.error('Error rejecting request:', err);
      setError(err.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  // Handle featuring/unfeaturing an event
  const handleToggleFeature = async (eventId, currentStatus) => {
    try {
      setLoading(true);

      // Toggle featured status
      await adminService.toggleEventFeatured(eventId, !currentStatus);

      // Refresh events list
      const eventsList = await adminService.getAllEvents();
      setEvents(eventsList);

      setSuccess(`Event ${currentStatus ? 'unfeatured' : 'featured'} successfully`);
    } catch (err) {
      logger.error('Error toggling event feature status:', err);
      setError(err.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  // If not admin, check if it's your specific email
  if (!isAdmin && user?.email !== 'dhrubagarwala67@gmail.com') {
    return (
      <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You must be an administrator to access this page.</p>
        <button
          className="btn btn-primary"
          onClick={() => navigateToHome(setCurrentPage)}
          style={{ marginTop: '1rem' }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard" style={{ minHeight: '100vh', backgroundColor: 'var(--dark-bg)', padding: '2rem 0' }}>
      <div className="container">
        {/* Dashboard Header */}
        <div
          className="admin-dashboard-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem',
            backgroundColor: 'var(--dark-surface)',
            padding: '1.5rem',
            borderRadius: '10px'
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>Manage clubs, events, and more</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => logoutAndRedirect(signOut)}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
              padding: '0.5rem 1.5rem',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
            Logout
          </button>
        </div>

        {/* Success and Error Messages */}
        {success && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'rgba(46, 204, 113, 0.1)',
              borderLeft: '4px solid #2ecc71',
              marginBottom: '1.5rem',
              color: '#2ecc71'
            }}
          >
            {success}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              borderLeft: '4px solid #ff0033',
              marginBottom: '1.5rem',
              color: '#ff0033'
            }}
          >
            {error}
          </div>
        )}

        {/* Dashboard Tabs */}
        <div
          className="admin-dashboard-tabs"
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '2rem'
          }}
        >
          <button
            className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'requests' ? 'var(--dark-surface)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'requests' ? '2px solid var(--primary)' : 'none',
              color: activeTab === 'requests' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'requests' ? '600' : '400'
            }}
          >
            Club Requests
          </button>
          <button
            className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'create' ? 'var(--dark-surface)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'create' ? '2px solid var(--primary)' : 'none',
              color: activeTab === 'create' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'create' ? '600' : '400'
            }}
          >
            Create Club
          </button>
          <button
            className={`tab-button ${activeTab === 'clubs' ? 'active' : ''}`}
            onClick={() => setActiveTab('clubs')}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'clubs' ? 'var(--dark-surface)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'clubs' ? '2px solid var(--primary)' : 'none',
              color: activeTab === 'clubs' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'clubs' ? '600' : '400'
            }}
          >
            Manage Clubs
          </button>
          <button
            className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
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
            Manage Events
          </button>
          <button
            className={`tab-button ${activeTab === 'sheets' ? 'active' : ''}`}
            onClick={() => setActiveTab('sheets')}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'sheets' ? 'var(--dark-surface)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'sheets' ? '2px solid var(--primary)' : 'none',
              color: activeTab === 'sheets' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'sheets' ? '600' : '400'
            }}
          >
            📊 Google Sheets
          </button>
          <button
            className={`tab-button ${activeTab === 'pipeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('pipeline')}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'pipeline' ? 'var(--dark-surface)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'pipeline' ? '2px solid var(--primary)' : 'none',
              color: activeTab === 'pipeline' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'pipeline' ? '600' : '400'
            }}
          >
            🔄 Data Pipeline
          </button>
        </div>

        {/* Club Requests Tab */}
        {activeTab === 'requests' && (
          <div className="requests-tab">
            <h3>Club Profile Requests</h3>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading requests...</div>
            ) : clubRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'var(--dark-surface)', borderRadius: '8px' }}>
                <p>No pending club requests</p>
              </div>
            ) : (
              <div className="requests-list">
                {clubRequests.map(request => (
                  <div
                    key={request.id}
                    style={{
                      backgroundColor: 'var(--dark-surface)',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      marginBottom: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        {request.logo_url && (
                          <div style={{ marginRight: '1rem', flexShrink: 0 }}>
                            <img
                              src={request.logo_url}
                              alt={request.club_name}
                              style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                              }}
                            />
                          </div>
                        )}
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem' }}>{request.club_name}</h4>
                          <p style={{ margin: '0 0 0.5rem', color: 'var(--text-secondary)' }}>
                            <strong>Contact:</strong> {request.contact_person} ({request.contact_email})
                          </p>
                          {request.contact_phone && (
                            <p style={{ margin: '0 0 0.5rem', color: 'var(--text-secondary)' }}>
                              <strong>Phone:</strong> {request.contact_phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '0.3rem 0.8rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          backgroundColor:
                            request.status === 'pending' ? 'rgba(243, 156, 18, 0.2)' :
                            request.status === 'approved' ? 'rgba(46, 204, 113, 0.2)' :
                            'rgba(231, 76, 60, 0.2)',
                          color:
                            request.status === 'pending' ? '#f39c12' :
                            request.status === 'approved' ? '#2ecc71' :
                            '#e74c3c'
                        }}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>

                    {request.description && (
                      <div style={{ margin: '1rem 0' }}>
                        <p><strong>Description:</strong></p>
                        <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>{request.description}</p>
                      </div>
                    )}

                    {request.additional_info && (
                      <div style={{ margin: '1rem 0' }}>
                        <p><strong>Additional Information:</strong></p>
                        <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>{request.additional_info}</p>
                      </div>
                    )}

                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {request.status === 'pending' && (
                        <>
                          <button
                            className="btn"
                            onClick={() => handleRejectRequest(request.id)}
                            style={{
                              backgroundColor: 'rgba(231, 76, 60, 0.2)',
                              color: '#e74c3c',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Reject
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleApproveRequest(request)}
                            style={{
                              backgroundColor: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Approve
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Approval Confirmation Modal */}
            {selectedRequest && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1000
                }}
              >
                <div
                  style={{
                    backgroundColor: 'var(--dark-surface)',
                    borderRadius: '8px',
                    padding: '2rem',
                    maxWidth: '500px',
                    width: '100%'
                  }}
                >
                  <h3>Approve Club Request</h3>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    {selectedRequest.logo_url && (
                      <div style={{ marginRight: '1rem' }}>
                        <img
                          src={selectedRequest.logo_url}
                          alt={selectedRequest.club_name}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        />
                      </div>
                    )}
                    <div>
                      <p>Are you sure you want to approve the request from <strong>{selectedRequest.club_name}</strong>?</p>
                      <p>This will create a new club account with the following details:</p>
                    </div>
                  </div>

                  <ul>
                    <li><strong>Email:</strong> {selectedRequest.contact_email}</li>
                    <li><strong>Password:</strong> A temporary password will be generated</li>
                    <li><strong>Club Name:</strong> {selectedRequest.club_name}</li>
                    {selectedRequest.logo_url && (
                      <li><strong>Logo:</strong> Included (will be transferred to club profile)</li>
                    )}
                  </ul>

                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                      className="btn"
                      onClick={() => setSelectedRequest(null)}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-primary)',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                                            Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={confirmApproval}
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Confirm Approval
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Club Tab */}
        {activeTab === 'create' && (
          <div className="create-club-tab">
            <h3>Create New Club Account</h3>

            <div
              className="create-club-preview"
              style={{
                backgroundColor: 'var(--dark-surface)',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1rem'
              }}
            >
              {/* Header Section with Logo Preview */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ marginRight: '1rem', flexShrink: 0 }}>
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      {newClubForm.logo_url ? (
                        <img
                          src={newClubForm.logo_url}
                          alt="Club Logo Preview"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span
                        style={{
                          fontSize: '1.5rem',
                          color: 'white',
                          display: newClubForm.logo_url ? 'none' : 'flex'
                        }}
                      >
                        {newClubForm.name ? newClubForm.name.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem' }}>
                      {newClubForm.name || 'New Club'}
                    </h4>
                    <p style={{ margin: '0 0 0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <strong>Login Email:</strong> {newClubForm.email || 'Not specified'}
                    </p>
                    <p style={{ margin: '0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <strong>Contact:</strong> {newClubForm.contact_email || 'Not specified'}
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    padding: '0.3rem 0.8rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    color: '#3498db'
                  }}
                >
                  Draft
                </span>
              </div>

              {/* Description Section */}
              {newClubForm.description && (
                <div style={{ margin: '1rem 0' }}>
                  <p><strong>Description:</strong></p>
                  <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>{newClubForm.description}</p>
                </div>
              )}

              {/* Additional Info Section */}
              <div style={{ margin: '1rem 0' }}>
                <p><strong>Additional Information:</strong></p>
                <div style={{ margin: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {newClubForm.contact_phone && (
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Phone:</strong> {newClubForm.contact_phone}
                    </p>
                  )}
                  {newClubForm.website && (
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Website:</strong> <a href={newClubForm.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{newClubForm.website}</a>
                    </p>
                  )}
                  {!newClubForm.contact_phone && !newClubForm.website && (
                    <p style={{ margin: '0.25rem 0', fontStyle: 'italic' }}>No additional information provided</p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Section */}
            <form onSubmit={handleCreateClub} style={{ backgroundColor: 'var(--dark-surface)', padding: '2rem', borderRadius: '8px' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Account Information</h4>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor="email"
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Email Address <span style={{ color: 'var(--primary)' }}>*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={newClubForm.email}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        fontSize: '1rem'
                      }}
                      placeholder="club@example.com"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor="password"
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Password <span style={{ color: 'var(--primary)' }}>*</span>
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={newClubForm.password}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        fontSize: '1rem'
                      }}
                      placeholder="Enter a secure password"
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginTop: 0 }}>Club Information</h4>
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    htmlFor="name"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Club Name <span style={{ color: 'var(--primary)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newClubForm.name}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter club name"
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label
                    htmlFor="description"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newClubForm.description}
                    onChange={handleInputChange}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                    placeholder="Enter club description"
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor="contact_email"
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Contact Email
                    </label>
                    <input
                      type="email"
                      id="contact_email"
                      name="contact_email"
                      value={newClubForm.contact_email}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        fontSize: '1rem'
                      }}
                      placeholder="Public contact email"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor="contact_phone"
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      id="contact_phone"
                      name="contact_phone"
                      value={newClubForm.contact_phone}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        fontSize: '1rem'
                      }}
                      placeholder="Contact phone number"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor="website"
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={newClubForm.website}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        fontSize: '1rem'
                      }}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor="logo_url"
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Logo URL
                    </label>
                    <input
                      type="url"
                      id="logo_url"
                      name="logo_url"
                      value={newClubForm.logo_url}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        fontSize: '1rem'
                      }}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    // Reset form
                    setNewClubForm({
                      email: '',
                      password: '',
                      name: '',
                      description: '',
                      contact_email: '',
                      contact_phone: '',
                      website: '',
                      logo_url: ''
                    });
                  }}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-primary)',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  {loading ? 'Creating...' : 'Create Club Account'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Manage Clubs Tab */}
        {activeTab === 'clubs' && (
          <div className="clubs-tab">
            <h3>Manage Clubs</h3>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading clubs...</div>
            ) : clubs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'var(--dark-surface)', borderRadius: '8px' }}>
                <p>No clubs found</p>
              </div>
            ) : (
              <div className="clubs-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {clubs.map(club => (
                  <div
                    key={club.id}
                    style={{
                      backgroundColor: 'var(--dark-surface)',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '1rem',
                          overflow: 'hidden'
                        }}
                      >
                        {club.logo_url ? (
                          <img src={club.logo_url} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.5rem' }}>{club.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem' }}>{club.name}</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{club.contact_email}</p>
                      </div>
                    </div>

                    {club.description && (
                      <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', flex: 1 }}>
                        {club.description.length > 100 ? `${club.description.substring(0, 100)}...` : club.description}
                      </p>
                    )}

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="btn"
                        onClick={() => setSelectedClubId(club.id)}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'var(--text-primary)',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
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
        )}

        {/* Manage Events Tab */}
        {activeTab === 'events' && (
          <div className="events-tab">
            <h3>Manage Events</h3>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading events...</div>
            ) : events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'var(--dark-surface)', borderRadius: '8px' }}>
                <p>No events found</p>
              </div>
            ) : (
              <div className="events-list">
                {events.map(event => (
                  <div
                    key={event.id}
                    style={{
                      backgroundColor: 'var(--dark-surface)',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      marginBottom: '1.5rem',
                      display: 'flex',
                      gap: '1.5rem'
                    }}
                  >
                    <div
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}
                    >
                      {event.image_url ? (
                        <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span>{event.title.charAt(0)}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem' }}>{event.title}</h4>
                          <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <strong>Club:</strong> {event.clubs?.name}
                          </p>
                          <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <strong>Date:</strong> {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span
                            style={{
                              padding: '0.3rem 0.8rem',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              backgroundColor:
                                event.status === 'upcoming' ? 'rgba(243, 156, 18, 0.2)' :
                                event.status === 'ongoing' ? 'rgba(46, 204, 113, 0.2)' :
                                event.status === 'completed' ? 'rgba(52, 152, 219, 0.2)' :
                                'rgba(231, 76, 60, 0.2)',
                              color:
                                event.status === 'upcoming' ? '#f39c12' :
                                event.status === 'ongoing' ? '#2ecc71' :
                                event.status === 'completed' ? '#3498db' :
                                '#e74c3c'
                            }}
                          >
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </span>

                          {event.is_featured && (
                            <span
                              style={{
                                padding: '0.3rem 0.8rem',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                backgroundColor: 'rgba(155, 89, 182, 0.2)',
                                color: '#9b59b6'
                              }}
                            >
                              Featured
                            </span>
                          )}
                        </div>
                      </div>

                      <p style={{ margin: '1rem 0', fontSize: '0.9rem' }}>
                        {event.description && event.description.length > 150
                          ? `${event.description.substring(0, 150)}...`
                          : event.description}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          className="btn"
                          onClick={() => handleToggleFeature(event.id, event.is_featured)}
                          style={{
                            backgroundColor: event.is_featured ? 'rgba(231, 76, 60, 0.2)' : 'rgba(155, 89, 182, 0.2)',
                            color: event.is_featured ? '#e74c3c' : '#9b59b6',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          {event.is_featured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button
                          className="btn"
                          onClick={() => setSelectedEventId(event.id)}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: 'var(--text-primary)',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Google Sheets Tab */}
        {activeTab === 'sheets' && (
          <div className="sheets-tab">
            <AutoCreatedSheetsViewer />
          </div>
        )}

        {/* Data Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div className="pipeline-tab">
            <DataPipelineDashboard />
          </div>
        )}
      </div>

      {/* Detail Views */}
      {selectedClubId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{ width: '90%', maxWidth: '1200px', maxHeight: '90vh', overflow: 'auto' }}>
            <AdminClubDetails
              clubId={selectedClubId}
              onBack={() => setSelectedClubId(null)}
              onViewEvent={(eventId) => {
                setSelectedClubId(null);
                setSelectedEventId(eventId);
              }}
            />
          </div>
        </div>
      )}

      {selectedEventId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{ width: '90%', maxWidth: '1200px', maxHeight: '90vh', overflow: 'auto' }}>
            <AdminEventDetails
              eventId={selectedEventId}
              onBack={() => setSelectedEventId(null)}
              onViewClub={(clubId) => {
                setSelectedEventId(null);
                setSelectedClubId(clubId);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

