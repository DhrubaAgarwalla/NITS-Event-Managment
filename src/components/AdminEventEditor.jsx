import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import eventService from '../services/eventService';
import { uploadImage } from '../lib/cloudinary';

const AdminEventEditor = ({ event, onClose, onUpdate }) => {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [formData, setFormData] = useState({
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
    image_url: '',
    vertical_image_url: '', // Added vertical banner URL
    is_featured: false,
    selectedTags: []
  });

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
  // Horizontal banner (main event banner)
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Vertical banner (for sharing)
  const [verticalImageFile, setVerticalImageFile] = useState(null);
  const [verticalImagePreview, setVerticalImagePreview] = useState('');
  const [verticalUploadProgress, setVerticalUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load categories, tags and initialize form with event data
  useEffect(() => {
    const loadCategoriesAndTags = async () => {
      try {
        // Load categories
        const categoriesData = await eventService.getCategories();
        setCategories(categoriesData || []);

        // Load tags - already deduplicated and sorted in the service
        const tagsData = await eventService.getAllTags();
        setTags(tagsData);
      } catch (err) {
        console.error('Error loading categories or tags:', err);
        setError('Failed to load categories or tags');
      }
    };

    loadCategoriesAndTags();

    // Initialize form with event data if available
    if (event) {
      // Format dates for form inputs
      const startDate = event.start_date ? format(new Date(event.start_date), 'yyyy-MM-dd') : '';
      const startTime = event.start_date ? format(new Date(event.start_date), 'HH:mm') : '09:00';
      const endDate = event.end_date ? format(new Date(event.end_date), 'yyyy-MM-dd') : '';
      const endTime = event.end_date ? format(new Date(event.end_date), 'HH:mm') : '18:00';
      const registrationDeadline = event.registration_deadline
        ? format(new Date(event.registration_deadline), 'yyyy-MM-dd')
        : '';

      // Load event tags directly from the database
      const loadEventTags = async () => {
        try {
          const eventTags = await eventService.getEventTags(event.id);
          const selectedTagIds = eventTags.map(tag => tag.id);

          // Update form data with the loaded tags
          setFormData(prevData => ({
            ...prevData,
            selectedTags: selectedTagIds
          }));
        } catch (err) {
          console.error('Error loading event tags:', err);
        }
      };

      // Call the function to load event tags
      loadEventTags();

      setFormData({
        title: event.title || '',
        description: event.description || '',
        start_date: startDate,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime,
        location: event.location || '',
        max_participants: event.max_participants?.toString() || '',
        registration_deadline: registrationDeadline,
        status: event.status || 'upcoming',
        category_id: event.category_id || '',
        registration_method: event.registration_method || 'internal',
        external_form_url: event.external_form_url || '',
        image_url: event.image_url || '',
        vertical_image_url: event.vertical_image_url || '',
        is_featured: event.is_featured || false,
        selectedTags: [] // Will be populated by loadEventTags function
      });

      // Set image previews if URLs exist
      if (event.image_url) {
        setImagePreview(event.image_url);
      }

      if (event.vertical_image_url) {
        setVerticalImagePreview(event.vertical_image_url);
      }
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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

  // Handle horizontal image file selection
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Horizontal banner must be less than 10MB');
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle vertical image file selection
  const handleVerticalImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Vertical banner must be less than 10MB');
        return;
      }

      setVerticalImageFile(file);
      setVerticalImagePreview(URL.createObjectURL(file));
    }
  };

  // Upload horizontal image to Cloudinary
  const uploadImageToCloudinary = async (file) => {
    try {
      setUploadProgress(0);

      // Update progress callback function
      const updateProgress = (progress) => {
        console.log(`Horizontal banner upload progress: ${progress}%`);
        setUploadProgress(progress);
      };

      // Upload to Cloudinary with progress tracking
      const result = await uploadImage(file, 'event-images', updateProgress);

      if (!result || !result.url) {
        throw new Error('Horizontal banner upload failed: No URL returned from Cloudinary');
      }

      setUploadProgress(100);
      return result.url;
    } catch (err) {
      console.error('Error uploading horizontal banner to Cloudinary:', err);
      throw err;
    }
  };

  // Upload vertical image to Cloudinary
  const uploadVerticalImageToCloudinary = async (file) => {
    try {
      setVerticalUploadProgress(0);

      // Update progress callback function
      const updateProgress = (progress) => {
        console.log(`Vertical banner upload progress: ${progress}%`);
        setVerticalUploadProgress(progress);
      };

      // Upload to Cloudinary with progress tracking
      const result = await uploadImage(file, 'event-images-vertical', updateProgress);

      if (!result || !result.url) {
        throw new Error('Vertical banner upload failed: No URL returned from Cloudinary');
      }

      setVerticalUploadProgress(100);
      return result.url;
    } catch (err) {
      console.error('Error uploading vertical banner to Cloudinary:', err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validate form
      if (!formData.title) {
        throw new Error('Event title is required');
      }
      if (!formData.start_date) {
        throw new Error('Start date is required');
      }
      if (!formData.end_date) {
        throw new Error('End date is required');
      }
      if (!formData.category_id) {
        throw new Error('Category is required');
      }

      // Prepare date objects
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);

      // Validate dates
      if (isNaN(startDateTime.getTime())) {
        throw new Error('Invalid start date/time');
      }
      if (isNaN(endDateTime.getTime())) {
        throw new Error('Invalid end date/time');
      }
      if (endDateTime <= startDateTime) {
        throw new Error('End date/time must be after start date/time');
      }

      // Upload horizontal banner if a new one is selected
      let imageUrl = formData.image_url;
      if (imageFile) {
        try {
          setError('Uploading horizontal banner...');
          imageUrl = await uploadImageToCloudinary(imageFile);
        } catch (uploadError) {
          throw new Error(`Error uploading horizontal banner: ${uploadError.message}`);
        }
      }

      // Upload vertical banner if a new one is selected
      let verticalImageUrl = formData.vertical_image_url;
      if (verticalImageFile) {
        try {
          setError('Uploading vertical banner...');
          verticalImageUrl = await uploadVerticalImageToCloudinary(verticalImageFile);
        } catch (uploadError) {
          throw new Error(`Error uploading vertical banner: ${uploadError.message}`);
        }
      }

      // Prepare event data
      const eventData = {
        title: formData.title,
        description: formData.description,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        location: formData.location,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        registration_deadline: formData.registration_deadline
          ? new Date(`${formData.registration_deadline}T23:59:59`).toISOString()
          : null,
        status: formData.status,
        category_id: formData.category_id,
        registration_method: formData.registration_method,
        external_form_url: formData.external_form_url || null,
        image_url: imageUrl,
        vertical_image_url: verticalImageUrl, // Add vertical banner URL
        is_featured: formData.is_featured
      };

      // Update event - pass both image files
      const updatedEvent = await eventService.updateEvent(event.id, eventData, imageFile, verticalImageFile);

      // Handle tags separately
      if (formData.selectedTags && Array.isArray(formData.selectedTags)) {
        try {
          // First, get the current tags for the event
          const currentTags = await eventService.getEventTags(event.id);
          const currentTagIds = currentTags.map(tag => tag.id);

          // Find tags to remove (tags that were in currentTags but not in selectedTags)
          const tagsToRemove = currentTagIds.filter(id => !formData.selectedTags.includes(id));
          if (tagsToRemove.length > 0) {
            await eventService.removeTagsFromEvent(event.id, tagsToRemove);
          }

          // Find tags to add (tags that are in selectedTags but not in currentTags)
          const tagsToAdd = formData.selectedTags.filter(id => !currentTagIds.includes(id));
          if (tagsToAdd.length > 0) {
            await eventService.addTagsToEvent(event.id, tagsToAdd);
          }
        } catch (tagError) {
          console.error('Error updating event tags:', tagError);
          // Don't fail the whole operation if tags update fails
        }
      }

      // Show success message
      setSuccess(true);

      // Notify parent component
      if (onUpdate) {
        // Fetch the updated event with tags to pass to the parent
        const refreshedEvent = await eventService.getEventById(event.id);
        onUpdate(refreshedEvent);
      }

      // Close after a delay
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);
    } catch (err) {
      console.error('Error updating event:', err);
      setError(err.message || 'An error occurred while updating the event');
    } finally {
      setIsLoading(false);
    }
  };

  // No need to handle body scrolling for full page component

  // Common styles
  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.8rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    color: 'var(--text-primary)',
    fontSize: '0.95rem'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.4rem',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)'
  };

  return (
    <motion.div
      className="event-editor full-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: 'var(--dark-bg)',
        padding: '2rem 0'
      }}
    >
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', backgroundColor: 'var(--dark-surface)', padding: '1rem', borderRadius: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Edit Event</h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'var(--text-primary)',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>Back</span> ↩
          </button>
        </div>

        <div style={{ backgroundColor: 'var(--dark-surface)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>

          {error && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                borderLeft: '4px solid #ff0033',
                marginBottom: '1rem',
                color: '#ff0033',
                fontSize: '0.9rem'
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                borderLeft: '4px solid #00cc00',
                marginBottom: '1rem',
                color: '#00cc00',
                fontSize: '0.9rem'
              }}
            >
              Event updated successfully!
            </div>
          )}

          <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.1rem' }}>Basic Information</h3>

          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label htmlFor="title" style={labelStyle}>
              Event Title <span style={{ color: 'var(--primary)' }}>*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label htmlFor="description" style={labelStyle}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              style={{
                ...inputStyle,
                minHeight: '80px',
                resize: 'vertical'
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label htmlFor="category_id" style={labelStyle}>
              Category <span style={{ color: 'var(--primary)' }}>*</span>
            </label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              style={inputStyle}
            >
              <option value="">Select a category</option>
              {Array.from(
                // Use a Map to deduplicate categories by name
                categories.reduce((map, category) => {
                  // Only add if this category name isn't already in the map
                  if (!map.has(category.name.toLowerCase())) {
                    map.set(category.name.toLowerCase(), category);
                  }
                  return map;
                }, new Map()).values()
              ).map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label htmlFor="status" style={labelStyle}>
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="is_featured"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                style={{ width: 'auto' }}
              />
              <label htmlFor="is_featured" style={{ fontSize: '0.95rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Feature this event on the homepage
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label htmlFor="start_date" style={labelStyle}>
                Start Date <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div className="form-group">
              <label htmlFor="start_time" style={labelStyle}>
                Start Time <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <input
                type="time"
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
            <div className="form-group">
              <label htmlFor="end_date" style={labelStyle}>
                End Date <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_time" style={labelStyle}>
                End Time <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <input
                type="time"
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '0.75rem', marginTop: '0.75rem' }}>
            <label htmlFor="location" style={labelStyle}>
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label htmlFor="max_participants" style={labelStyle}>
                Max Participants
              </label>
              <input
                type="number"
                id="max_participants"
                name="max_participants"
                value={formData.max_participants}
                onChange={handleChange}
                min="1"
                style={inputStyle}
              />
            </div>

            <div className="form-group">
              <label htmlFor="registration_deadline" style={labelStyle}>
                Registration Deadline
              </label>
              <input
                type="date"
                id="registration_deadline"
                name="registration_deadline"
                value={formData.registration_deadline}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.1rem' }}>Registration Settings</h3>

          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label htmlFor="registration_method" style={labelStyle}>
              Registration Method
            </label>
            <select
              id="registration_method"
              name="registration_method"
              value={formData.registration_method}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="internal">Internal (Use platform registration)</option>
              <option value="external">External (Use Google Form)</option>
            </select>
          </div>

          {formData.registration_method === 'external' && (
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="external_form_url" style={labelStyle}>
                External Form URL {formData.registration_method === 'external' && <span style={{ color: 'var(--primary)' }}>*</span>}
              </label>
              <input
                type="url"
                id="external_form_url"
                name="external_form_url"
                value={formData.external_form_url}
                onChange={handleChange}
                required={formData.registration_method === 'external'}
                style={inputStyle}
                placeholder="https://forms.google.com/..."
              />
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.1rem' }}>Tags</h3>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>
              Event Tags
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              {/* Create a Map to deduplicate tags by name */}
              {Array.from(
                // Use a Map to deduplicate tags by name
                tags.reduce((map, tag) => {
                  // Only add if this tag name isn't already in the map
                  if (!map.has(tag.name.toLowerCase())) {
                    map.set(tag.name.toLowerCase(), tag);
                  }
                  return map;
                }, new Map()).values()
              ).map(tag => (
                <div
                  key={tag.id}
                  onClick={() => handleTagSelection(tag.id)}
                  style={{
                    backgroundColor: formData.selectedTags.includes(tag.id) ? tag.color : 'rgba(255, 255, 255, 0.05)',
                    color: formData.selectedTags.includes(tag.id) ? '#fff' : 'var(--text-primary)',
                    border: `1px solid ${formData.selectedTags.includes(tag.id) ? tag.color : 'rgba(255, 255, 255, 0.1)'}`,
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '0.9rem',
                    fontWeight: formData.selectedTags.includes(tag.id) ? '500' : 'normal',
                    textAlign: 'center'
                  }}
                >
                  {tag.name}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Click to select multiple tags for your event. Tags help attendees find your event more easily.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.1rem' }}>Event Banners</h3>

          {/* Horizontal Banner */}
          <div style={{ marginBottom: '1.5rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '1rem' }}>Horizontal Banner (Main Event Banner)</h4>

            <div style={{
              border: '2px dashed rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center',
              marginBottom: '1rem',
              cursor: 'pointer',
              backgroundColor: 'rgba(255, 255, 255, 0.05)'
            }}
            onClick={() => document.getElementById('admin-event-image-upload').click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Horizontal Banner Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '250px',
                    borderRadius: '8px',
                    marginBottom: '0.5rem'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>➕</div>
                    <div>Click to upload horizontal banner</div>
                  </div>
                </div>
              )}
              <input
                type="file"
                id="admin-event-image-upload"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Recommended: 1200x600px (2:1 ratio), max 10MB
              </div>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Uploading horizontal banner... {uploadProgress}%
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
                    backgroundColor: 'var(--primary)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="image_url" style={labelStyle}>
                Horizontal Banner URL (Optional - Upload above or enter URL)
              </label>
              <input
                type="url"
                id="image_url"
                name="image_url"
                value={formData.image_url}
                onChange={(e) => {
                  handleChange(e);
                  if (e.target.value) {
                    setImagePreview(e.target.value);
                  }
                }}
                style={inputStyle}
                placeholder="https://example.com/horizontal-banner.jpg"
              />
            </div>
          </div>

          {/* Vertical Banner */}
          <div style={{ marginBottom: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '1rem' }}>Vertical Banner (For Sharing on Social Media)</h4>

            <div style={{
              border: '2px dashed rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center',
              marginBottom: '1rem',
              cursor: 'pointer',
              backgroundColor: 'rgba(255, 255, 255, 0.05)'
            }}
            onClick={() => document.getElementById('admin-vertical-image-upload').click()}
            >
              {verticalImagePreview ? (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={verticalImagePreview}
                    alt="Vertical Banner Preview"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '356px', // Maintain 9:16 aspect ratio
                      borderRadius: '8px',
                      marginBottom: '0.5rem'
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  width: '100%',
                  height: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>➕</div>
                    <div>Click to upload vertical banner</div>
                  </div>
                </div>
              )}
              <input
                type="file"
                id="admin-vertical-image-upload"
                accept="image/*"
                onChange={handleVerticalImageChange}
                style={{ display: 'none' }}
              />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Recommended: 1080x1920px (9:16 ratio), max 10MB
              </div>
            </div>

            {verticalUploadProgress > 0 && verticalUploadProgress < 100 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Uploading vertical banner... {verticalUploadProgress}%
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
                    backgroundColor: 'var(--primary)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="vertical_image_url" style={labelStyle}>
                Vertical Banner URL (Optional - Upload above or enter URL)
              </label>
              <input
                type="url"
                id="vertical_image_url"
                name="vertical_image_url"
                value={formData.vertical_image_url}
                onChange={(e) => {
                  handleChange(e);
                  if (e.target.value) {
                    setVerticalImagePreview(e.target.value);
                  }
                }}
                style={inputStyle}
                placeholder="https://example.com/vertical-banner.jpg"
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.95rem'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: 'var(--primary)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.95rem',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminEventEditor;
