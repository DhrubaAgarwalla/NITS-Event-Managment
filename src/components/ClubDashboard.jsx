import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import eventService from '../services/eventService';
import registrationService from '../services/registrationService';
import { format } from 'date-fns';
import { logoutAndRedirect, navigateToHome } from '../utils/navigation';
import ClubProfileEditor from './ClubProfileEditor';
import EventEditor from './EventEditor';
import RegistrationDetails from './RegistrationDetails';
import AttendanceManagement from './AttendanceManagement';
import GalleryManager from './GalleryManager';
import CustomSelect from './CustomSelect';
import MultiSelect from './MultiSelect';
import GoogleSheetsSuccessDialog from './GoogleSheetsSuccessDialog';
import AutoCreatedSheetsViewer from './AutoCreatedSheetsViewer';

import logger from '../utils/logger';

// Mobile Action Dropdown Component
const MobileActionDropdown = ({ event, onViewEvent, onStartEvent, onCompleteEvent, onToggleRegistration, onViewRegistrations }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: '📢 View & Post Updates',
      onClick: onViewEvent,
      primary: true
    },
    ...(event.status === 'upcoming' ? [{
      label: 'Start Event',
      onClick: () => onStartEvent(event.id, 'ongoing')
    }] : []),
    ...(event.status === 'ongoing' ? [{
      label: 'Complete Event',
      onClick: () => onCompleteEvent(event.id, 'completed')
    }] : []),
    {
      label: event.registration_open === false ? 'Open Registration' : 'Close Registration',
      onClick: () => onToggleRegistration(event.id, event.registration_open !== false),
      color: event.registration_open === false ? '#44ff44' : '#ff4444'
    },
    {
      label: 'View Registrations',
      onClick: () => onViewRegistrations(event.id)
    }
  ];

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: 'var(--primary)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '0.6rem 1rem',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          width: '100%'
        }}
      >
        Actions
        <span style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          fontSize: '0.7rem'
        }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'var(--dark-surface)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              zIndex: 999,
              marginBottom: '0.25rem'
            }}
          >
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: action.color || (action.primary ? 'var(--primary)' : 'var(--text-primary)'),
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.8rem',
                  fontWeight: action.primary ? '600' : '400',
                  borderBottom: index < actions.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
