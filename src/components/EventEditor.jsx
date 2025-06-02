  import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import eventService from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage } from '../lib/cloudinary';

import logger from '../utils/logger';
const EventEditor = ({ event, onClose, onUpdate }) => {
  const { club } = useAuth();
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
    min_participants: '1',
    max_participants: '1',
    participation_type: 'individual', // 'individual', 'team', or 'both'
    registration_deadline: '',
    status: 'upcoming',
    category_id: '',
    registration_method: 'internal',
    external_form_url: '',
    image_url: '',
    vertical_image_url: '', // Added vertical banner URL
    registration_open: true,
    selectedTags: [],
    // Payment fields
    requires_payment: false,
    payment_amount: '',
    payment_upi_id: '',
    payment_qr_code: '',
    payment_instructions: 'Please complete the payment and upload the screenshot as proof.',
    // Custom registration fields
    custom_fields: [],
    // Schedule data
    schedule: [
      {
        date: '',
        events: [
          { time: '09:00', title: 'Opening Ceremony', location: '' }
        ]
      }
    ]
  });
  // Horizontal banner (main event banner)
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Vertical banner (for sharing)
  const [verticalImageFile, setVerticalImageFile] = useState(null);
  const [verticalImagePreview, setVerticalImagePreview] = useState('');
  const [verticalUploadProgress, setVerticalUploadProgress] = useState(0);

  // Payment QR code
  const [paymentQRFile, setPaymentQRFile] = useState(null);
  const [paymentQRPreview, setPaymentQRPreview] = useState('');
  const [paymentQRUploadProgress, setPaymentQRUploadProgress] = useState(0);

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
        logger.error('Error loading categories or tags:', err);
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
          logger.error('Error loading event tags:', err);
        }
      };

      // Call the function to load event tags
      loadEventTags();

      // Get schedule data from event if available
      let scheduleData = [
        {
          day: 'Day 1',
          events: [
            { time: '09:00', title: 'Opening Ceremony', location: '' }
          ]
        }
      ];

      // Check if event has additional_info with schedule
      if (event.additional_info && event.additional_info.schedule && Array.isArray(event.additional_info.schedule)) {
        scheduleData = event.additional_info.schedule;
      }

      setFormData({
        title: event.title || '',
        description: event.description || '',
        start_date: startDate,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime,
        location: event.location || '',
        min_participants: event.min_participants?.toString() || '1',
        max_participants: event.max_participants?.toString() || '1',
        participation_type: event.participation_type || 'individual',
        registration_deadline: registrationDeadline,
        status: event.status || 'upcoming',
        category_id: event.category_id || '',
        registration_method: event.registration_method || 'internal',
        external_form_url: event.external_form_url || '',
        image_url: event.image_url || '',
        vertical_image_url: event.vertical_image_url || '',
        registration_open: event.registration_open !== false, // Default to true if not explicitly set to false
        selectedTags: [], // Will be populated by loadEventTags function
        // Payment fields
        requires_payment: event.requires_payment || false,
        payment_amount: event.payment_amount?.toString() || '',
        payment_upi_id: event.payment_upi_id || '',
        payment_qr_code: event.payment_qr_code || '',
        payment_instructions: event.payment_instructions || 'Please complete the payment and upload the screenshot as proof.',
        // Custom registration fields
        custom_fields: event.custom_fields || [],
        schedule: scheduleData
      });

      // Set image previews if URLs exist
      if (event.image_url) {
        setImagePreview(event.image_url);
      }

      if (event.vertical_image_url) {
        setVerticalImagePreview(event.vertical_image_url);
      }

      if (event.payment_qr_code) {
        setPaymentQRPreview(event.payment_qr_code);
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

  // Custom fields management
  const addCustomField = () => {
    const newField = {
      id: Date.now().toString(),
      label: '',
      type: 'text',
      required: false,
      options: [] // For select/radio/checkbox types
    };

    setFormData(prev => ({
      ...prev,
      custom_fields: [...prev.custom_fields, newField]
    }));
  };

  const removeCustomField = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.filter(field => field.id !== fieldId)
    }));
  };

  const updateCustomField = (fieldId, updates) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const addCustomFieldOption = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.map(field =>
        field.id === fieldId
          ? { ...field, options: [...field.options, ''] }
          : field
      )
    }));
  };

  const updateCustomFieldOption = (fieldId, optionIndex, value) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.map(field =>
        field.id === fieldId
          ? {
              ...field,
              options: field.options.map((option, index) =>
                index === optionIndex ? value : option
              )
            }
          : field
      )
    }));
  };

  const removeCustomFieldOption = (fieldId, optionIndex) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.map(field =>
        field.id === fieldId
          ? {
              ...field,
              options: field.options.filter((_, index) => index !== optionIndex)
            }
          : field
      )
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

  // Handle schedule changes
  const handleScheduleChange = (dayIndex, eventIndex, field, value) => {
    const updatedSchedule = [...formData.schedule];
    updatedSchedule[dayIndex].events[eventIndex][field] = value;

    setFormData(prev => ({
      ...prev,
      schedule: updatedSchedule
    }));
  };

  // Handle schedule date changes
  const handleScheduleDateChange = (dayIndex, date) => {
    const updatedSchedule = [...formData.schedule];
    updatedSchedule[dayIndex].date = date;

    setFormData(prev => ({
      ...prev,
      schedule: updatedSchedule
    }));
  };

  // Add a new day to the schedule
  const addScheduleDay = () => {
    // Calculate the next date based on the last schedule date or start_date
    let nextDate = '';
    if (formData.schedule.length > 0) {
      const lastDate = formData.schedule[formData.schedule.length - 1].date;
      if (lastDate) {
        const lastDateObj = new Date(lastDate);
        lastDateObj.setDate(lastDateObj.getDate() + 1);
        nextDate = lastDateObj.toISOString().split('T')[0];
      }
    }

    // If no date calculated and start_date exists, use start_date + schedule length
    if (!nextDate && formData.start_date) {
      const startDateObj = new Date(formData.start_date);
      startDateObj.setDate(startDateObj.getDate() + formData.schedule.length);
      nextDate = startDateObj.toISOString().split('T')[0];
    }

    setFormData(prev => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        {
          date: nextDate,
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

  // Handle payment QR code file selection
  const handlePaymentQRChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Payment QR code must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Payment QR code must be an image file');
        return;
      }

      setPaymentQRFile(file);
      setPaymentQRPreview(URL.createObjectURL(file));
    }
  };

  // Upload horizontal image to Cloudinary
  const uploadImageToCloudinary = async (file) => {
    try {
      setUploadProgress(0);

      // Update progress callback function
      const updateProgress = (progress) => {
        logger.log(`Horizontal banner upload progress: ${progress}%`);
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
      logger.error('Error uploading horizontal banner to Cloudinary:', err);
      throw err;
    }
  };

  // Upload vertical image to Cloudinary
  const uploadVerticalImageToCloudinary = async (file) => {
    try {
      setVerticalUploadProgress(0);

      // Update progress callback function
      const updateProgress = (progress) => {
        logger.log(`Vertical banner upload progress: ${progress}%`);
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
      logger.error('Error uploading vertical banner to Cloudinary:', err);
      throw err;
    }
  };

  // Upload payment QR code to Cloudinary
  const uploadPaymentQRToCloudinary = async (file) => {
    try {
      setPaymentQRUploadProgress(0);

      // Update progress callback function
      const updateProgress = (progress) => {
        logger.log(`Payment QR code upload progress: ${progress}%`);
        setPaymentQRUploadProgress(progress);
      };

      // Upload to Cloudinary with progress tracking
      const result = await uploadImage(file, 'payment-qr-codes', updateProgress);

      if (!result || !result.url) {
        throw new Error('Payment QR code upload failed: No URL returned from Cloudinary');
      }

      setPaymentQRUploadProgress(100);
      return result.url;
    } catch (err) {
      logger.error('Error uploading payment QR code to Cloudinary:', err);
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

      // Validate payment fields if payment is required
      if (formData.requires_payment) {
        if (!formData.payment_amount || parseFloat(formData.payment_amount) <= 0) {
          throw new Error('Please provide a valid payment amount');
        }
        if (!formData.payment_upi_id) {
          throw new Error('Please provide a UPI ID for payment');
        }
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

      // Upload payment QR code if a new one is selected
      let paymentQRUrl = formData.payment_qr_code;
      if (paymentQRFile && formData.requires_payment) {
        try {
          setError('Uploading payment QR code...');
          paymentQRUrl = await uploadPaymentQRToCloudinary(paymentQRFile);
        } catch (uploadError) {
          // Don't fail the whole operation if QR code upload fails
          logger.error('Payment QR code upload failed:', uploadError);
          setError(`Payment QR code upload failed: ${uploadError.message}. Event will be updated without QR code.`);
          paymentQRUrl = formData.payment_qr_code; // Keep existing QR code
        }
      }

      // Prepare event data
      const eventData = {
        title: formData.title,
        description: formData.description,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        location: formData.location,
        min_participants: formData.participation_type === 'individual' ? 1 : parseInt(formData.min_participants) || 2,
        max_participants: formData.participation_type === 'individual' ? 1 : parseInt(formData.max_participants) || null,
        participation_type: formData.participation_type,
        registration_deadline: formData.registration_deadline
          ? new Date(`${formData.registration_deadline}T23:59:59`).toISOString()
          : null,
        status: formData.status,
        club_id: club.id,
        category_id: formData.category_id,
        registration_method: formData.registration_method,
        external_form_url: formData.external_form_url || null,
        image_url: imageUrl,
        vertical_image_url: verticalImageUrl, // Add vertical banner URL
        registration_open: formData.registration_open,
        // Payment fields
        requires_payment: formData.requires_payment || false,
        payment_amount: formData.requires_payment ? parseFloat(formData.payment_amount) : null,
        payment_upi_id: formData.requires_payment ? formData.payment_upi_id : null,
        payment_qr_code: paymentQRUrl || null,
        payment_instructions: formData.requires_payment ? formData.payment_instructions : null,
        // Custom registration fields
        custom_fields: formData.custom_fields || [],
        additional_info: {
          schedule: formData.schedule
        }
      };

      // Update event - pass both image files
      await eventService.updateEvent(event.id, eventData, imageFile, verticalImageFile);

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
          logger.error('Error updating event tags:', tagError);
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
      logger.error('Error updating event:', err);
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

          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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

          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
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

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>
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
                      handleChange(e);
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
                  onChange={handleChange}
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
                  onChange={handleChange}
                  style={{ marginRight: '0.5rem' }}
                />
                <span>Both (Solo & Team)</span>
              </label>
            </div>
          </div>

          {/* Team size options */}
          <div style={{ marginBottom: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>Team Size Requirements</h4>

            {formData.participation_type === 'individual' ? (
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                This is a solo event. Each participant will register individually.
              </p>
            ) : (
              <>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label
                      htmlFor="min_participants"
                      style={labelStyle}
                    >
                      Minimum Members per Team <span style={{ color: 'var(--primary)' }}>*</span>
                    </label>
                    <input
                      type="number"
                      id="min_participants"
                      name="min_participants"
                      value={formData.min_participants}
                      onChange={handleChange}
                      min="2"
                      required
                      style={inputStyle}
                    />
                  </div>

                  <div className="form-group">
                    <label
                      htmlFor="max_participants"
                      style={labelStyle}
                    >
                      Maximum Members per Team <span style={{ color: 'var(--primary)' }}>*</span>
                    </label>
                    <input
                      type="number"
                      id="max_participants"
                      name="max_participants"
                      value={formData.max_participants}
                      onChange={handleChange}
                      min={formData.min_participants || 2}
                      required
                      style={inputStyle}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
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

          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>
              Registration Status
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="registration_open"
                name="registration_open"
                checked={formData.registration_open}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    registration_open: e.target.checked
                  }));
                }}
                style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
              />
              <label htmlFor="registration_open" style={{ cursor: 'pointer', margin: 0 }}>
                Allow participants to register for this event
              </label>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
              {formData.registration_open
                ? "Registration is currently open. Participants can register for this event."
                : "Registration is currently closed. Participants cannot register for this event."}
            </p>
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
            <div className="tag-container" style={{
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
                  className="tag-item"
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

        {/* Event Schedule */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Event Schedule</h3>
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
                fontSize: '0.9rem'
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
                padding: '1rem',
                marginBottom: '1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', minWidth: '60px' }}>Date:</h4>
                  <input
                    type="date"
                    value={day.date}
                    onChange={(e) => handleScheduleDateChange(dayIndex, e.target.value)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

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

        {/* Payment Settings */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem', fontSize: '1.1rem' }}>
            Payment Settings
          </h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '1rem' }}>
              <input
                type="checkbox"
                name="requires_payment"
                checked={formData.requires_payment}
                onChange={handleChange}
                style={{ marginRight: '0.5rem', transform: 'scale(1.2)' }}
              />
              <span style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                This event requires payment for registration
              </span>
            </label>

            {formData.requires_payment && (
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label
                      htmlFor="payment_amount"
                      style={labelStyle}
                    >
                      Registration Fee (₹) <span style={{ color: 'var(--primary)' }}>*</span>
                    </label>
                    <input
                      type="number"
                      id="payment_amount"
                      name="payment_amount"
                      value={formData.payment_amount}
                      onChange={handleChange}
                      required={formData.requires_payment}
                      min="1"
                      style={inputStyle}
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="payment_upi_id"
                      style={labelStyle}
                    >
                      UPI ID <span style={{ color: 'var(--primary)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="payment_upi_id"
                      name="payment_upi_id"
                      value={formData.payment_upi_id}
                      onChange={handleChange}
                      required={formData.requires_payment}
                      style={inputStyle}
                      placeholder="yourname@paytm"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    htmlFor="payment_instructions"
                    style={labelStyle}
                  >
                    Payment Instructions
                  </label>
                  <textarea
                    id="payment_instructions"
                    name="payment_instructions"
                    value={formData.payment_instructions}
                    onChange={handleChange}
                    rows={3}
                    style={{
                      ...inputStyle,
                      resize: 'vertical'
                    }}
                    placeholder="Additional instructions for payment..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="payment_qr_code"
                    style={labelStyle}
                  >
                    Payment QR Code (Optional)
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Upload a QR code image for easy payment. Students can scan this to pay directly.
                  </p>

                  <div style={{
                    border: '2px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'center',
                    marginBottom: '1rem',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                  }}
                  onClick={() => document.getElementById('payment-qr-upload').click()}
                  >
                    {paymentQRPreview ? (
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <img
                          src={paymentQRPreview}
                          alt="Payment QR code preview"
                          style={{
                            maxWidth: '200px',
                            maxHeight: '200px',
                            borderRadius: '8px',
                            objectFit: 'contain',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '120px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)'
                      }}>
                        <div>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📱</div>
                          <div>Click to upload QR code</div>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      id="payment-qr-upload"
                      accept="image/*"
                      onChange={handlePaymentQRChange}
                      style={{ display: 'none' }}
                    />
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      Recommended: Square image, max 5MB
                    </div>
                  </div>

                  {paymentQRUploadProgress > 0 && paymentQRUploadProgress < 100 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        Uploading QR code... {paymentQRUploadProgress}%
                      </div>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${paymentQRUploadProgress}%`,
                          height: '100%',
                          backgroundColor: 'var(--primary)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Custom Registration Fields */}
        <div className="custom-fields-section" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem', width: '100%', fontSize: '1.1rem' }}>
              Custom Registration Fields
            </h3>
            <button
              type="button"
              onClick={addCustomField}
              className="add-custom-field-btn"
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
              Add Field
            </button>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Add custom fields to collect additional information from participants during registration.
          </p>

          {formData.custom_fields.length === 0 ? (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center',
              border: '2px dashed rgba(255, 255, 255, 0.1)'
            }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                No custom fields added yet. Click "Add Field" to create your first custom field.
              </p>
            </div>
          ) : (
            formData.custom_fields.map((field, index) => (
              <div
                key={field.id}
                className="custom-field-item"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="custom-field-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Field {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeCustomField(field.id)}
                    className="custom-field-remove-btn"
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

                <div className="custom-field-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={labelStyle}>
                      Field Label *
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                      placeholder="Enter field label"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Field Type
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) => updateCustomField(field.id, { type: e.target.value, options: e.target.value === 'select' ? [''] : [] })}
                      style={inputStyle}
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="number">Number</option>
                      <option value="tel">Phone</option>
                      <option value="textarea">Long Text</option>
                      <option value="select">Dropdown</option>
                      <option value="date">Date</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'end' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateCustomField(field.id, { required: e.target.checked })}
                        style={{ marginRight: '0.5rem', transform: 'scale(1.2)' }}
                      />
                      Required
                    </label>
                  </div>
                </div>

                {field.type === 'select' && (
                  <div className="custom-field-options">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label style={labelStyle}>
                        Options
                      </label>
                      <button
                        type="button"
                        onClick={() => addCustomFieldOption(field.id)}
                        style={{
                          backgroundColor: 'rgba(46, 204, 113, 0.2)',
                          color: '#2ecc71',
                          border: 'none',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Add Option
                      </button>
                    </div>

                    {field.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="custom-field-option-item" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateCustomFieldOption(field.id, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                          style={{
                            flex: 1,
                            padding: '0.6rem 0.8rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeCustomFieldOption(field.id, optionIndex)}
                          className="custom-field-option-remove"
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
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
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
            onClick={() => document.getElementById('event-image-upload').click()}
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
                id="event-image-upload"
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
            onClick={() => document.getElementById('vertical-image-upload').click()}
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
                id="vertical-image-upload"
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

        <div className="form-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
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
              fontSize: '0.95rem',
              minWidth: '120px'
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
              opacity: isLoading ? 0.7 : 1,
              minWidth: '120px'
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

export default EventEditor;
