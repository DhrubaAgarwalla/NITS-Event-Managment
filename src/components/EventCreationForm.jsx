import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import eventService from '../services/eventService';
import { uploadImage } from '../lib/cloudinary';
import CustomSelect from './CustomSelect';
import MultiSelect from './MultiSelect';

export default function EventCreationForm({ setCurrentPage, onEventCreated }) {
  // Redirect to login if no club is logged in
  const { club, user } = useAuth();

  useEffect(() => {
    if (!club || !user) {
      setCurrentPage('login');
    }
  }, [club, user, setCurrentPage]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Horizontal banner (main event banner)
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Vertical banner (for sharing)
  const [verticalImageFile, setVerticalImageFile] = useState(null);
  const [verticalImagePreview, setVerticalImagePreview] = useState('');
  const [verticalUploadProgress, setVerticalUploadProgress] = useState(0);

  // Form state
  const [creationStep, setCreationStep] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '18:00',
    location: '',
    min_participants: '1', // Default to 1 for individual events
    max_participants: '1', // Default to 1 for individual events
    participation_type: 'individual', // 'individual', 'team', or 'both'
    registration_deadline: '',
    category_id: '',
    status: 'upcoming',

    // Registration method fields
    registration_method: 'internal',
    external_form_url: '',
    registration_open: true, // Default to open registration

    // Tags field
    selectedTags: [],

    // Schedule fields
    schedule: [
      {
        day: 'Day 1',
        events: [
          { time: '09:00', title: 'Opening Ceremony', location: '' }
        ]
      }
    ]
  });

  // Load categories and tags on component mount
  useEffect(() => {
    const loadCategoriesAndTags = async () => {
      try {
        // Fetch categories from the database
        const categoriesList = await eventService.getCategories();
        console.log('Categories loaded:', categoriesList);

        if (categoriesList && categoriesList.length > 0) {
          // Remove duplicate categories by name
          const uniqueCategories = categoriesList.filter((category, index, self) =>
            index === self.findIndex(c => c.name.toLowerCase() === category.name.toLowerCase())
          );

          // Set categories and default category_id
          setCategories(uniqueCategories);
          setFormData(prev => ({
            ...prev,
            category_id: uniqueCategories[0].id
          }));
          console.log('Set default category_id to:', uniqueCategories[0].id);
        } else {
          console.warn('No categories found in the database');
          // Use hardcoded categories as fallback
          const fallbackCategories = [
            { id: '1', name: 'Technical', color: '#3498db' },
            { id: '2', name: 'Cultural', color: '#e74c3c' },
            { id: '3', name: 'Sports', color: '#2ecc71' },
            { id: '4', name: 'Academic', color: '#f39c12' },
            { id: '5', name: 'Workshop', color: '#9b59b6' }
          ];
          setCategories(fallbackCategories);
          setFormData(prev => ({
            ...prev,
            category_id: fallbackCategories[0].id
          }));
        }

        // Fetch tags from the database - already deduplicated and sorted in the service
        const tagsList = await eventService.getAllTags();
        console.log('Tags loaded:', tagsList);

        if (tagsList && tagsList.length > 0) {
          setTags(tagsList);
        } else {
          console.warn('No tags found in the database');
          // Use hardcoded tags as fallback
          const fallbackTags = [
            { id: '1', name: 'Technical', color: '#3498db' },
            { id: '2', name: 'Cultural', color: '#e74c3c' },
            { id: '3', name: 'Sports', color: '#2ecc71' },
            { id: '4', name: 'Workshop', color: '#9b59b6' },
            { id: '5', name: 'Seminar', color: '#f39c12' }
          ];
          setTags(fallbackTags);
        }
      } catch (err) {
        console.error('Error loading categories and tags:', err);
        setError('Failed to load event categories and tags. Using default values.');

        // Use hardcoded categories as fallback
        const fallbackCategories = [
          { id: '1', name: 'Technical', color: '#3498db' },
          { id: '2', name: 'Cultural', color: '#e74c3c' },
          { id: '3', name: 'Sports', color: '#2ecc71' },
          { id: '4', name: 'Academic', color: '#f39c12' },
          { id: '5', name: 'Workshop', color: '#9b59b6' }
        ];
        setCategories(fallbackCategories);
        setFormData(prev => ({
          ...prev,
          category_id: fallbackCategories[0].id
        }));

        // Use hardcoded tags as fallback
        const fallbackTags = [
          { id: '1', name: 'Technical', color: '#3498db' },
          { id: '2', name: 'Cultural', color: '#e74c3c' },
          { id: '3', name: 'Sports', color: '#2ecc71' },
          { id: '4', name: 'Workshop', color: '#9b59b6' },
          { id: '5', name: 'Seminar', color: '#f39c12' }
        ];
        setTags(fallbackTags);
      }
    };

    loadCategoriesAndTags();
  }, []);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Special handling for participation_type
    if (name === 'participation_type') {
      console.log('Changing participation type to:', value);
      if (value === 'individual') {
        // For individual events, set min and max participants to 1
        setFormData(prev => ({
          ...prev,
          participation_type: value,
          min_participants: '1',
          max_participants: '1'
        }));
      } else {
        // For team events, set default team size if not already set
        setFormData(prev => ({
          ...prev,
          participation_type: value,
          min_participants: prev.min_participants === '1' ? '2' : prev.min_participants,
          max_participants: prev.max_participants === '1' ? '5' : prev.max_participants
        }));
      }
    } else {
      // Normal handling for other fields
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle tag selection
  const handleTagSelection = (tagId) => {
    setFormData(prev => {
      // Check if tag is already selected
      const isSelected = prev.selectedTags.includes(tagId);

      if (isSelected) {
        // Remove tag if already selected
        return {
          ...prev,
          selectedTags: prev.selectedTags.filter(id => id !== tagId)
        };
      } else {
        // Add tag if not selected
        return {
          ...prev,
          selectedTags: [...prev.selectedTags, tagId]
        };
      }
    });
  };

  // Handle image file selection for horizontal banner
  const handleImageChange = (e) => {
    setError(''); // Clear any previous errors
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      setError(`Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.`);
      e.target.value = ''; // Reset the input
      return;
    }

    // Check file size (max 10MB)
    const maxSizeMB = 10;
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`Image is too large (${fileSizeMB.toFixed(2)}MB). Maximum size is ${maxSizeMB}MB.`);
      e.target.value = ''; // Reset the input
      return;
    }

    console.log(`Selected horizontal banner: ${file.name}, type: ${file.type}, size: ${fileSizeMB.toFixed(2)}MB`);

    // Preview the selected image
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.onerror = () => {
      setError('Failed to read the selected image. Please try another file.');
      e.target.value = ''; // Reset the input
    };
    reader.readAsDataURL(file);

    setImageFile(file);
  };

  // Handle image file selection for vertical banner
  const handleVerticalImageChange = (e) => {
    setError(''); // Clear any previous errors
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      setError(`Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.`);
      e.target.value = ''; // Reset the input
      return;
    }

    // Check file size (max 10MB)
    const maxSizeMB = 10;
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`Vertical image is too large (${fileSizeMB.toFixed(2)}MB). Maximum size is ${maxSizeMB}MB.`);
      e.target.value = ''; // Reset the input
      return;
    }

    console.log(`Selected vertical banner: ${file.name}, type: ${file.type}, size: ${fileSizeMB.toFixed(2)}MB`);

    // Preview the selected image
    const reader = new FileReader();
    reader.onload = () => {
      setVerticalImagePreview(reader.result);
    };
    reader.onerror = () => {
      setError('Failed to read the selected vertical image. Please try another file.');
      e.target.value = ''; // Reset the input
    };
    reader.readAsDataURL(file);

    setVerticalImageFile(file);
  };

  // Handle schedule changes
  const handleScheduleChange = (dayIndex, eventIndex, field, value) => {
    const updatedSchedule = [...formData.schedule];
    updatedSchedule[dayIndex].events[eventIndex][field] = value;

    setFormData(prev => ({
      ...prev,
      schedule: updatedSchedule
    }));
  };

  // Add a new day to the schedule
  const addScheduleDay = () => {
    const dayNumber = formData.schedule.length + 1;

    setFormData(prev => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        {
          day: `Day ${dayNumber}`,
          events: [
            { time: '09:00', title: '', location: '' }
          ]
        }
      ]
    }));
  };

  // Add a new event to a day's schedule
  const addScheduleEvent = (dayIndex) => {
    const updatedSchedule = [...formData.schedule];
    updatedSchedule[dayIndex].events.push({ time: '09:00', title: '', location: '' });

    setFormData(prev => ({
      ...prev,
      schedule: updatedSchedule
    }));
  };

  // Remove an event from a day's schedule
  const removeScheduleEvent = (dayIndex, eventIndex) => {
    const updatedSchedule = [...formData.schedule];
    updatedSchedule[dayIndex].events.splice(eventIndex, 1);

    // If no events left, add a default one
    if (updatedSchedule[dayIndex].events.length === 0) {
      updatedSchedule[dayIndex].events.push({ time: '09:00', title: '', location: '' });
    }

    setFormData(prev => ({
      ...prev,
      schedule: updatedSchedule
    }));
  };

  // Remove a day from the schedule
  const removeScheduleDay = (dayIndex) => {
    if (formData.schedule.length <= 1) return; // Keep at least one day

    const updatedSchedule = [...formData.schedule];
    updatedSchedule.splice(dayIndex, 1);

    // Rename days to maintain sequence
    updatedSchedule.forEach((day, index) => {
      day.day = `Day ${index + 1}`;
    });

    setFormData(prev => ({
      ...prev,
      schedule: updatedSchedule
    }));
  };

  // Upload horizontal image to Cloudinary - this is now only used for preview and progress tracking
  // The actual upload is handled by eventService.createEvent
  const handleImageUpload = async () => {
    if (!imageFile) return null;

    try {
      // Set initial upload progress
      setUploadProgress(0);
      console.log('Starting horizontal banner upload process to Cloudinary...');

      // Check file size
      const fileSizeMB = imageFile.size / (1024 * 1024);
      console.log(`Horizontal banner file size: ${fileSizeMB.toFixed(2)} MB`);

      if (fileSizeMB > 10) {
        throw new Error(`File size (${fileSizeMB.toFixed(2)} MB) exceeds the 10 MB limit`);
      }

      // Update progress callback function
      const updateProgress = (progress) => {
        console.log(`Horizontal banner upload progress: ${progress}%`);
        setUploadProgress(progress);
      };

      // Upload to Cloudinary with progress tracking
      const result = await uploadImage(imageFile, 'event-images', updateProgress);

      if (!result || !result.url) {
        throw new Error('Horizontal banner upload failed: No URL returned from Cloudinary');
      }

      console.log('Horizontal banner upload successful, URL:', result.url);
      setUploadProgress(100);

      // Return the public URL
      return result.url;
    } catch (err) {
      console.error('Error uploading horizontal banner to Cloudinary:', err);
      // Return null instead of throwing to allow event creation to continue
      setError(`Horizontal banner upload failed: ${err.message}. Event will be created without a horizontal banner.`);
      setUploadProgress(0); // Reset progress
      return null;
    }
  };

  // Upload vertical image to Cloudinary
  const handleVerticalImageUpload = async () => {
    if (!verticalImageFile) return null;

    try {
      // Set initial upload progress
      setVerticalUploadProgress(0);
      console.log('Starting vertical banner upload process to Cloudinary...');

      // Check file size
      const fileSizeMB = verticalImageFile.size / (1024 * 1024);
      console.log(`Vertical banner file size: ${fileSizeMB.toFixed(2)} MB`);

      if (fileSizeMB > 10) {
        throw new Error(`Vertical banner file size (${fileSizeMB.toFixed(2)} MB) exceeds the 10 MB limit`);
      }

      // Update progress callback function
      const updateProgress = (progress) => {
        console.log(`Vertical banner upload progress: ${progress}%`);
        setVerticalUploadProgress(progress);
      };

      // Upload to Cloudinary with progress tracking
      const result = await uploadImage(verticalImageFile, 'event-images-vertical', updateProgress);

      if (!result || !result.url) {
        throw new Error('Vertical banner upload failed: No URL returned from Cloudinary');
      }

      console.log('Vertical banner upload successful, URL:', result.url);
      setVerticalUploadProgress(100);

      // Return the public URL
      return result.url;
    } catch (err) {
      console.error('Error uploading vertical banner to Cloudinary:', err);
      // Return null instead of throwing to allow event creation to continue
      setError(`Vertical banner upload failed: ${err.message}. Event will be created without a vertical banner.`);
      setVerticalUploadProgress(0); // Reset progress
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setCreationStep('validating');

    try {
      // Validate form
      if (!formData.title || !formData.start_date || !formData.end_date || !formData.category_id) {
        throw new Error('Please fill in all required fields including category');
      }

      if (formData.registration_method !== 'internal' && !formData.external_form_url) {
        throw new Error('Please provide an external form URL');
      }

      console.log('Form data being submitted:', formData);

      // Combine date and time
      setCreationStep('processing_dates');
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);

      // Validate dates
      if (endDateTime <= startDateTime) {
        throw new Error('End date must be after start date');
      }

      // Upload horizontal banner if selected
      let imageUrl = null;
      if (imageFile) {
        try {
          setCreationStep('uploading_horizontal_image');
          imageUrl = await handleImageUpload();
          // If upload failed but didn't throw (returned null), we can continue without an image
          if (!imageUrl) {
            console.warn('Horizontal banner upload returned null, continuing without horizontal banner');
          }
        } catch (uploadErr) {
          // Log the error but continue with event creation
          console.error('Horizontal banner upload error (continuing without image):', uploadErr);
          setError(`Horizontal banner upload failed: ${uploadErr.message}. Continuing without horizontal banner.`);
        }
      }

      // Upload vertical banner if selected
      let verticalImageUrl = null;
      if (verticalImageFile) {
        try {
          setCreationStep('uploading_vertical_image');
          verticalImageUrl = await handleVerticalImageUpload();
          // If upload failed but didn't throw (returned null), we can continue without a vertical image
          if (!verticalImageUrl) {
            console.warn('Vertical banner upload returned null, continuing without vertical banner');
          }
        } catch (uploadErr) {
          // Log the error but continue with event creation
          console.error('Vertical banner upload error (continuing without image):', uploadErr);
          setError(`Vertical banner upload failed: ${uploadErr.message}. Continuing without vertical banner.`);
        }
      }

      // Prepare event data
      const eventData = {
        title: formData.title,
        description: formData.description || '',
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        location: formData.location || '',
        min_participants: formData.min_participants ? parseInt(formData.min_participants) : null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        participation_type: formData.participation_type || 'individual',
        registration_deadline: formData.registration_deadline ? new Date(`${formData.registration_deadline}T23:59:59`).toISOString() : null,
        status: formData.status || 'upcoming',
        club_id: club.id,
        category_id: formData.category_id, // Ensure this is a valid category ID
        registration_method: formData.registration_method || 'internal',
        external_form_url: formData.external_form_url || null,
        image_url: imageUrl || null,
        vertical_image_url: verticalImageUrl || null, // Add vertical banner URL
        registration_open: formData.registration_open
      };

      // Handle schedule data separately to avoid JSON serialization issues
      setCreationStep('processing_schedule');
      try {
        // Use the actual schedule data from the form
        console.log('Using schedule from form:', formData.schedule);
        eventData.additional_info = { schedule: formData.schedule };
      } catch (err) {
        console.warn('Error processing schedule data:', err);
        // Provide a simple default schedule if there's an error
        eventData.additional_info = {
          schedule: [{
            day: 'Day 1',
            events: [{ time: '09:00', title: 'Event', location: '' }]
          }]
        };
      }

      console.log('Event data being sent to server:', eventData);

      // First check Firebase connection before attempting to create the event
      setCreationStep('checking_connection');

      try {
        // Create a simple connection check promise
        const connectionCheckPromise = new Promise(async (resolve, reject) => {
          try {
            // Use eventService to check connection by getting categories
            const categories = await eventService.getCategories();
            if (categories) {
              resolve(true);
            } else {
              reject(new Error('Database connection error: Failed to fetch categories'));
            }
          } catch (err) {
            reject(new Error(`Database connection failed: ${err.message}`));
          }
        });

        // Create a timeout for the connection check
        const connectionTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Connection check timed out. The database may be unavailable.'));
          }, 5000); // 5 seconds timeout for connection check
        });

        // Race the connection check against the timeout
        await Promise.race([connectionCheckPromise, connectionTimeoutPromise]);
        console.log('Connection check passed, proceeding with event creation');
      } catch (connectionError) {
        console.error('Connection check failed:', connectionError);
        setError(`Cannot connect to database: ${connectionError.message}. Please try again later.`);
        throw connectionError;
      }

      // Create the event with a timeout to prevent getting stuck
      setCreationStep('saving_to_database');

      // Create a promise that resolves after a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Event creation timed out after 25 seconds. The event may still be created.'));
        }, 25000); // 25 seconds timeout (increased from 15)
      });

      // Race between the event creation and the timeout
      const createdEvent = await Promise.race([
        (async () => {
          // First create the event - pass eventData, imageFile, and verticalImageFile
          // This ensures the images are uploaded directly by the service
          const newEvent = await eventService.createEvent(eventData, imageFile, verticalImageFile);

          // Then add tags if any are selected
          if (formData.selectedTags && formData.selectedTags.length > 0) {
            try {
              console.log('Adding tags to event:', formData.selectedTags);
              await eventService.addTagsToEvent(newEvent.id, formData.selectedTags);
            } catch (tagError) {
              console.error('Error adding tags to event:', tagError);
              // Don't fail the whole operation if tags fail
            }
          }

          return newEvent;
        })(),
        timeoutPromise
      ]).catch(error => {
        console.warn('Event creation promise rejected:', error);

        // If it's a timeout error, we'll show a different message but continue
        if (error.message.includes('timed out')) {
          setSuccess('Event creation initiated. Please check the dashboard to confirm.');
          setError('Event creation is taking longer than expected. The event may still be created in the background.');
          // Return a minimal object to prevent further errors
          return { id: 'pending', title: eventData.title };
        }

        // If it's a connection error, provide a clear message
        if (error.message.includes('connection') || error.message.includes('network')) {
          setError(`Database connection issue: ${error.message}. Please check your internet connection and try again.`);
          return null;
        }

        throw error;
      });

      // Check if we have a valid event object
      if (createdEvent && createdEvent.id) {
        // Show success message
        setCreationStep('completed');

        // Different message if it was a timeout but event might have been created
        if (createdEvent.id === 'pending') {
          setSuccess('Event creation initiated. Please check the dashboard to confirm.');
        } else {
          setSuccess(`Event "${createdEvent.title}" created successfully!`);
        }

        // Reset form
        setFormData({
          title: '',
          description: '',
          start_date: '',
          start_time: '09:00',
          end_date: '',
          end_time: '18:00',
          location: '',
          min_participants: '1', // Default to 1 for individual events
          max_participants: '1', // Default to 1 for individual events
          participation_type: 'individual',
          registration_deadline: '',
          category_id: categories.length > 0 ? categories[0].id : '',
          status: 'upcoming',
          registration_method: 'internal',
          external_form_url: '',
          selectedTags: [], // Reset selected tags
          schedule: [
            {
              day: 'Day 1',
              events: [
                { time: '09:00', title: 'Opening Ceremony', location: '' }
              ]
            }
          ]
        });
        setImageFile(null);
        setImagePreview('');
        setUploadProgress(0);
        setVerticalImageFile(null);
        setVerticalImagePreview('');
        setVerticalUploadProgress(0);

        // Notify parent component only if we have a real event ID
        if (createdEvent.id !== 'pending' && onEventCreated) {
          onEventCreated(createdEvent);
        }
      } else {
        // Handle the case where we don't have a valid event object
        setCreationStep('error');
        setError('Failed to create event: No valid event data returned');
      }
    } catch (err) {
      console.error('Error creating event:', err);
      setCreationStep('error');

      // Provide more helpful error messages
      if (err.message.includes('club_id')) {
        setError('Club ID error: You may need to log in again');
      } else if (err.message.includes('category_id')) {
        setError('Category error: Please select a valid category');
      } else if (err.message.includes('date')) {
        setError('Date error: Please check your event dates');
      } else if (err.message.includes('timed out')) {
        setError('Event creation timed out. Please check the dashboard to see if your event was created.');
      } else {
        setError(err.message || 'Failed to create event');
      }
    } finally {
      // Always reset loading state after a delay
      setTimeout(() => {
        setLoading(false);

        // Only reset creation step if it's not 'completed'
        if (creationStep !== 'completed') {
          setCreationStep('');
        }
      }, 1000); // Longer delay to ensure UI updates properly
    }
  };

  return (
    <div className="event-creation-form" style={{ padding: '2rem 0' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            backgroundColor: 'var(--dark-surface)',
            borderRadius: '10px',
            padding: '2rem',
            marginBottom: '2rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0 }}>Create New Event</h2>
            <button
              type="button"
              className="btn"
              onClick={() => setCurrentPage('club-dashboard')}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text-primary)',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Back to Dashboard
            </button>
          </div>

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

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem' }}>
                Basic Information
              </h3>

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
                  Event Title <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
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
                  placeholder="Enter event title"
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
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
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
                  placeholder="Describe your event"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="category_id"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Category
                  </label>
                  <CustomSelect
                    id="category_id"
                    name="category_id"
                    value={formData.category_id || ''}
                    onChange={handleInputChange}
                    required
                    options={categories && categories.length > 0 ?
                      Array.from(
                        // Use a Map to deduplicate categories by name
                        categories.reduce((map, category) => {
                          // Only add if this category name isn't already in the map
                          if (!map.has(category.name.toLowerCase())) {
                            map.set(category.name.toLowerCase(), category);
                          }
                          return map;
                        }, new Map()).values()
                      ).map(category => ({
                        value: category.id,
                        label: category.name
                      })) :
                      [{ value: '1', label: 'Technical' }]
                    }
                    placeholder="Select a category"
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="status"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Status
                  </label>
                  <CustomSelect
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    options={[
                      { value: 'upcoming', label: 'Upcoming' },
                      { value: 'ongoing', label: 'Ongoing' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'cancelled', label: 'Cancelled' }
                    ]}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Event Tags
                </label>
                <MultiSelect
                  id="selectedTags"
                  name="selectedTags"
                  value={formData.selectedTags}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      selectedTags: e.target.value
                    }));
                  }}
                  options={Array.from(
                    // Use a Map to deduplicate tags by name
                    tags.reduce((map, tag) => {
                      // Only add if this tag name isn't already in the map
                      if (!map.has(tag.name.toLowerCase())) {
                        map.set(tag.name.toLowerCase(), tag);
                      }
                      return map;
                    }, new Map()).values()
                  ).map(tag => ({
                    value: tag.id,
                    label: tag.name
                  }))}
                  placeholder="Select tags for your event"
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Click to select multiple tags for your event. Tags help attendees find your event more easily.
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
                  Event Banners
                </h4>

                {/* Horizontal Banner */}
                <div style={{ marginBottom: '1.5rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '8px' }}>
                  <label
                    htmlFor="image"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Horizontal Banner (Main Event Banner)
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    This banner will be used as the main event image. Recommended size: 1200×600px (2:1 ratio).
                  </p>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
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

                  {imagePreview && (
                    <div style={{ marginTop: '1rem' }}>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Preview:</p>
                      <img
                        src={imagePreview}
                        alt="Horizontal banner preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '200px',
                          borderRadius: '4px',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  )}

                  {uploadProgress > 0 && (
                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: 0, color: uploadProgress === 100 ? '#2ecc71' : 'var(--primary)' }}>
                          {uploadProgress === 100 ? 'Upload Complete!' : `Uploading Horizontal Banner: ${uploadProgress}%`}
                        </p>
                        {uploadProgress === 100 && (
                          <span style={{ color: '#2ecc71', fontSize: '1.2rem' }}>✓</span>
                        )}
                      </div>

                      <div style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${uploadProgress}%`,
                          height: '100%',
                          backgroundColor: uploadProgress === 100 ? '#2ecc71' : 'var(--primary)',
                          transition: 'width 0.3s ease',
                          boxShadow: '0 0 5px rgba(0, 0, 0, 0.3)'
                        }} />
                      </div>

                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
                        {uploadProgress < 30 && 'Reading file...'}
                        {uploadProgress >= 30 && uploadProgress < 50 && 'Processing image...'}
                        {uploadProgress >= 50 && uploadProgress < 90 && 'Uploading to server...'}
                        {uploadProgress >= 90 && uploadProgress < 100 && 'Finalizing...'}
                        {uploadProgress === 100 && 'Image uploaded successfully!'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Vertical Banner */}
                <div style={{ marginBottom: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '8px' }}>
                  <label
                    htmlFor="verticalImage"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Vertical Banner (For Sharing on Social Media)
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    This banner will be used for Instagram stories and other vertical formats. Recommended size: 1080×1920px (9:16 ratio).
                  </p>
                  <input
                    type="file"
                    id="verticalImage"
                    name="verticalImage"
                    accept="image/*"
                    onChange={handleVerticalImageChange}
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

                  {verticalImagePreview && (
                    <div style={{ marginTop: '1rem' }}>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Preview:</p>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <img
                          src={verticalImagePreview}
                          alt="Vertical banner preview"
                          style={{
                            maxWidth: '200px',
                            maxHeight: '356px', // Maintain 9:16 aspect ratio
                            borderRadius: '4px',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {verticalUploadProgress > 0 && (
                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: 0, color: verticalUploadProgress === 100 ? '#2ecc71' : 'var(--primary)' }}>
                          {verticalUploadProgress === 100 ? 'Upload Complete!' : `Uploading Vertical Banner: ${verticalUploadProgress}%`}
                        </p>
                        {verticalUploadProgress === 100 && (
                          <span style={{ color: '#2ecc71', fontSize: '1.2rem' }}>✓</span>
                        )}
                      </div>

                      <div style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${verticalUploadProgress}%`,
                          height: '100%',
                          backgroundColor: verticalUploadProgress === 100 ? '#2ecc71' : 'var(--primary)',
                          transition: 'width 0.3s ease',
                          boxShadow: '0 0 5px rgba(0, 0, 0, 0.3)'
                        }} />
                      </div>

                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
                        {verticalUploadProgress < 30 && 'Reading file...'}
                        {verticalUploadProgress >= 30 && verticalUploadProgress < 50 && 'Processing image...'}
                        {verticalUploadProgress >= 50 && verticalUploadProgress < 90 && 'Uploading to server...'}
                        {verticalUploadProgress >= 90 && verticalUploadProgress < 100 && 'Finalizing...'}
                        {verticalUploadProgress === 100 && 'Image uploaded successfully!'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem' }}>
                Date and Time
              </h3>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="start_date"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Start Date <span style={{ color: 'var(--primary)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
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
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="start_time"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Start Time
                  </label>
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    value={formData.start_time}
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
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="end_date"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    End Date <span style={{ color: 'var(--primary)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
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
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="end_time"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    End Time
                  </label>
                  <input
                    type="time"
                    id="end_time"
                    name="end_time"
                    value={formData.end_time}
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
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="registration_deadline"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Registration Deadline
                  </label>
                  <input
                    type="date"
                    id="registration_deadline"
                    name="registration_deadline"
                    value={formData.registration_deadline}
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
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="location"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
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
                    placeholder="Event location"
                  />
                </div>
              </div>
            </div>

            {/* Registration Options */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem' }}>
                Registration Options
              </h3>

              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Participation Type <span style={{ color: 'var(--primary)' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="participation_type"
                      value="individual"
                      checked={formData.participation_type === 'individual'}
                      onChange={(e) => {
                        // When switching to individual, set min/max participants to 1
                        if (e.target.value === 'individual') {
                          setFormData(prev => ({
                            ...prev,
                            participation_type: e.target.value,
                            min_participants: '1',
                            max_participants: '1'
                          }));
                        } else {
                          handleInputChange(e);
                        }
                      }}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span>Solo Event (Individual)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="participation_type"
                      value="team"
                      checked={formData.participation_type === 'team'}
                      onChange={(e) => {
                        // When switching to team, set default team size if not already set
                        if (formData.min_participants === '1' && formData.max_participants === '1') {
                          setFormData(prev => ({
                            ...prev,
                            participation_type: e.target.value,
                            min_participants: '2',
                            max_participants: '5'
                          }));
                        } else {
                          handleInputChange(e);
                        }
                      }}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span>Team Event</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="participation_type"
                      value="both"
                      checked={formData.participation_type === 'both'}
                      onChange={(e) => {
                        // When switching to both, set default team size if not already set
                        if (formData.min_participants === '1' && formData.max_participants === '1') {
                          setFormData(prev => ({
                            ...prev,
                            participation_type: e.target.value,
                            min_participants: '2',
                            max_participants: '5'
                          }));
                        } else {
                          handleInputChange(e);
                        }
                      }}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span>Both (Solo & Team)</span>
                  </label>
                </div>
              </div>

              {/* Team size options */}
              <div style={{ marginBottom: '1.5rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>Team Size Requirements</h4>

                {formData.participation_type === 'individual' ? (
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    This is a solo event. Each participant will register individually.
                  </p>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label
                          htmlFor="min_participants"
                          style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          Minimum Members per Team <span style={{ color: 'var(--primary)' }}>*</span>
                        </label>
                        <input
                          type="number"
                          id="min_participants"
                          name="min_participants"
                          value={formData.min_participants}
                          onChange={handleInputChange}
                          min="2"
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
                          placeholder="Min team members"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="max_participants"
                          style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          Maximum Members per Team <span style={{ color: 'var(--primary)' }}>*</span>
                        </label>
                        <input
                          type="number"
                          id="max_participants"
                          name="max_participants"
                          value={formData.max_participants}
                          onChange={handleInputChange}
                          min={formData.min_participants || 2}
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
                          placeholder="Max team members"
                        />
                      </div>
                    </div>
                    <p style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)',
                      marginTop: '0.75rem',
                      padding: '0.5rem',
                      backgroundColor: 'rgba(110, 68, 255, 0.1)',
                      borderRadius: '4px'
                    }}>
                      <strong>Note:</strong> There is no limit on the number of teams that can register for this event.
                      These settings only control the minimum and maximum number of members allowed per team.
                    </p>
                  </>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Registration Method
                </label>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="registration_method"
                      value="internal"
                      checked={formData.registration_method === 'internal'}
                      onChange={handleInputChange}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span>Use Platform Registration</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="registration_method"
                      value="external"
                      checked={formData.registration_method === 'external'}
                      onChange={handleInputChange}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span>Use External Google Form</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="registration_method"
                      value="both"
                      checked={formData.registration_method === 'both'}
                      onChange={handleInputChange}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span>Use Both Methods</span>
                  </label>
                </div>

                <div style={{ marginTop: '1rem', marginBottom: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '0.5rem' }}>
                    <input
                      type="checkbox"
                      name="registration_open"
                      checked={formData.registration_open}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          registration_open: e.target.checked
                        }));
                      }}
                      style={{ marginRight: '0.5rem', width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                    />
                    <span style={{ fontWeight: 'bold' }}>Allow participants to register for this event</span>
                  </label>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 1.5rem' }}>
                    {formData.registration_open
                      ? "Registration is currently open. Participants can register for this event."
                      : "Registration is currently closed. Participants cannot register for this event."}
                  </p>
                </div>

                {(formData.registration_method === 'external' || formData.registration_method === 'both') && (
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
                      Google Form URL <span style={{ color: 'var(--primary)' }}>*</span>
                    </label>
                    <input
                      type="url"
                      id="external_form_url"
                      name="external_form_url"
                      value={formData.external_form_url}
                      onChange={handleInputChange}
                      required={formData.registration_method !== 'internal'}
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
            </div>

            {/* Event Schedule */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem', width: '100%' }}>
                  Event Schedule
                </h3>
                <button
                  type="button"
                  onClick={addScheduleDay}
                  style={{
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    color: '#3498db',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    marginLeft: '1rem'
                  }}
                >
                  Add Day
                </button>
              </div>

              {formData.schedule.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    marginBottom: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0 }}>{day.day}</h4>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => addScheduleEvent(dayIndex)}
                        style={{
                          backgroundColor: 'rgba(46, 204, 113, 0.2)',
                          color: '#2ecc71',
                          border: 'none',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Add Event
                      </button>

                      {formData.schedule.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScheduleDay(dayIndex)}
                          style={{
                            backgroundColor: 'rgba(231, 76, 60, 0.2)',
                            color: '#e74c3c',
                            border: 'none',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          Remove Day
                        </button>
                      )}
                    </div>
                  </div>

                  {day.events.map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      style={{
                        display: 'flex',
                        gap: '1rem',
                        marginBottom: eventIndex < day.events.length - 1 ? '1rem' : 0,
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ width: '100px' }}>
                        <input
                          type="time"
                          value={event.time}
                          onChange={(e) => handleScheduleChange(dayIndex, eventIndex, 'time', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.6rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>

                      <div style={{ flex: 2 }}>
                        <input
                          type="text"
                          value={event.title}
                          onChange={(e) => handleScheduleChange(dayIndex, eventIndex, 'title', e.target.value)}
                          placeholder="Event title"
                          style={{
                            width: '100%',
                            padding: '0.6rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          value={event.location}
                          onChange={(e) => handleScheduleChange(dayIndex, eventIndex, 'location', e.target.value)}
                          placeholder="Location (optional)"
                          style={{
                            width: '100%',
                            padding: '0.6rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeScheduleEvent(dayIndex, eventIndex)}
                        style={{
                          backgroundColor: 'rgba(231, 76, 60, 0.2)',
                          color: '#e74c3c',
                          border: 'none',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '4px',
                  cursor: loading ? 'wait' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  minWidth: '200px'
                }}
              >
                {loading ? (
                  <>
                    {creationStep === 'validating' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-icons" style={{ marginRight: '8px', fontSize: '18px' }}>check_circle</span>
                        Validating form...
                      </div>
                    )}
                    {creationStep === 'processing_dates' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-icons" style={{ marginRight: '8px', fontSize: '18px' }}>event</span>
                        Processing dates...
                      </div>
                    )}
                    {creationStep === 'uploading_image' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-icons" style={{ marginRight: '8px', fontSize: '18px' }}>cloud_upload</span>
                        Uploading image... {uploadProgress}%
                      </div>
                    )}
                    {creationStep === 'processing_schedule' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-icons" style={{ marginRight: '8px', fontSize: '18px' }}>schedule</span>
                        Processing schedule...
                      </div>
                    )}
                    {creationStep === 'checking_connection' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-icons" style={{ marginRight: '8px', fontSize: '18px', animation: 'spin 1.5s linear infinite' }}>sync</span>
                        <style jsx>{`
                          @keyframes spin {
                            to { transform: rotate(360deg); }
                          }
                        `}</style>
                        Checking database connection...
                      </div>
                    )}
                    {creationStep === 'saving_to_database' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-icons" style={{ marginRight: '8px', fontSize: '18px' }}>save</span>
                        Saving to database...
                      </div>
                    )}
                    {creationStep === 'completed' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-icons" style={{ marginRight: '8px', fontSize: '18px', color: '#2ecc71' }}>check_circle</span>
                        Event created!
                      </div>
                    )}
                    {creationStep === 'error' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-icons" style={{ marginRight: '8px', fontSize: '18px', color: '#e74c3c' }}>error</span>
                        Error occurred!
                      </div>
                    )}
                    {!creationStep && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-icons" style={{ marginRight: '8px', fontSize: '18px' }}>hourglass_empty</span>
                        Creating event...
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-icons" style={{ marginRight: '8px', fontSize: '18px' }}>add_circle</span>
                    Create Event
                  </div>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