const ClubDashboard = ({ setCurrentPage, setIsClubLoggedIn }) => {
  const { club, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('events'); // 'events', 'registrations', 'attendance', 'gallery'
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [registrationCounts, setRegistrationCounts] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
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
  const [showGoogleSheetsDialog, setShowGoogleSheetsDialog] = useState(false);
  const [googleSheetsResult, setGoogleSheetsResult] = useState(null);

  // Load registration counts for all events
  const loadRegistrationCounts = async (eventsData) => {
    if (!eventsData || eventsData.length === 0) return;

    try {
      const counts = {};

      // Load registration counts for each event
      await Promise.all(
        eventsData.map(async (event) => {
          try {
            const registrationsData = await registrationService.getEventRegistrations(event.id);
            counts[event.id] = registrationsData ? registrationsData.length : 0;
          } catch (err) {
            logger.error(`Error loading registrations for event ${event.id}:`, err);
            counts[event.id] = 0;
          }
        })
      );

      setRegistrationCounts(counts);
      logger.log('Registration counts loaded:', counts);
    } catch (err) {
      logger.error('Error loading registration counts:', err);
    }
  };

  // Refresh registration count for a single event
  const refreshEventRegistrationCount = async (eventId) => {
    try {
      const registrationsData = await registrationService.getEventRegistrations(eventId);
      const count = registrationsData ? registrationsData.length : 0;

      setRegistrationCounts(prev => ({
        ...prev,
        [eventId]: count
      }));

      logger.log(`Registration count refreshed for event ${eventId}: ${count}`);
    } catch (err) {
      logger.error(`Error refreshing registration count for event ${eventId}:`, err);
    }
  };

  // Load club events
  const loadClubEvents = async () => {
    if (!club) return;

    // Create a variable to track if the operation was canceled
    let isCanceled = false;

    // Set a timeout to cancel the operation if it takes too long
    const timeoutId = setTimeout(() => {
      isCanceled = true;
      logger.warn('Loading club events timed out');
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
        // Load registration counts for all events
        await loadRegistrationCounts(eventsData || []);
        clearTimeout(timeoutId); // Clear the timeout since we got the data
      }
    } catch (err) {
      logger.error('Error loading club events:', err);

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
          // Load registration counts for all events
          await loadRegistrationCounts(eventsData || []);
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
        logger.error('Error loading data:', err);

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

  // Periodically refresh event data and registration counts to catch automation changes
  useEffect(() => {
    if (!club?.id) return;

    const interval = setInterval(async () => {
      // Only refresh if we're on the events tab to avoid unnecessary API calls
      if (activeTab === 'events') {
        try {
          logger.log('🔄 Periodic refresh: Checking for event updates...');

          // Refresh event data to catch automation changes (like auto-closed registrations)
          const updatedEventsData = await eventService.getClubEvents(club.id);

          if (updatedEventsData) {
            // Check if any events have changed
            const hasChanges = events.length !== updatedEventsData.length ||
              events.some(event => {
                const updatedEvent = updatedEventsData.find(e => e.id === event.id);
                return !updatedEvent ||
                  event.registration_open !== updatedEvent.registration_open ||
                  event.status !== updatedEvent.status ||
                  event.updated_at !== updatedEvent.updated_at;
              });

            if (hasChanges) {
              logger.log('📊 Event changes detected, updating dashboard...');
              setEvents(updatedEventsData);

              // Also refresh registration counts
              await loadRegistrationCounts(updatedEventsData);

              // If the selected event was updated, update it too
              if (selectedEvent) {
                const updatedSelectedEvent = updatedEventsData.find(e => e.id === selectedEvent.id);
                if (updatedSelectedEvent) {
                  setSelectedEvent(updatedSelectedEvent);
                }
              }
            } else {
              // If no event changes, just refresh registration counts
              await loadRegistrationCounts(events);
            }
          }
        } catch (error) {
          logger.error('Error during periodic refresh:', error);
          // Fallback to just refreshing registration counts
          if (events && events.length > 0) {
            await loadRegistrationCounts(events);
          }
        }
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [events, activeTab, club?.id, selectedEvent]);

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
      logger.warn('Loading registrations timed out');
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
        // Update the registration count for this specific event
        setRegistrationCounts(prev => ({
          ...prev,
          [eventId]: registrationsData ? registrationsData.length : 0
        }));
        clearTimeout(timeoutId); // Clear the timeout since we got the data
      }
    } catch (err) {
      logger.error('Error loading registrations:', err);

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

      logger.log('Creating event with data:', eventData);

      // Create the event
      const createdEvent = await eventService.createEvent(eventData);

      // Show success message
      setSuccess('Event created successfully!');

      // Add to events list
      setEvents(prevEvents => [...prevEvents, createdEvent]);

      // Initialize registration count for the new event
      setRegistrationCounts(prev => ({
        ...prev,
        [createdEvent.id]: 0
      }));

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
      logger.error('Error creating event:', err);
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
        // Remove the registration count for the deleted event
        setRegistrationCounts(prev => {
          const newCounts = { ...prev };
          delete newCounts[eventId];
          return newCounts;
        });
        setError(null);
      } catch (err) {
        logger.error('Error deleting event:', err);
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
      setError(null);

      // Update the event status
      const updatedEvent = await eventService.updateEventStatus(eventId, newStatus);

      // Update the events list with the updated event
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === eventId ? updatedEvent : event
        )
      );

      // If this is the selected event, update it too
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent(updatedEvent);
      }

      logger.log(`Event status updated to ${newStatus} successfully`);
    } catch (err) {
      logger.error('Error updating event status:', err);
      setError(`Failed to update event status: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle toggling registration status (open/closed)
  const handleToggleRegistration = async (eventId, isCurrentlyOpen) => {
    try {
      setIsLoading(true);
      setError(null);

      // Toggle the registration status
      const newStatus = !isCurrentlyOpen;
      const updatedEvent = await eventService.toggleRegistrationStatus(eventId, newStatus);

      // Update the events list with the updated event
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === eventId ? updatedEvent : event
        )
      );

      // If this is the selected event, update it too
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent(updatedEvent);
      }

      logger.log(`Registration ${newStatus ? 'opened' : 'closed'} successfully for event ID: ${eventId}`);
    } catch (err) {
      logger.error('Error toggling registration status:', err);
      setError(`Failed to update registration status: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      logger.log('Logging out from club dashboard');
      // First set isClubLoggedIn to false to show the navbar
      setIsClubLoggedIn(false);
      // Set current page to home
      setCurrentPage('home');
      // Then perform the logout and redirect
      await logoutAndRedirect(signOut);
    } catch (err) {
      logger.error('Error signing out:', err);
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

  // We're removing the body.modal-open class as it's causing issues

  // Format date for display
  const formatDate = (dateString, formatStr = 'MMM d, yyyy h:mm a') => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        logger.warn('Invalid date:', dateString);
        return 'Invalid date';
      }
      return format(date, formatStr);
    } catch (err) {
      logger.error('Error formatting date:', err);
      return 'Date error';
    }
  };

  // Get event registrations count
  const getRegistrationsCount = (eventId) => {
    return registrationCounts[eventId] || 0;
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
    logger.log('Opening WhatsApp URL:', whatsappUrl);
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank');
    } else {
      logger.error('WhatsApp URL is empty or undefined');
      alert('WhatsApp URL is not available. Please try copying the link instead.');
    }
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

  // If editing an event, show only the event editor
  if (isEditingEvent && eventToEdit) {
    return (
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
    );
  }

  // If editing profile, show only the profile editor
  if (isEditingProfile) {
    return (
      <ClubProfileEditor
        onClose={() => setIsEditingProfile(false)}
        onUpdate={handleProfileUpdate}
      />
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

        {/* ClubProfileEditor is now rendered as a full page component */}

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
            borderRadius: '10px',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >

          {/* Add responsive styles */}
          <style jsx>{`
            @media (max-width: 768px) {
              .dashboard-header {
                flex-direction: column !important;
                align-items: stretch !important;
                text-align: center;
              }

              .dashboard-header-content {
                justify-content: center !important;
                margin-bottom: 1rem;
              }

              .dashboard-header-actions {
                justify-content: center !important;
                flex-wrap: wrap !important;
                gap: 0.5rem !important;
              }

              .event-actions {
                flex-direction: column !important;
                gap: 0.5rem !important;
              }

              .event-actions button {
                width: 100% !important;
                justify-content: center !important;
              }
            }
          `}</style>
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
          <button
            className={`tab-button ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'attendance' ? 'var(--dark-surface)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'attendance' ? '2px solid var(--primary)' : 'none',
              color: activeTab === 'attendance' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'attendance' ? '600' : '400',
              whiteSpace: 'nowrap'
            }}
          >
            📊 Attendance Tracking
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
              fontWeight: activeTab === 'sheets' ? '600' : '400',
              whiteSpace: 'nowrap'
            }}
          >
            📊 Google Sheets
          </button>
          <button
            className={`tab-button ${activeTab === 'gallery' ? 'active' : ''}`}
            onClick={() => setActiveTab('gallery')}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'gallery' ? 'var(--dark-surface)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'gallery' ? '2px solid var(--primary)' : 'none',
              color: activeTab === 'gallery' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'gallery' ? '600' : '400',
              whiteSpace: 'nowrap'
            }}
          >
            Manage Gallery
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
                    {/* Add responsive styles for mobile */}
                    <style jsx>{`
                      @media (max-width: 768px) {
                        .event-item {
                          flex-direction: column !important;
                          margin-bottom: 0.5rem !important;
                          border-radius: 8px !important;
                        }
                        .event-image {
                          width: 100% !important;
                          min-width: unset !important;
                          height: 100px !important;
                        }
                        .event-content {
                          padding: 0.6rem !important;
                        }
                        .event-title {
                          font-size: 1rem !important;
                          margin-bottom: 0.2rem !important;
                        }
                        .event-description {
                          font-size: 0.8rem !important;
                          margin-bottom: 0.4rem !important;
                          line-height: 1.2 !important;
                          display: -webkit-box !important;
                          -webkit-line-clamp: 2 !important;
                          -webkit-box-orient: vertical !important;
                          overflow: hidden !important;
                        }
                        .event-tags {
                          flex-wrap: wrap !important;
                          gap: 0.2rem !important;
                          margin-bottom: 0.4rem !important;
                        }
                        .event-tag {
                          padding: 0.1rem 0.3rem !important;
                          font-size: 0.6rem !important;
                          margin-bottom: 0 !important;
                          margin-right: 0 !important;
                        }
                        .event-header {
                          flex-direction: column !important;
                          align-items: flex-start !important;
                          gap: 0.3rem !important;
                          margin-top: 0.5rem !important;
                        }
                        .event-status-mobile {
                          align-self: flex-start !important;
                          margin-right: 0 !important;
                          padding: 0.1rem 0.3rem !important;
                          font-size: 0.6rem !important;
                        }
                        .event-footer {
                          flex-direction: column !important;
                          align-items: stretch !important;
                          gap: 0.5rem !important;
                          margin-top: 0.5rem !important;
                          padding-top: 0.5rem !important;
                        }
                        .desktop-actions {
                          display: none !important;
                        }
                        .mobile-actions {
                          display: flex !important;
                          justify-content: center !important;
                        }
                        .event-date-location {
                          font-size: 0.75rem !important;
                          margin-bottom: 0.3rem !important;
                        }
                        .registration-count {
                          font-size: 0.75rem !important;
                          text-align: center !important;
                        }
                      }
                      @media (min-width: 769px) {
                        .mobile-actions {
                          display: none !important;
                        }
                      }
                    `}</style>
                    <div
                      className="event-image"
                      style={{
                        width: '200px',
                        minWidth: '200px',
                        height: 'auto',
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
                          zIndex: 5,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          borderRadius: '4px',
                          padding: '0.25rem'
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

                      <div className="event-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '1.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <h3 className="event-title" style={{ marginTop: 0, marginBottom: '0.5rem' }}>{event.title}</h3>
                          <p className="event-date-location" style={{ margin: '0 0 1rem', color: 'var(--text-secondary)' }}>
                            {formatDate(event.start_date, 'MMM d, yyyy')} - {formatDate(event.end_date, 'MMM d, yyyy')} • {event.location || 'No location specified'}
                          </p>
                          <p className="event-description" style={{ margin: '0 0 1rem' }}>{event.description || 'No description provided'}</p>

                          {/* Optimized tags section */}
                          <div className="event-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            {event.category && (
                              <span
                                className="event-tag"
                                style={{
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  color: event.categories?.color || 'var(--text-secondary)',
                                  display: 'inline-block',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {event.categories?.name || 'Uncategorized'}
                              </span>
                            )}

                            <span
                              className="event-tag"
                              style={{
                                padding: '0.25rem 0.6rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: 'var(--text-secondary)',
                                display: 'inline-block',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {event.registration_method === 'internal' ? 'Internal' :
                               event.registration_method === 'external' ? 'External' : 'Both'}
                            </span>

                            <span
                              className="event-tag"
                              style={{
                                padding: '0.25rem 0.6rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                backgroundColor: event.registration_open === false ? 'rgba(255, 68, 68, 0.1)' : 'rgba(68, 255, 68, 0.1)',
                                color: event.registration_open === false ? '#ff4444' : '#44ff44',
                                display: 'inline-block',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {event.registration_open === false ? 'Reg Closed' : 'Reg Open'}
                            </span>
                          </div>
                        </div>
                        <span
                          className="event-status-mobile"
                          style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            backgroundColor: event.status === 'upcoming' ? 'rgba(110, 68, 255, 0.2)' :
                                            event.status === 'ongoing' ? 'rgba(68, 255, 210, 0.2)' :
                                            'rgba(255, 68, 227, 0.2)',
                            color: event.status === 'upcoming' ? 'var(--primary)' :
                                   event.status === 'ongoing' ? 'var(--accent)' :
                                   'var(--secondary)',
                            marginRight: '3rem',
                            whiteSpace: 'nowrap'
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
                          <p className="registration-count" style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            {getRegistrationsCount(event.id)} registrations
                          </p>
                        </div>

                        {/* Desktop Actions */}
                        <div className="event-actions desktop-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {/* Primary Action - View Event */}
                          <button
                            className="btn"
                            onClick={() => {
                              // Navigate to event details page where club can post live updates
                              window.open(`/event/${event.id}`, '_blank');
                            }}
                            style={{
                              backgroundColor: 'rgba(110, 68, 255, 0.2)',
                              color: 'var(--primary)',
                              border: '1px solid var(--primary)',
                              fontWeight: '600'
                            }}
                            title="View event page and post live updates"
                          >
                            📢 View Event & Post Updates
                          </button>

                          {/* Status Management */}
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

                          {/* Registration Management */}
                          <button
                            className={`btn ${event.registration_open === false ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => handleToggleRegistration(event.id, event.registration_open !== false)}
                            style={{
                              backgroundColor: event.registration_open === false ? 'rgba(255, 68, 68, 0.2)' : 'rgba(68, 255, 68, 0.2)',
                              color: event.registration_open === false ? '#ff4444' : '#44ff44',
                              border: `1px solid ${event.registration_open === false ? '#ff4444' : '#44ff44'}`
                            }}
                          >
                            {event.registration_open === false ? 'Open Registration' : 'Close Registration'}
                          </button>

                          {/* View Registrations */}
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              loadEventRegistrations(event.id);
                            }}
                          >
                            View Registrations
                          </button>
                        </div>

                        {/* Mobile Actions - Dropdown */}
                        <div className="mobile-actions" style={{ display: 'none' }}>
                          <MobileActionDropdown
                            event={event}
                            onViewEvent={() => window.open(`/event/${event.id}`, '_blank')}
                            onStartEvent={handleUpdateStatus}
                            onCompleteEvent={handleUpdateStatus}
                            onToggleRegistration={handleToggleRegistration}
                            onViewRegistrations={loadEventRegistrations}
                          />
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
                  <div className="export-buttons" style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      className="btn export-pdf-btn"
                      onClick={async () => {
                        try {
                          // Set loading state
                          const button = document.querySelector('.export-pdf-btn');
                          const originalContent = button.innerHTML;
                          button.innerHTML = '<span style="font-size: 1.2rem">⏳</span> Exporting...';
                          button.disabled = true;
                          button.style.opacity = '0.7';
                          button.style.cursor = 'wait';

                          // Export registrations as PDF
                          const result = await registrationService.exportRegistrationsAsCSV(
                            selectedEvent.id,
                            selectedEvent.title,
                            'pdf'
                          );

                          // Reset button state
                          button.innerHTML = originalContent;
                          button.disabled = false;
                          button.style.opacity = '1';
                          button.style.cursor = 'pointer';

                          if (!result.success) {
                            alert(result.message || 'Failed to export registrations');
                            return;
                          }

                          // Download the PDF file
                          if (result.url && result.filename) {
                            const link = document.createElement('a');
                            link.href = result.url;
                            link.download = result.filename;
                            link.style.display = 'none';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }
                        } catch (err) {
                          // Reset button state on error
                          const button = document.querySelector('.export-pdf-btn');
                          button.innerHTML = '<span style="font-size: 1.2rem">📄</span> PDF';
                          button.disabled = false;
                          button.style.opacity = '1';
                          button.style.cursor = 'pointer';

                          logger.error('Error exporting registrations:', err);
                          alert('Failed to export registrations: ' + (err.message || 'Unknown error'));
                        }
                      }}
                      style={{
                        backgroundColor: 'rgba(255, 68, 68, 0.15)',
                        color: '#ff5555',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 68, 68, 0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap',
                        fontWeight: '500',
                        fontSize: '0.95rem'
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>📄</span> PDF
                    </button>

                    <button
                      className="btn export-google-sheets-btn"
                      onClick={async () => {
                        try {
                          // Create a loading overlay for the entire page
                          const loadingOverlay = document.createElement('div');
                          loadingOverlay.className = 'loading-overlay';
                          loadingOverlay.style.position = 'fixed';
                          loadingOverlay.style.top = '0';
                          loadingOverlay.style.left = '0';
                          loadingOverlay.style.width = '100%';
                          loadingOverlay.style.height = '100%';
                          loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                          loadingOverlay.style.display = 'flex';
                          loadingOverlay.style.flexDirection = 'column';
                          loadingOverlay.style.justifyContent = 'center';
                          loadingOverlay.style.alignItems = 'center';
                          loadingOverlay.style.zIndex = '9999';

                          // Add a spinner
                          const spinner = document.createElement('div');
                          spinner.className = 'spinner';
                          spinner.style.border = '5px solid rgba(255, 255, 255, 0.3)';
                          spinner.style.borderTop = '5px solid #4285F4';
                          spinner.style.borderRadius = '50%';
                          spinner.style.width = '50px';
                          spinner.style.height = '50px';
                          spinner.style.animation = 'spin 1s linear infinite';

                          // Add a message
                          const message = document.createElement('div');
                          message.style.color = 'white';
                          message.style.marginTop = '20px';
                          message.style.fontWeight = 'bold';
                          message.innerHTML = 'Processing Google Sheet...<br><span style="font-size: 0.8rem; font-weight: normal">Checking for existing sheet and updating or creating as needed</span>';

                          // Add animation style
                          const style = document.createElement('style');
                          style.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';

                          // Add elements to the overlay
                          loadingOverlay.appendChild(spinner);
                          loadingOverlay.appendChild(message);
                          document.head.appendChild(style);
                          document.body.appendChild(loadingOverlay);

                          // Set loading state
                          const button = document.querySelector('.export-google-sheets-btn');
                          const originalContent = button.innerHTML;
                          button.innerHTML = '<span style="font-size: 1.2rem">⏳</span> Processing Sheet...';
                          button.disabled = true;
                          button.style.opacity = '0.7';
                          button.style.cursor = 'wait';

                          // Smart Google Sheets generation - checks if sheet exists and updates or creates
                          const result = await registrationService.smartGenerateGoogleSheet(
                            selectedEvent.id,
                            selectedEvent.title
                          );

                          // Remove the loading overlay
                          document.body.removeChild(loadingOverlay);

                          // Reset button state
                          button.innerHTML = originalContent;
                          button.disabled = false;
                          button.style.opacity = '1';
                          button.style.cursor = 'pointer';

                          if (!result.success) {
                            alert(result.message || 'Failed to generate Google Sheet');
                            return;
                          }

                          // Update the result message to reflect the action taken
                          const enhancedResult = {
                            ...result,
                            message: result.action === 'updated'
                              ? `Updated existing Google Sheet with ${result.rowCount || 0} registrations`
                              : `Created new Google Sheet with ${result.rowCount || 0} registrations`,
                            filename: `${selectedEvent.title} - Event Registrations`
                          };

                          // Show the Google Sheets success dialog
                          setGoogleSheetsResult(enhancedResult);
                          setShowGoogleSheetsDialog(true);
                        } catch (err) {
                          // Remove the loading overlay if it exists
                          const loadingOverlay = document.querySelector('.loading-overlay');
                          if (loadingOverlay) {
                            document.body.removeChild(loadingOverlay);
                          }

                          // Reset button state on error
                          const button = document.querySelector('.export-google-sheets-btn');
                          button.innerHTML = '<span style="font-size: 1.2rem">📋</span> Google Sheets';
                          button.disabled = false;
                          button.style.opacity = '1';
                          button.style.cursor = 'pointer';

                          logger.error('Error exporting registrations to Google Sheets:', err);
                          alert('Failed to create Google Sheet: ' + (err.message || 'Unknown error'));
                        }
                      }}
                      style={{
                        backgroundColor: 'rgba(66, 133, 244, 0.15)',
                        color: '#4285F4',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(66, 133, 244, 0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap',
                        fontWeight: '500',
                        fontSize: '0.95rem'
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>📋</span> Google Sheets
                    </button>

                    <button
                      className="btn export-sheets-btn"
                      onClick={async () => {
                        try {
                          // Create a loading overlay for the entire page
                          const loadingOverlay = document.createElement('div');
                          loadingOverlay.className = 'loading-overlay';
                          loadingOverlay.style.position = 'fixed';
                          loadingOverlay.style.top = '0';
                          loadingOverlay.style.left = '0';
                          loadingOverlay.style.width = '100%';
                          loadingOverlay.style.height = '100%';
                          loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                          loadingOverlay.style.display = 'flex';
                          loadingOverlay.style.flexDirection = 'column';
                          loadingOverlay.style.justifyContent = 'center';
                          loadingOverlay.style.alignItems = 'center';
                          loadingOverlay.style.zIndex = '9999';

                          // Add a spinner
                          const spinner = document.createElement('div');
                          spinner.className = 'spinner';
                          spinner.style.border = '5px solid rgba(255, 255, 255, 0.3)';
                          spinner.style.borderTop = '5px solid #44FFCF';
                          spinner.style.borderRadius = '50%';
                          spinner.style.width = '50px';
                          spinner.style.height = '50px';
                          spinner.style.animation = 'spin 1s linear infinite';

                          // Add a message
                          const message = document.createElement('div');
                          message.style.color = 'white';
                          message.style.marginTop = '20px';
                          message.style.fontWeight = 'bold';
                          message.innerHTML = 'Creating export...<br><span style="font-size: 0.8rem; font-weight: normal">This may take a few seconds</span>';

                          // Add animation style
                          const style = document.createElement('style');
                          style.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';

                          // Add elements to the overlay
                          loadingOverlay.appendChild(spinner);
                          loadingOverlay.appendChild(message);
                          document.head.appendChild(style);
                          document.body.appendChild(loadingOverlay);

                          // Set loading state
                          const button = document.querySelector('.export-sheets-btn');
                          const originalContent = button.innerHTML;
                          button.innerHTML = '<span style="font-size: 1.2rem">⏳</span> Creating Excel File...';
                          button.disabled = true;
                          button.style.opacity = '0.7';
                          button.style.cursor = 'wait';

                          // Export registrations as Excel with advanced styling
                          const result = await registrationService.exportRegistrationsAsCSV(
                            selectedEvent.id,
                            selectedEvent.title,
                            'excel_styled'
                          );

                          // Remove the loading overlay
                          document.body.removeChild(loadingOverlay);

                          // Reset button state
                          button.innerHTML = originalContent;
                          button.disabled = false;
                          button.style.opacity = '1';
                          button.style.cursor = 'pointer';

                          if (!result.success) {
                            alert(result.message || 'Failed to export registrations');
                            return;
                          }

                          // Handle different export types
                          if (result.type === 'pdf') {
                            // For PDF, open in new tab
                            window.open(result.url, '_blank');
                          } else {
                            // For Excel, create a download link
                            const link = document.createElement('a');
                            link.href = result.url;
                            link.download = result.filename;
                            link.style.display = 'none';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }
                        } catch (err) {
                          // Remove the loading overlay if it exists
                          const loadingOverlay = document.querySelector('.loading-overlay');
                          if (loadingOverlay) {
                            document.body.removeChild(loadingOverlay);
                          }

                          // Reset button state on error
                          const button = document.querySelector('.export-sheets-btn');
                          button.innerHTML = '<span style="font-size: 1.2rem">📊</span> Excel';
                          button.disabled = false;
                          button.style.opacity = '1';
                          button.style.cursor = 'pointer';

                          logger.error('Error exporting registrations to Excel:', err);
                          alert('Failed to export registrations: ' + (err.message || 'Unknown error'));
                        }
                      }}
                      style={{
                        backgroundColor: 'rgba(52, 168, 83, 0.15)',
                        color: '#34A853',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(52, 168, 83, 0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap',
                        fontWeight: '500',
                        fontSize: '0.95rem'
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>📊</span> Excel Sheet
                    </button>
                  </div>
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
                        <table style={{ width: '100%', minWidth: selectedEvent?.requires_payment ? '1100px' : '900px', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                              <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                              <th style={{ padding: '1rem', textAlign: 'left' }}>Roll Number</th>
                              <th style={{ padding: '1rem', textAlign: 'left' }}>Department</th>
                              <th style={{ padding: '1rem', textAlign: 'left' }}>Year</th>
                              <th style={{ padding: '1rem', textAlign: 'left' }}>Registration Type</th>
                              {selectedEvent?.requires_payment && (
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Payment Status</th>
                              )}
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
                                {selectedEvent?.requires_payment && (
                                  <td style={{ padding: '1rem' }}>
                                    {registration.payment_screenshot_url ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                          padding: '0.25rem 0.5rem',
                                          borderRadius: '4px',
                                          fontSize: '0.8rem',
                                          fontWeight: '500',
                                          backgroundColor: registration.payment_status === 'verified' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                                          color: registration.payment_status === 'verified' ? '#22c55e' : '#fbbf24'
                                        }}>
                                          {registration.payment_status === 'verified' ? 'Verified' : 'Pending'}
                                        </span>
                                        <a
                                          href={registration.payment_screenshot_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                            color: 'var(--primary)',
                                            textDecoration: 'none',
                                            fontSize: '0.9rem'
                                          }}
                                          title="View payment screenshot"
                                        >
                                          📷 View
                                        </a>
                                      </div>
                                    ) : (
                                      <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        fontWeight: '500',
                                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                        color: '#ef4444'
                                      }}>
                                        No Payment
                                      </span>
                                    )}
                                  </td>
                                )}
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
                                  {selectedEvent?.requires_payment && registration.payment_screenshot_url && (
                                    <button
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: registration.payment_status === 'verified' ? '#fbbf24' : '#22c55e',
                                        cursor: 'pointer',
                                        marginRight: '0.5rem'
                                      }}
                                      onClick={() => {
                                        const newPaymentStatus = registration.payment_status === 'verified' ? 'pending' : 'verified';
                                        registrationService.updatePaymentStatus(registration.id, newPaymentStatus)
                                          .then(() => {
                                            loadEventRegistrations(selectedEvent.id);
                                          })
                                          .catch(err => {
                                            logger.error('Error updating payment status:', err);
                                            setError('Failed to update payment status');
                                          });
                                      }}
                                    >
                                      {registration.payment_status === 'verified' ? 'Unverify Payment' : 'Verify Payment'}
                                    </button>
                                  )}
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
                                            logger.error('Error deleting registration:', err);
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

        {/* Attendance Tab Content */}
        {activeTab === 'attendance' && (
          <div className="attendance-tab">
            <AttendanceManagement />
          </div>
        )}

        {/* Google Sheets Tab Content */}
        {activeTab === 'sheets' && (
          <div className="sheets-tab">
            <AutoCreatedSheetsViewer clubId={club?.id} />
          </div>
        )}

        {/* Gallery Tab Content */}
        {activeTab === 'gallery' && (
          <div className="gallery-tab">
            <GalleryManager />
          </div>
        )}
      </div>

      {/* Modals */}
      {isEditingProfile && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            // Close modal when clicking outside the content
            if (e.target.className === 'modal-overlay') {
              setIsEditingProfile(false);
            }
          }}
        >
          <div
            className="modal-content"
          >
            <ClubProfileEditor
              onClose={() => setIsEditingProfile(false)}
              onUpdate={handleProfileUpdate}
            />
          </div>
        </div>
      )}

      {/* EventEditor is now rendered as a full page component */}

      {selectedRegistration && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            // Close modal when clicking outside the content
            if (e.target.className === 'modal-overlay') {
              setSelectedRegistration(null);
            }
          }}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '600px' }} /* Override the default 800px max-width */
          >
            <RegistrationDetails
              registration={selectedRegistration}
              onClose={() => setSelectedRegistration(null)}
            />
          </div>
        </div>
      )}

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
    </div>
  );
};

export default ClubDashboard;