import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import registrationService from '../services/registrationService';

// Event data and registrations will come from props

const EventRegistration = ({ eventData, registrations = [] }) => {
  // Set default participation type based on event settings
  const getDefaultParticipationType = () => {
    if (!eventData || !eventData.participation_type) return 'individual';

    // If event is team-only, default to team
    if (eventData.participation_type === 'team') return 'team';

    // Otherwise default to individual
    return 'individual';
  };

  // Debug logs to check event data
  console.log('Event participation type:', eventData?.participation_type);
  console.log('Event min_participants:', eventData?.min_participants);
  console.log('Event max_participants:', eventData?.max_participants);

  // Get team size requirements
  const minTeamSize = eventData?.min_participants || 1;
  const maxTeamSize = eventData?.max_participants || 1;
  const isTeamEvent = eventData?.participation_type === 'team' || eventData?.participation_type === 'both';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rollNumber: '',
    department: '',
    year: '',
    team: getDefaultParticipationType()
  });

  // Initialize team members array with the minimum required members
  const initializeTeamMembers = () => {
    // For team events, initialize with minimum required members (at least 1)
    // -1 because the team leader is counted separately
    const initialCount = Math.max(1, minTeamSize - 1);
    const members = [];

    for (let i = 0; i < initialCount; i++) {
      members.push({ name: '', department: '', year: '', rollNumber: '' });
    }

    return members;
  };

  const [teamMembers, setTeamMembers] = useState(initializeTeamMembers);

  // Update team value and re-initialize team members when event data changes
  useEffect(() => {
    console.log('Event data changed or team value changed');

    if (eventData?.participation_type === 'team') {
      console.log('Setting team value to team for team-only event');
      // If event is team-only, force team value to 'team'
      setFormData(prev => ({
        ...prev,
        team: 'team'
      }));
      setTeamMembers(initializeTeamMembers());
    } else if (eventData?.participation_type === 'both' && formData.team === 'team') {
      setTeamMembers(initializeTeamMembers());
    }
  }, [eventData, formData.team, minTeamSize]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for team selection
    if (name === 'team') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      // If switching to team, initialize team members
      if (value === 'team') {
        setTeamMembers(initializeTeamMembers());
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleTeamMemberChange = (index, e) => {
    const { name, value } = e.target;
    const updatedMembers = [...teamMembers];
    updatedMembers[index] = {
      ...updatedMembers[index],
      [name]: value
    };
    setTeamMembers(updatedMembers);
  };

  const addTeamMember = () => {
    // Check if we've reached the maximum team size (including the team leader)
    if (teamMembers.length < maxTeamSize - 1) {
      setTeamMembers([...teamMembers, { name: '', email: '', rollNumber: '', phone: '' }]);
    }
  };

  const removeTeamMember = (index) => {
    // Don't allow removing if we're at the minimum required team size
    // The minimum is minTeamSize - 1 because the team leader is counted separately
    const minRequired = Math.max(1, minTeamSize - 1);

    if (teamMembers.length > minRequired) {
      const updatedMembers = [...teamMembers];
      updatedMembers.splice(index, 1);
      setTeamMembers(updatedMembers);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validate form
      if (formData.team === 'team') {
        // Check if all team member fields are filled
        if (teamMembers.some(member => !member.name || !member.department || !member.year || !member.rollNumber)) {
          setError('Please fill in all team member details (name, department, year, and roll number)');
          setIsSubmitting(false);
          return;
        }

        // Check if team size meets requirements
        const totalTeamSize = teamMembers.length + 1; // +1 for the team leader
        if (totalTeamSize < minTeamSize) {
          setError(`Team size must be at least ${minTeamSize} members (including you as team leader)`);
          setIsSubmitting(false);
          return;
        }

        if (totalTeamSize > maxTeamSize) {
          setError(`Team size cannot exceed ${maxTeamSize} members (including you as team leader)`);
          setIsSubmitting(false);
          return;
        }
      }

      // Check if user is already registered
      const existingRegistration = await registrationService.checkExistingRegistration(
        eventData.id,
        formData.email
      );

      if (existingRegistration) {
        setError('You have already registered for this event');
        setIsSubmitting(false);
        return;
      }

      // Prepare registration data
      const registrationData = {
        event_id: eventData.id,
        participant_name: formData.name,
        participant_email: formData.email,
        participant_phone: formData.phone,
        participant_id: formData.rollNumber,
        status: 'registered',
        additional_info: {
          department: formData.department,
          year: formData.year,
          team_type: formData.team,
          team_members: formData.team === 'team' ? teamMembers : []
        }
      };

      // Submit registration to Supabase
      await registrationService.registerForEvent(registrationData);

      setIsSubmitting(false);
      setIsSuccess(true);

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          rollNumber: '',
          department: '',
          year: '',
          team: getDefaultParticipationType()
        });
        setTeamMembers(initializeTeamMembers());
        setIsSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error registering for event:', err);
      setError(err.message || 'Failed to register for event. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section" id="registration" style={{ paddingTop: '2rem' }}>
      <div className="container">
        <motion.div
          className="registration-container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            width: '100%',
            maxWidth: '800px',
            margin: '0 auto'
          }}
        >
          {/* Registration Form */}
          <motion.div
            className="registration-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title" style={{
              marginBottom: '2rem',
              fontSize: '2.2rem',
              textAlign: 'center',
              background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
              width: '100%'
            }}>
              Register for {eventData?.title || 'Event'}
            </h2>

            {/* External Registration Form Link */}
            {(eventData.registration_method === 'external' || eventData.registration_method === 'both') && eventData.external_form_url && (
              <motion.div
                className="external-form-link"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                  borderLeft: '4px solid var(--primary)',
                  marginBottom: '1.5rem',
                  borderRadius: '4px'
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: '0.75rem', color: 'var(--primary)' }}>
                  External Registration Form
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                  This event uses an external registration form. Please click the button below to access it.
                </p>
                <a
                  href={eventData.external_form_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '0.8rem 1.5rem',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontWeight: '500',
                    boxShadow: '0 4px 10px rgba(var(--primary-rgb), 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  Go to Registration Form
                </a>
              </motion.div>
            )}

            {error && (
              <motion.div
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '1rem',
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  borderLeft: '4px solid #ff0033',
                  marginBottom: '1.5rem',
                  color: '#ff0033'
                }}
              >
                {error}
              </motion.div>
            )}

            {isSuccess && (
              <motion.div
                className="success-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'rgba(0, 255, 0, 0.1)',
                  borderLeft: '4px solid #00ff33',
                  marginBottom: '1.5rem',
                  color: '#00ff33',
                  textAlign: 'center'
                }}
              >
                <h3 style={{ color: '#00ff33', marginTop: 0, marginBottom: '0.5rem' }}>Registration Successful!</h3>
                <p style={{ margin: 0 }}>Thank you for registering for {eventData.title}. You will receive a confirmation email shortly.</p>
              </motion.div>
            )}

            {/* Internal Registration Form - Only show if registration method is internal or both */}
            {(eventData.registration_method === 'internal' || eventData.registration_method === 'both') && (
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="name"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
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
                  placeholder="Enter your full name"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label
                    htmlFor="email"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
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
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="form-group">
                  <label
                    htmlFor="phone"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
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
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="rollNumber"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Roll Number *
                </label>
                <input
                  type="text"
                  id="rollNumber"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
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
                  placeholder="Enter your roll number"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label
                    htmlFor="department"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Department *
                  </label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
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
                  >
                    <option value="">Select Department</option>
                    <option value="CSE">Computer Science</option>
                    <option value="ECE">Electronics & Communication</option>
                    <option value="EE">Electrical Engineering</option>
                    <option value="ME">Mechanical Engineering</option>
                    <option value="CE">Civil Engineering</option>
                    <option value="EIE">Electronics & Instrumentation</option>
                  </select>
                </div>

                <div className="form-group">
                  <label
                    htmlFor="year"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Year of Study *
                  </label>
                  <select
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
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
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">5th Year</option>
                  </select>
                </div>
              </div>

              {/* Show participation type selection based on event type */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Participation Type *
                </label>

                {eventData?.participation_type === 'both' ? (
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="team"
                        value="individual"
                        checked={formData.team === 'individual'}
                        onChange={handleChange}
                        style={{ marginRight: '0.5rem' }}
                      />
                      Individual
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="team"
                        value="team"
                        checked={formData.team === 'team'}
                        onChange={handleChange}
                        style={{ marginRight: '0.5rem' }}
                      />
                      Team
                    </label>
                  </div>
                ) : (
                  <div style={{
                    padding: '0.8rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)'
                  }}>
                    {eventData?.participation_type === 'individual' ? 'Solo Event (Individual Registration)' : 'Team Event (Group Registration)'}
                  </div>
                )}
              </div>

              {/* Debug info - hidden in production */}
              {false && (
                <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.2)', fontSize: '0.8rem', color: '#aaa' }}>
                  <p style={{ margin: '0 0 0.3rem' }}>Debug info:</p>
                  <p style={{ margin: '0 0 0.3rem' }}>Event participation type: {eventData?.participation_type || 'not set'}</p>
                  <p style={{ margin: '0 0 0.3rem' }}>Form team value: {formData.team}</p>
                  <p style={{ margin: '0 0 0.3rem' }}>Min team size: {minTeamSize}</p>
                  <p style={{ margin: '0 0 0.3rem' }}>Max team size: {maxTeamSize}</p>
                </div>
              )}

              {(formData.team === 'team' || eventData?.participation_type === 'team') && (
                <motion.div
                  className="team-members"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  style={{ marginBottom: '1.5rem' }}
                >
                  {/* Team Registration Header */}
                  <div style={{
                    backgroundColor: 'rgba(110, 68, 255, 0.1)',
                    borderRadius: '8px 8px 0 0',
                    padding: '1.2rem',
                    marginBottom: '1.5rem',
                    borderBottom: '1px solid rgba(110, 68, 255, 0.2)'
                  }}>
                    <h3 style={{
                      margin: '0 0 0.5rem',
                      fontSize: '1.4rem',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span>👥</span> Team Registration
                    </h3>
                    <p style={{
                      fontSize: '0.95rem',
                      color: 'var(--text-secondary)',
                      margin: '0 0 0.5rem',
                      lineHeight: '1.5'
                    }}>
                      You are registering as the <strong style={{ color: 'var(--primary)' }}>Team Leader</strong>.
                      Team size requirement: <strong>{minTeamSize} to {maxTeamSize} members</strong> (including you as team leader).
                    </p>
                    <p style={{
                      fontSize: '0.95rem',
                      color: 'var(--accent)',
                      margin: 0,
                      fontWeight: '500'
                    }}>
                      Please add {minTeamSize - 1} to {maxTeamSize - 1} team members below.
                    </p>
                  </div>

                  {/* Team Members List */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    {teamMembers.map((member, index) => (
                      <div
                        key={index}
                        style={{
                          marginBottom: '1.5rem',
                          padding: '1.5rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '8px',
                          position: 'relative',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        {/* Member Header */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '1.2rem',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                          paddingBottom: '0.8rem'
                        }}>
                          <h4 style={{
                            margin: 0,
                            fontSize: '1.1rem',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <span style={{
                              backgroundColor: 'rgba(110, 68, 255, 0.1)',
                              color: 'var(--primary)',
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.9rem',
                              fontWeight: 'bold'
                            }}>{index + 1}</span>
                            Team Member
                          </h4>

                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => removeTeamMember(index)}
                              style={{
                                background: 'rgba(255, 0, 0, 0.1)',
                                border: 'none',
                                color: '#ff3333',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <span>✕</span> Remove
                            </button>
                          )}
                        </div>

                        {/* Member Form Fields */}
                        <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                          <label
                            htmlFor={`member-name-${index}`}
                            style={{
                              display: 'block',
                              marginBottom: '0.5rem',
                              fontSize: '0.9rem',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            Full Name *
                          </label>
                          <input
                            type="text"
                            id={`member-name-${index}`}
                            name="name"
                            value={member.name}
                            onChange={(e) => handleTeamMemberChange(index, e)}
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
                            placeholder="Enter member's full name"
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                          <div className="form-group">
                            <label
                              htmlFor={`member-department-${index}`}
                              style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontSize: '0.9rem',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              Department *
                            </label>
                            <select
                              id={`member-department-${index}`}
                              name="department"
                              value={member.department}
                              onChange={(e) => handleTeamMemberChange(index, e)}
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
                            >
                              <option value="">Select Department</option>
                              <option value="CSE">Computer Science</option>
                              <option value="ECE">Electronics & Communication</option>
                              <option value="EE">Electrical Engineering</option>
                              <option value="ME">Mechanical Engineering</option>
                              <option value="CE">Civil Engineering</option>
                              <option value="EIE">Electronics & Instrumentation</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label
                              htmlFor={`member-year-${index}`}
                              style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontSize: '0.9rem',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              Year of Study *
                            </label>
                            <select
                              id={`member-year-${index}`}
                              name="year"
                              value={member.year}
                              onChange={(e) => handleTeamMemberChange(index, e)}
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
                            >
                              <option value="">Select Year</option>
                              <option value="1">1st Year</option>
                              <option value="2">2nd Year</option>
                              <option value="3">3rd Year</option>
                              <option value="4">4th Year</option>
                              <option value="5">5th Year</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-group">
                          <label
                            htmlFor={`member-roll-${index}`}
                            style={{
                              display: 'block',
                              marginBottom: '0.5rem',
                              fontSize: '0.9rem',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            Roll Number *
                          </label>
                          <input
                            type="text"
                            id={`member-roll-${index}`}
                            name="rollNumber"
                            value={member.rollNumber}
                            onChange={(e) => handleTeamMemberChange(index, e)}
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
                            placeholder="Enter roll number"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Team Member Button */}
                  <button
                    type="button"
                    onClick={addTeamMember}
                    disabled={teamMembers.length >= maxTeamSize - 1}
                    style={{
                      background: teamMembers.length >= maxTeamSize - 1 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(110, 68, 255, 0.1)',
                      border: teamMembers.length >= maxTeamSize - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(110, 68, 255, 0.3)',
                      borderRadius: '8px',
                      padding: '1rem',
                      width: '100%',
                      color: teamMembers.length >= maxTeamSize - 1 ? 'rgba(255, 255, 255, 0.3)' : 'var(--primary)',
                      cursor: teamMembers.length >= maxTeamSize - 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      if (teamMembers.length < maxTeamSize - 1) {
                        e.target.style.backgroundColor = 'rgba(110, 68, 255, 0.15)';
                        e.target.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (teamMembers.length < maxTeamSize - 1) {
                        e.target.style.backgroundColor = 'rgba(110, 68, 255, 0.1)';
                        e.target.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {teamMembers.length >= maxTeamSize - 1 ? (
                      <>Maximum team size reached ({maxTeamSize} including you)</>
                    ) : (
                      <><span style={{ fontSize: '1.2rem' }}>+</span> Add Team Member</>
                    )}
                  </button>
                </motion.div>
              )}



              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '1.2rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)',
                  border: 'none',
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(110, 68, 255, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                disabled={isSubmitting}
                onMouseOver={(e) => {
                  if (!isSubmitting) {
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(110, 68, 255, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSubmitting) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(110, 68, 255, 0.3)';
                  }
                }}
              >
                {isSubmitting ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '3px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      animation: 'spin 1s linear infinite'
                    }}></span>
                    Submitting...
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>📝</span> Register for Event
                  </div>
                )}
              </button>

              <style jsx>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </form>
            )}

            {/* Message when no registration method is available */}
            {!eventData.registration_method && (
              <motion.div
                className="no-registration"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '2rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  marginTop: '2rem'
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                  Registration Not Available
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Registration for this event is currently not available. Please check back later or contact the organizers for more information.
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default EventRegistration;
