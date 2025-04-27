import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import eventService from '../services/eventService';
import registrationService from '../services/registrationService';
import { format } from 'date-fns';
import { logoutAndRedirect, navigateToHome } from '../utils/navigation';
import ClubProfileEditor from './ClubProfileEditor';
import EventEditor from './EventEditor';
import RegistrationDetails from './RegistrationDetails';
import CustomSelect from './CustomSelect';
import MultiSelect from './MultiSelect';

const ClubDashboard = ({ setCurrentPage, setIsClubLoggedIn }) => {
  const { club, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '18:00',
    location: '',
    max_participants: '',
    registration_deadline: '',
    status: 'upcoming',
    category_id: '',
    registration_method: 'internal',
    external_form_url: '',
    additional_info: {
      schedule: [
        {
          day: 'Day 1',
          events: [
            { time: '09:00', title: 'Opening Ceremony', location: '' }
          ]
        }
      ]
    }
  });
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [selectedRegistration, setSelectedRegistration] = useState(null);

  // Load club events
  const loadClubEvents = async () => {
    if (!club) return;

    // Create a variable to track if the operation was canceled
    let isCanceled = false;

    // Set a timeout to cancel the operation if it takes too long
    const timeoutId = setTimeout(() => {
      isCanceled = true;
      console.warn('Loading club events timed out');
      setError('Loading events is taking longer than expected. Please refresh the page.');
      setIsLoading(false);
    }, 10000); // 10 seconds timeout

    try {
      setIsLoading(true);
      setError(null);

      const eventsData = await eventService.getClubEvents(club.id);

      // Only update state if the operation wasn't canceled
      if (!isCanceled) {
        setEvents(eventsData || []);
        clearTimeout(timeoutId); // Clear the timeout since we got the data
      }
    } catch (err) {
      console.error('Error loading club events:', err);

      // Only update state if the operation wasn't canceled
      if (!isCanceled) {
        setError('Failed to load events. Please try again.');
        clearTimeout(timeoutId); // Clear the timeout since we got an error
      }
    } finally {
      // Only update state if the operation wasn't canceled
      if (!isCanceled) {
        setIsLoading(false);
        clearTimeout(timeoutId); // Clear the timeout as a safety measure
      }
    }
  };

  // Load data when component mounts or when returning to the dashboard
  useEffect(() => {
    // Create a flag to track if the component is mounted
    let isMounted = true;

    const loadData = async () => {
      if (!club) return;

      // Only set loading state if the component is still mounted
      if (isMounted) {
        setIsLoading(true);
        setError(null);
      }

      try {
        // Load categories
        const categoriesData = await eventService.getCategories();

        // Only update state if the component is still mounted
        if (isMounted) {
          setCategories(categoriesData || []);

          // Set default category if available
          if (categoriesData && categoriesData.length > 0 && !newEvent.category_id) {
            setNewEvent(prev => ({
              ...prev,
              category_id: categoriesData[0].id
            }));
          }
        }

        // Load club events
        const eventsData = await eventService.getClubEvents(club.id);

        // Only update state if the component is still mounted
        if (isMounted) {
          setEvents(eventsData || []);
        }

        // If an event is selected, load its registrations
        if (selectedEvent && isMounted) {
          const registrationsData = await registrationService.getEventRegistrations(selectedEvent.id);

          // Only update state if the component is still mounted
          if (isMounted) {
            setRegistrations(registrationsData || []);
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);

        // Only update state if the component is still mounted
        if (isMounted) {
          setError('Failed to load data. Please try again.');
        }
      } finally {
        // Only update state if the component is still mounted
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    // Cleanup function to set the mounted flag to false when the component unmounts
    return () => {
      isMounted = false;
    };
  }, [club, selectedEvent]);

  // Filter events based on search term and status
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get registrations for a specific event
  const loadEventRegistrations = async (eventId) => {
    // Create a variable to track if the operation was canceled
    let isCanceled = false;

    // Set a timeout to cancel the operation if it takes too long
    const timeoutId = setTimeout(() => {
      isCanceled = true;
      console.warn('Loading registrations timed out');
      setError('Loading registrations is taking longer than expected. Please try again.');
      setIsLoading(false);
    }, 10000); // 10 seconds timeout

    try {
      setIsLoading(true);
      setError(null);

      // Make sure eventId is valid
      if (!eventId) {
        throw new Error('Invalid event ID');
      }

      // Find the event in the events list
      const event = events.find(e => e.id === eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Load registrations
      const registrationsData = await registrationService.getEventRegistrations(eventId);

      // Only update state if the operation wasn't canceled
      if (!isCanceled) {
        setRegistrations(registrationsData || []);
        setSelectedEvent(event);
        setActiveTab('registrations');
        clearTimeout(timeoutId); // Clear the timeout since we got the data
      }
    } catch (err) {
      console.error('Error loading registrations:', err);

      // Only update state if the operation wasn't canceled
      if (!isCanceled) {
        setError('Failed to load registrations: ' + (err.message || 'Unknown error'));
        setRegistrations([]);
        clearTimeout(timeoutId); // Clear the timeout since we got an error
      }
    } finally {
      // Only update state if the operation wasn't canceled
      if (!isCanceled) {
        setIsLoading(false);
        clearTimeout(timeoutId); // Clear the timeout as a safety measure
      }
    }
  };

  // Handle form input change for new event
  const handleNewEventChange = (e) => {
    const { name, value, type } = e.target;

    // Handle different input types appropriately
    if (type === 'number') {
      setNewEvent(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else if (type === 'checkbox') {
      setNewEvent(prev => ({
        ...prev,
        [name]: e.target.checked
      }));
    } else {
      setNewEvent(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle event creation
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess('');

    try {
      // Validate form
      if (!newEvent.title || !newEvent.start_date || !newEvent.end_date || !newEvent.location || !newEvent.category_id) {
        throw new Error('Please fill in all required fields');
      }

      if (newEvent.registration_method === 'external' && !newEvent.external_form_url) {
        throw new Error('Please provide an external form URL');
      }

      // Combine date and time
      const startDateTime = new Date(`${newEvent.start_date}T${newEvent.start_time || '00:00:00'}`);
      const endDateTime = new Date(`${newEvent.end_date}T${newEvent.end_time || '23:59:59'}`);

      // Validate dates
      if (endDateTime <= startDateTime) {
        throw new Error('End date must be after start date');
      }

      // Prepare event data
      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        location: newEvent.location,
        max_participants: newEvent.max_participants ? parseInt(newEvent.max_participants) : null,
        registration_deadline: newEvent.registration_deadline ? new Date(`${newEvent.registration_deadline}T23:59:59`).toISOString() : null,
        status: 'upcoming',
        club_id: club.id,
        category_id: newEvent.category_id,
        registration_method: newEvent.registration_method || 'internal',
        external_form_url: newEvent.external_form_url || null,
        image_url: newEvent.image_url || null,
        additional_info: newEvent.additional_info || null
      };

      console.log('Creating event with data:', eventData);

      // Create the event
      const createdEvent = await eventService.createEvent(eventData);

      // Show success message
      setSuccess('Event created successfully!');

      // Add to events list
      setEvents(prevEvents => [...prevEvents, createdEvent]);

      // Reset form and close creation panel
      setNewEvent({
        title: '',
        description: '',
        start_date: '',
        start_time: '09:00',
        end_date: '',
        end_time: '18:00',
        location: '',
        max_participants: '',
        registration_deadline: '',
        status: 'upcoming',
        category_id: categories.length > 0 ? categories[0].id : '',
        registration_method: 'internal',
        external_form_url: '',
        image_url: '',
        additional_info: {
          schedule: [
            {
              day: 'Day 1',
              events: [
                { time: '09:00', title: 'Opening Ceremony', location: '' }
              ]
            }
          ]
        }
      });

      // Close panel and refresh events
      setIsCreatingEvent(false);
      loadClubEvents();
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err.message || 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle event deletion
  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        setIsLoading(true);
        await eventService.deleteEvent(eventId);
        setEvents(events.filter(event => event.id !== eventId));
        setError(null);
      } catch (err) {
        console.error('Error deleting event:', err);
        setError('Failed to delete event');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle event status update
  const handleUpdateStatus = async (eventId, newStatus) => {
    try {
      setIsLoading(true);
      const updatedEvent = await eventService.updateEventStatus(eventId, newStatus);
      setEvents(events.map(event =>
        event.id === eventId ? updatedEvent : event
      ));
      setError(null);
    } catch (err) {
      console.error('Error updating event status:', err);
      setError('Failed to update event status');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // First set isClubLoggedIn to false to show the navbar
      setIsClubLoggedIn(false);
      // Set current page to home
      setCurrentPage('home');
      // Then perform the logout and redirect
      await logoutAndRedirect(signOut);
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out');
    }
  };

  // Handle profile update
  const handleProfileUpdate = (updatedClub) => {
    // Update the club context
    // This will be handled by the auth context automatically
    // Just close the editor
    setIsEditingProfile(false);
  };

  // Format date for display
  const formatDate = (dateString, formatStr = 'MMM d, yyyy h:mm a') => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return 'Invalid date';
      }
      return format(date, formatStr);
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Date error';
    }
  };

  // Get event registrations count
  const getRegistrationsCount = (eventId) => {
    return registrations.filter(reg => reg.event_id === eventId).length;
  };

  if (!club) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
        <p>Please log in to access the dashboard</p>
        <button
          className="btn btn-primary"
          onClick={() => navigateToHome(setCurrentPage)}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            padding: '0.5rem 1.5rem',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="club-dashboard" style={{ minHeight: '100vh', backgroundColor: 'var(--dark-bg)', padding: '2rem 0' }}>
      <div className="container">
        {/* Mobile Dashboard Title - Only visible on mobile */}
        <div className="mobile-dashboard-title" style={{
          display: 'none',
          textAlign: 'center',
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--dark-surface)',
          borderRadius: '8px',
          '@media (max-width: 768px)': {
            display: 'block'
          }
        }}>
          <h2 style={{ margin: 0 }}>Club Dashboard</h2>
        </div>

        {/* Error message */}
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

        {/* Loading indicator */}
        {isLoading && (
          <div
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderLeft: '4px solid var(--primary)',
              borderRadius: '4px',
              color: 'var(--text-secondary)',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: '3px solid rgba(255, 255, 255, 0.2)',
                borderTopColor: 'var(--primary)',
                animation: 'spin 1s linear infinite'
              }}
            />
            <style jsx>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            Loading data...
          </div>
        )}

        {/* Profile Editor Modal */}
        {isEditingProfile && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(5px)'
            }}
          >
            <ClubProfileEditor
              onClose={() => setIsEditingProfile(false)}
              onUpdate={handleProfileUpdate}
            />
          </div>
        )}

        {/* Dashboard Header */}
        <div
          className="dashboard-header"
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
          <div className="dashboard-header-content" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                flexShrink: 0
              }}
            >
              {club.logo_url ? (
                <img
                  src={club.logo_url}
                  alt={club.name}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                club.name.charAt(0)
              )}
            </div>
            <div>
              <h2 style={{ margin: 0 }}>{club.name}</h2>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>{club.contact_email || club.email}</p>
            </div>
          </div>
          <div className="dashboard-header-actions" style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="btn"
              onClick={() => setIsEditingProfile(true)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text-primary)',
                padding: '0.5rem 1.5rem',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                justifyContent: 'center'
              }}
            >
              <span>✏️</span> Edit Profile
            </button>
            <button
              className="btn btn-primary"
              onClick={handleLogout}
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
        </div>

        {/* Dashboard Tabs */}
        <div
          className="dashboard-tabs"
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '2rem'
          }}
        >
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
              fontWeight: activeTab === 'events' ? '600' : '400',
              whiteSpace: 'nowrap'
            }}
          >
            Manage Events
          </button>
          <button
            className={`tab-button ${activeTab === 'registrations' ? 'active' : ''}`}
            onClick={() => setActiveTab('registrations')}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'registrations' ? 'var(--dark-surface)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'registrations' ? '2px solid var(--primary)' : 'none',
              color: activeTab === 'registrations' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'registrations' ? '600' : '400',
              whiteSpace: 'nowrap'
            }}
          >
            Track Registrations
          </button>
        </div>

        {/* Events Tab Content */}
        {activeTab === 'events' && (
          <div className="events-tab">
            {/* Events Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}
            >
              <h3>Your Events</h3>
              <button
                className="btn btn-primary"
                onClick={() => setCurrentPage('create-event')}
              >
                Create New Event
              </button>
            </div>

            {/* Events Filters */}
            <div
              className="events-filters"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                backgroundColor: 'var(--dark-surface)',
                padding: '1rem',
                borderRadius: '8px'
              }}
            >
              <div className="events-filters-buttons" style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className={`btn ${statusFilter === 'all' ? 'btn-primary' : ''}`}
                  onClick={() => setStatusFilter('all')}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  All
                </button>
                <button
                  className={`btn ${statusFilter === 'upcoming' ? 'btn-primary' : ''}`}
                  onClick={() => setStatusFilter('upcoming')}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Upcoming
                </button>
                <button
                  className={`btn ${statusFilter === 'ongoing' ? 'btn-primary' : ''}`}
                  onClick={() => setStatusFilter('ongoing')}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Ongoing
                </button>
                <button
                  className={`btn ${statusFilter === 'completed' ? 'btn-primary' : ''}`}
                  onClick={() => setStatusFilter('completed')}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Completed
                </button>
              </div>
              <div className="events-filters-search">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Events List */}
            <div className="events-list">
              {filteredEvents.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '3rem',
                    backgroundColor: 'var(--dark-surface)',
                    borderRadius: '8px'
                  }}
                >
                  <p>No events found. Create your first event!</p>
                </div>
              ) : (
                filteredEvents.map(event => (
                  <div
                    key={event.id}
                    className="event-item"
                    style={{
                      backgroundColor: 'var(--dark-surface)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      marginBottom: '1.5rem',
                      display: 'flex',
                      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <div
                      className="event-image"
                      style={{
                        width: '200px',
                        height: '100%',
                        backgroundImage: `url(${event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    ></div>
                    <div className="event-content" style={{ flex: 1, padding: '1.5rem', position: 'relative' }}>
                      <div
                        style={{
                          position: 'absolute',
                          top: '1rem',
                          right: '1rem',
                          display: 'flex',
                          gap: '0.5rem',
                          zIndex: 5
                        }}
                      >
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '1.2rem'
                          }}
                          onClick={() => handleDeleteEvent(event.id)}
                          title="Delete Event"
                        >
                          🗑️
                        </button>
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '1.2rem'
                          }}
                          onClick={() => {
                            setEventToEdit(event);
                            setIsEditingEvent(true);
                          }}
                          title="Edit Event"
                        >
                          ✏️
                        </button>
                      </div>

                      <div className="event-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 className="event-title" style={{ marginTop: 0, marginBottom: '0.5rem' }}>{event.title}</h3>
                          <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)' }}>
                            {formatDate(event.start_date, 'MMM d, yyyy')} - {formatDate(event.end_date, 'MMM d, yyyy')} • {event.location || 'No location specified'}
                          </p>
                          <p className="event-description" style={{ margin: '0 0 1.5rem' }}>{event.description || 'No description provided'}</p>

                          {event.category && (
                            <span
                              style={{
                                padding: '0.3rem 0.8rem',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: event.categories?.color || 'var(--text-secondary)',
                                marginRight: '0.5rem',
                                display: 'inline-block',
                                marginBottom: '0.5rem'
                              }}
                            >
                              {event.categories?.name || 'Uncategorized'}
                            </span>
                          )}

                          <span
                            style={{
                              padding: '0.3rem 0.8rem',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              color: 'var(--text-secondary)',
                              display: 'inline-block',
                              marginBottom: '0.5rem'
                            }}
                          >
                            {event.registration_method === 'internal' ? 'Internal Registration' :
                             event.registration_method === 'external' ? 'External Form' : 'Both'}
                          </span>
                        </div>
                        <span
                          style={{
                            padding: '0.3rem 0.8rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            backgroundColor: event.status === 'upcoming' ? 'rgba(110, 68, 255, 0.2)' :
                                            event.status === 'ongoing' ? 'rgba(68, 255, 210, 0.2)' :
                                            'rgba(255, 68, 227, 0.2)',
                            color: event.status === 'upcoming' ? 'var(--primary)' :
                                   event.status === 'ongoing' ? 'var(--accent)' :
                                   'var(--secondary)'
                          }}
                        >
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </div>

                      <div
                        className="event-footer"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '1rem',
                          paddingTop: '1rem',
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <div>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            {getRegistrationsCount(event.id)} / {event.max_participants || 'Unlimited'} participants
                          </p>
                          <div
                            style={{
                              width: '200px',
                              height: '6px',
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              borderRadius: '3px',
                              overflow: 'hidden',
                              marginTop: '0.5rem',
                              maxWidth: '100%'
                            }}
                          >
                            <div
                              style={{
                                width: event.max_participants ? `${(getRegistrationsCount(event.id) / event.max_participants) * 100}%` : '0%',
                                height: '100%',
                                background: 'linear-gradient(to right, var(--primary), var(--secondary))'
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="event-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                          {event.status === 'upcoming' && (
                            <button
                              className="btn"
                              onClick={() => handleUpdateStatus(event.id, 'ongoing')}
                            >
                              Start Event
                            </button>
                          )}
                          {event.status === 'ongoing' && (
                            <button
                              className="btn"
                              onClick={() => handleUpdateStatus(event.id, 'completed')}
                            >
                              Complete Event
                            </button>
                          )}
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              loadEventRegistrations(event.id);
                            }}
                          >
                            View Registrations
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Create Event Form */}
            {isCreatingEvent && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1000,
                  backdropFilter: 'blur(5px)'
                }}
              >
                <div
                  style={{
                    backgroundColor: 'var(--dark-surface)',
                    borderRadius: '15px',
                    padding: '0',
                    width: '90%',
                    maxWidth: '900px',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem 2rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(110, 68, 255, 0.1)'
                  }}>
                    <h2 style={{ margin: 0, color: 'var(--primary)' }}>Create New Event</h2>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        transition: 'color 0.3s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                      onClick={() => setIsCreatingEvent(false)}
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleCreateEvent} style={{ padding: '2rem', maxHeight: 'calc(90vh - 70px)', overflow: 'auto' }}>
                    <div style={{
                      marginBottom: '2rem',
                      display: 'flex',
                      gap: '1.5rem',
                      alignItems: 'flex-start'
                    }}>
                      <div style={{
                        width: '200px',
                        height: '200px',
                        backgroundColor: 'var(--dark-bg)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '1px dashed rgba(255, 255, 255, 0.2)'
                      }}>
                        {newEvent.image ? (
                          <img
                            src={newEvent.image}
                            alt="Event preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🖼️</div>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>Event Image Preview</p>
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label
                        htmlFor="title"
                        style={{
                          display: 'block',
                          marginBottom: '0.5rem',
                          fontSize: '0.9rem',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        Event Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={newEvent.title}
                        onChange={handleNewEventChange}
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
                        placeholder="Enter event title"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label
                          htmlFor="date"
                          style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          Event Date *
                        </label>
                        <input
                          type="date"
                          id="start_date"
                          name="start_date"
                          value={newEvent.start_date}
                          onChange={handleNewEventChange}
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
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="start_time"
                          style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          Start Time *
                        </label>
                        <input
                          type="time"
                          id="start_time"
                          name="start_time"
                          value={newEvent.start_time}
                          onChange={handleNewEventChange}
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
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="end_date"
                          style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          End Date *
                        </label>
                        <input
                          type="date"
                          id="end_date"
                          name="end_date"
                          value={newEvent.end_date}
                          onChange={handleNewEventChange}
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
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="end_time"
                          style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          End Time *
                        </label>
                        <input
                          type="time"
                          id="end_time"
                          name="end_time"
                          value={newEvent.end_time}
                          onChange={handleNewEventChange}
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
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label
                        htmlFor="location"
                        style={{
                          display: 'block',
                          marginBottom: '0.5rem',
                          fontSize: '0.9rem',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        Event Location *
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={newEvent.location}
                        onChange={handleNewEventChange}
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
                        placeholder="Enter event location"
                      />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label
                        htmlFor="description"
                        style={{
                          display: 'block',
                          marginBottom: '0.5rem',
                          fontSize: '0.9rem',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        Event Description *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={newEvent.description}
                        onChange={handleNewEventChange}
                        required
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '4px',
                          color: 'var(--text-primary)',
                          fontSize: '1rem',
                          minHeight: '100px',
                          resize: 'vertical'
                        }}
                        placeholder="Describe your event"
                      ></textarea>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label
                          htmlFor="registrationFee"
                          style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          Registration Fee
                        </label>
                        <input
                          type="text"
                          id="registrationFee"
                          name="registrationFee"
                          value={newEvent.registrationFee}
                          onChange={handleNewEventChange}
                          style={{
                            width: '100%',
                            padding: '0.8rem 1rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            fontSize: '1rem'
                          }}
                          placeholder="e.g., Free or ₹500 per team"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="registrationDeadline"
                          style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          Registration Deadline *
                        </label>
                        <input
                          type="date"
                          id="registration_deadline"
                          name="registration_deadline"
                          value={newEvent.registration_deadline}
                          onChange={handleNewEventChange}
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
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label
                          htmlFor="maxParticipants"
                          style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          Maximum Participants *
                        </label>
                        <input
                          type="number"
                          id="max_participants"
                          name="max_participants"
                          value={newEvent.max_participants}
                          onChange={handleNewEventChange}
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
                          placeholder="Enter maximum participants"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="category_id"
                          style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          Event Category *
                        </label>
                        <CustomSelect
                          id="category_id"
                          name="category_id"
                          value={newEvent.category_id}
                          onChange={handleNewEventChange}
                          required
                          options={categories.map(category => ({
                            value: category.id,
                            label: category.name
                          }))}
                          placeholder="Select a category"
                        />
                      </div>
                    </div>

                      </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Registration Method</h3>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {[
                          { id: 'internal', label: 'Internal Registration' },
                          { id: 'external', label: 'External Form' }
                        ].map(method => (
                          <button
                            key={method.id}
                            type="button"
                            className={`btn ${newEvent.registration_method === method.id ? 'btn-primary' : ''}`}
                            onClick={() => setNewEvent({...newEvent, registration_method: method.id})}
                          >
                            {method.label}
                          </button>
                        ))}
                      </div>

                      {newEvent.registration_method === 'external' && (
                        <div style={{ marginTop: '1rem' }}>
                          <label
                            htmlFor="external_form_url"
                            style={{
                              display: 'block',
                              marginBottom: '0.5rem',
                              fontSize: '0.9rem',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            External Form URL *
                          </label>
                          <input
                            type="url"
                            id="external_form_url"
                            name="external_form_url"
                            value={newEvent.external_form_url}
                            onChange={handleNewEventChange}
                            required={newEvent.registration_method === 'external'}
                            style={{
                              width: '100%',
                              padding: '0.8rem 1rem',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '4px',
                              color: 'var(--text-primary)',
                              fontSize: '1rem'
                            }}
                            placeholder="https://forms.google.com/..."
                          />
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Event Schedule</h3>
                      {newEvent.schedule.map((day, dayIndex) => (
                        <div
                          key={dayIndex}
                          style={{
                            marginBottom: '1.5rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '10px',
                            padding: '1.5rem',
                            position: 'relative'
                          }}
                        >
                          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={day.day}
                              onChange={(e) => {
                                const updatedSchedule = [...newEvent.schedule];
                                updatedSchedule[dayIndex].day = e.target.value;
                                setNewEvent({...newEvent, schedule: updatedSchedule});
                              }}
                              placeholder="e.g., Day 1 - May 15"
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '4px',
                                color: 'var(--text-primary)',
                                fontSize: '1rem',
                                width: '100%',
                                maxWidth: '300px'
                              }}
                            />

                            {dayIndex > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedSchedule = [...newEvent.schedule];
                                  updatedSchedule.splice(dayIndex, 1);
                                  setNewEvent({...newEvent, schedule: updatedSchedule});
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  fontSize: '1.2rem'
                                }}
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          {day.events.map((event, eventIndex) => (
                            <div
                              key={eventIndex}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 2fr 1fr auto',
                                gap: '1rem',
                                marginBottom: '1rem',
                                alignItems: 'center'
                              }}
                            >
                              <input
                                type="text"
                                value={event.time}
                                onChange={(e) => {
                                  const updatedSchedule = [...newEvent.schedule];
                                  updatedSchedule[dayIndex].events[eventIndex].time = e.target.value;
                                  setNewEvent({...newEvent, schedule: updatedSchedule});
                                }}
                                placeholder="Time"
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '4px',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.9rem'
                                }}
                              />

                              <input
                                type="text"
                                value={event.title}
                                onChange={(e) => {
                                  const updatedSchedule = [...newEvent.schedule];
                                  updatedSchedule[dayIndex].events[eventIndex].title = e.target.value;
                                  setNewEvent({...newEvent, schedule: updatedSchedule});
                                }}
                                placeholder="Event title"
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '4px',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.9rem'
                                }}
                              />

                              <input
                                type="text"
                                value={event.location}
                                onChange={(e) => {
                                  const updatedSchedule = [...newEvent.schedule];
                                  updatedSchedule[dayIndex].events[eventIndex].location = e.target.value;
                                  setNewEvent({...newEvent, schedule: updatedSchedule});
                                }}
                                placeholder="Location"
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '4px',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.9rem'
                                }}
                              />

                              {eventIndex > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedSchedule = [...newEvent.schedule];
                                    updatedSchedule[dayIndex].events.splice(eventIndex, 1);
                                    setNewEvent({...newEvent, schedule: updatedSchedule});
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    padding: '0.5rem'
                                  }}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => {
                              const updatedSchedule = [...newEvent.schedule];
                              updatedSchedule[dayIndex].events.push({ time: '', title: '', location: '' });
                              setNewEvent({...newEvent, schedule: updatedSchedule});
                            }}
                            style={{
                              background: 'none',
                              border: '1px dashed rgba(255, 255, 255, 0.2)',
                              borderRadius: '4px',
                              padding: '0.5rem',
                              width: '100%',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <span>+</span> Add Event
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          const updatedSchedule = [...newEvent.schedule];
                          updatedSchedule.push({
                            day: `Day ${updatedSchedule.length + 1}`,
                            events: [{ time: '', title: '', location: '' }]
                          });
                          setNewEvent({...newEvent, schedule: updatedSchedule});
                        }}
                        style={{
                          background: 'none',
                          border: '1px dashed rgba(255, 255, 255, 0.2)',
                          borderRadius: '4px',
                          padding: '0.8rem',
                          width: '100%',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <span>+</span> Add Day
                      </button>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '1rem',
                      marginTop: '2rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                      paddingTop: '2rem'
                    }}>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setIsCreatingEvent(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                      >
                        Create Event
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Registrations Tab Content */}
        {activeTab === 'registrations' && (
          <div className="registrations-tab">
            {/* Event Selection */}
            <div
              style={{
                marginBottom: '2rem',
                backgroundColor: 'var(--dark-surface)',
                padding: '1.5rem',
                borderRadius: '10px'
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Select Event</h3>
              <CustomSelect
                id="event-select"
                name="event-select"
                value={selectedEvent?.id || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const event = events.find(ev => ev.id === e.target.value);
                    if (event) {
                      loadEventRegistrations(event.id);
                    }
                  } else {
                    setSelectedEvent(null);
                    setRegistrations([]);
                  }
                }}
                options={events.map(event => ({
                  value: event.id,
                  label: `${event.title} (${formatDate(event.start_date, 'MMM d, yyyy')})`
                }))}
                placeholder="Select an event to view registrations"
              />
            </div>

            {/* Registrations List */}
            {selectedEvent ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <h3 style={{ margin: 0 }}>
                    Registrations for {selectedEvent?.title}
                  </h3>
                  <button
                    className="btn export-excel-btn"
                    onClick={async () => {
                      try {
                        // Export registrations as Excel
                        const result = await registrationService.exportRegistrationsAsCSV(
                          selectedEvent.id,
                          selectedEvent.title
                        );

                        if (!result.success) {
                          alert(result.message || 'Failed to export registrations');
                          return;
                        }

                        // Download the Excel file
                        if (result.excelFile) {
                          const link = document.createElement('a');
                          link.href = URL.createObjectURL(result.excelFile.blob);
                          link.download = result.excelFile.filename;
                          link.style.display = 'none';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      } catch (err) {
                        console.error('Error exporting registrations:', err);
                        alert('Failed to export registrations: ' + (err.message || 'Unknown error'));
                      }
                    }}
                    style={{
                      backgroundColor: 'rgba(68, 255, 210, 0.15)',
                      color: 'var(--accent)',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(68, 255, 210, 0.3)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      whiteSpace: 'nowrap',
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📊</span> Export as Excel
                  </button>
                </div>

                {registrations.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '3rem',
                      backgroundColor: 'var(--dark-surface)',
                      borderRadius: '8px'
                    }}
                  >
                    <p>No registrations found for this event.</p>
                  </div>
                ) : (
                  <div className="registration-container">
                    {/* Table with horizontal scroll for all screen sizes */}
                    <div
                      className="registration-table-wrapper"
                      style={{
                        backgroundColor: 'var(--dark-surface)',
                        borderRadius: '10px',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Scroll indicator for mobile */}
                      <div className="scroll-indicator" style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'rgba(68, 255, 210, 0.1)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <span style={{ fontSize: '1.1rem' }}>👉</span> Swipe horizontally to see all details
                      </div>

                      {/* Scrollable table container */}
                      <div className="table-scroll-container" style={{
                        overflowX: 'auto',
                        width: '100%',
                        position: 'relative',
                        WebkitOverflowScrolling: 'touch' // For smooth scrolling on iOS
                      }}>
                        <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                              <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                              <th style={{ padding: '1rem', textAlign: 'left' }}>Roll Number</th>
                              <th style={{ padding: '1rem', textAlign: 'left' }}>Department</th>
                              <th style={{ padding: '1rem', textAlign: 'left' }}>Year</th>
                              <th style={{ padding: '1rem', textAlign: 'left' }}>Registration Type</th>
                              <th style={{ padding: '1rem', textAlign: 'left' }}>Registration Date</th>
                              <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {registrations.map(registration => (
                              <tr
                                key={registration.id}
                                style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                              >
                                <td style={{ padding: '1rem' }}>{registration.participant_name}</td>
                                <td style={{ padding: '1rem' }}>{registration.participant_id || 'N/A'}</td>
                                <td style={{ padding: '1rem' }}>{registration.additional_info?.department || 'N/A'}</td>
                                <td style={{ padding: '1rem' }}>{registration.additional_info?.year || 'N/A'}</td>
                                <td style={{ padding: '1rem' }}>
                                  {registration.additional_info?.team_members ? (
                                    <span style={{ color: 'var(--accent)' }}>
                                      Team ({registration.additional_info.team_members.length + 1} members)
                                    </span>
                                  ) : (
                                    <span>Individual</span>
                                  )}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                  {formatDate(registration.created_at, 'MMM d, yyyy')}
                                </td>
                                <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                                  <button
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--accent)',
                                      cursor: 'pointer',
                                      marginRight: '0.5rem'
                                    }}
                                    onClick={() => {
                                      setSelectedRegistration(registration);
                                    }}
                                  >
                                    View Details
                                  </button>
                                  <button
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--primary)',
                                      cursor: 'pointer',
                                      marginRight: '0.5rem'
                                    }}
                                    onClick={() => {
                                      const newStatus = registration.status === 'registered' ? 'attended' : 'registered';
                                      registrationService.updateRegistrationStatus(registration.id, newStatus)
                                        .then(() => {
                                          loadEventRegistrations(selectedEvent.id);
                                        })
                                        .catch(err => {
                                          console.error('Error updating status:', err);
                                          setError('Failed to update registration status');
                                        });
                                    }}
                                  >
                                    {registration.status === 'registered' ? 'Mark Attended' : 'Mark Registered'}
                                  </button>
                                  <button
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#ff4444',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                      if (window.confirm('Are you sure you want to delete this registration?')) {
                                        registrationService.deleteRegistration(registration.id)
                                          .then(() => {
                                            loadEventRegistrations(selectedEvent.id);
                                          })
                                          .catch(err => {
                                            console.error('Error deleting registration:', err);
                                            setError('Failed to delete registration');
                                          });
                                      }
                                    }}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem',
                  backgroundColor: 'var(--dark-surface)',
                  borderRadius: '8px'
                }}
              >
                <p>Please select an event to view registrations.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {isEditingProfile && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
            <ClubProfileEditor
              onClose={() => setIsEditingProfile(false)}
              onUpdate={handleProfileUpdate}
            />
          </div>
        </div>
      )}

      {isEditingEvent && eventToEdit && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
            <EventEditor
              event={eventToEdit}
              onClose={() => {
                setIsEditingEvent(false);
                setEventToEdit(null);
              }}
              onUpdate={(updatedEvent) => {
                // Update the event in the events list
                setEvents(prevEvents =>
                  prevEvents.map(event =>
                    event.id === updatedEvent.id ? updatedEvent : event
                  )
                );

                // If this is the selected event, update it
                if (selectedEvent && selectedEvent.id === updatedEvent.id) {
                  setSelectedEvent(updatedEvent);
                }

                // Close the editor
                setIsEditingEvent(false);
                setEventToEdit(null);
              }}
            />
          </div>
        </div>
      )}

      {selectedRegistration && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
            <RegistrationDetails
              registration={selectedRegistration}
              onClose={() => setSelectedRegistration(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubDashboard;