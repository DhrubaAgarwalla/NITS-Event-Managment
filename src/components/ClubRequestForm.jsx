import { useState } from 'react';
import { motion } from 'framer-motion';
import clubService from '../services/clubService';

export default function ClubRequestForm({ setCurrentPage }) {
  const [formData, setFormData] = useState({
    club_name: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    description: '',
    additional_info: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validate form
      if (!formData.club_name || !formData.contact_person || !formData.contact_email) {
        throw new Error('Please fill in all required fields');
      }

      // Submit club request
      await clubService.submitClubRequest(formData);

      // Show success message
      setSuccess(true);

      // Reset form
      setFormData({
        club_name: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        description: '',
        additional_info: ''
      });
    } catch (err) {
      console.error('Error submitting club request:', err);
      setError(err.message || 'An error occurred while submitting your request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="section" id="club-request">
      <div className="container">
        <motion.div
          className="request-container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            maxWidth: '700px',
            margin: '0 auto',
            padding: '3rem',
            backgroundColor: 'var(--dark-surface)',
            borderRadius: '10px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
          }}
        >
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ textAlign: 'center', marginBottom: '1rem' }}
          >
            Request a <span className="gradient-text">Club Profile</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ textAlign: 'center', marginBottom: '2rem' }}
          >
            Fill out this form to request a club profile. Our administrators will review your request and create an account for your club.
          </motion.p>

          {success ? (
            <motion.div
              className="success-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '2rem',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                borderLeft: '4px solid #2ecc71',
                marginBottom: '1.5rem',
                color: '#2ecc71',
                textAlign: 'center'
              }}
            >
              <h3 style={{ marginTop: 0 }}>Request Submitted Successfully!</h3>
              <p>Thank you for your request. Our administrators will review it and get back to you soon.</p>
              <button
                className="btn btn-primary"
                onClick={() => setCurrentPage('home')}
                style={{ marginTop: '1rem' }}
              >
                Return to Home
              </button>
            </motion.div>
          ) : (
            <>
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

              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label
                    htmlFor="club_name"
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
                    id="club_name"
                    name="club_name"
                    value={formData.club_name}
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
                    placeholder="Enter your club name"
                  />
                </div>

                <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label
                      htmlFor="contact_person"
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Contact Person <span style={{ color: 'var(--primary)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="contact_person"
                      name="contact_person"
                      value={formData.contact_person}
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
                      placeholder="Full name"
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
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
                      value={formData.contact_phone}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        fontSize: '1rem'
                      }}
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label
                    htmlFor="contact_email"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Contact Email <span style={{ color: 'var(--primary)' }}>*</span>
                  </label>
                  <input
                    type="email"
                    id="contact_email"
                    name="contact_email"
                    value={formData.contact_email}
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
                    placeholder="Email address"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label
                    htmlFor="description"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Club Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
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
                    placeholder="Describe your club's activities and purpose"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label
                    htmlFor="additional_info"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Additional Information
                  </label>
                  <textarea
                    id="additional_info"
                    name="additional_info"
                    value={formData.additional_info}
                    onChange={handleChange}
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
                    placeholder="Any additional information you'd like to share"
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setCurrentPage('home')}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 2, padding: '1rem' }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </motion.form>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
};


