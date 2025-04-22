import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import registrationService from '../services/registrationService';

// Event data and registrations will come from props

const EventRegistration = ({ eventData, registrations = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rollNumber: '',
    department: '',
    year: '',
    team: 'individual'
  });

  const [teamMembers, setTeamMembers] = useState([
    { name: '', email: '', rollNumber: '' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    setTeamMembers([...teamMembers, { name: '', email: '', rollNumber: '' }]);
  };

  const removeTeamMember = (index) => {
    if (teamMembers.length > 1) {
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
      if (formData.team === 'team' && teamMembers.some(member => !member.name || !member.email || !member.rollNumber)) {
        setError('Please fill in all team member details');
        setIsSubmitting(false);
        return;
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
          team: 'individual'
        });
        setTeamMembers([{ name: '', email: '', rollNumber: '' }]);
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
            <h2 className="section-title" style={{ marginBottom: '2rem', fontSize: '2.2rem', textAlign: 'center' }}>
              Register for <span className="gradient-text">Event</span>
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
              </div>

              {formData.team === 'team' && (
                <motion.div
                  className="team-members"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  style={{ marginBottom: '1.5rem' }}
                >
                  <h4 style={{ marginBottom: '1rem' }}>Team Members</h4>

                  {teamMembers.map((member, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        position: 'relative'
                      }}
                    >
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeTeamMember(index)}
                          style={{
                            position: 'absolute',
                            top: '0.5rem',
                            right: '0.5rem',
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

                      <h5 style={{ marginBottom: '1rem' }}>Member {index + 1}</h5>

                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label
                          htmlFor={`member-name-${index}`}
                          style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          Name *
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
                          placeholder="Enter member name"
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label
                            htmlFor={`member-email-${index}`}
                            style={{
                              display: 'block',
                              marginBottom: '0.5rem',
                              fontSize: '0.9rem',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            Email *
                          </label>
                          <input
                            type="email"
                            id={`member-email-${index}`}
                            name="email"
                            value={member.email}
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
                            placeholder="Enter email"
                          />
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
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addTeamMember}
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
                    <span>+</span> Add Team Member
                  </button>
                </motion.div>
              )}

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    required
                    style={{ marginRight: '0.8rem' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    I agree to the <a href="#" style={{ color: 'var(--primary)' }}>terms and conditions</a>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Register for Event'}
              </button>
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
