import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import clubService from '../services/clubService';

import logger from '../utils/logger';
const AdminClubEditor = ({ club, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    logo_url: '',
    social_links: {
      instagram: '',
      facebook: '',
      linkedin: '',
      twitter: '',
      youtube: '',
      github: ''
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

  useEffect(() => {
    if (club) {
      // Initialize form with club data
      setFormData({
        name: club.name || '',
        description: club.description || '',
        contact_email: club.contact_email || '',
        contact_phone: club.contact_phone || '',
        website: club.website || '',
        logo_url: club.logo_url || '',
        social_links: club.social_links || {
          instagram: '',
          facebook: '',
          linkedin: '',
          twitter: '',
          youtube: '',
          github: ''
        }
      });
    }
  }, [club]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialLinkChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validate form
      if (!formData.name) {
        throw new Error('Club name is required');
      }

      // Prepare update data
      const updateData = {
        name: formData.name,
        description: formData.description,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        website: formData.website,
        logo_url: formData.logo_url,
        social_links: formData.social_links
      };

      // Update club profile
      const updatedClub = await clubService.updateClubProfile(club.id, updateData);

      // Show success message
      setSuccess(true);

      // Notify parent component
      if (onUpdate) {
        onUpdate(updatedClub);
      }

      // Close after a delay
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);
    } catch (err) {
      logger.error('Error updating club profile:', err);
      setError(err.message || 'An error occurred while updating the club profile');
    } finally {
      setIsLoading(false);
    }
  };

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

  const socialIconStyle = {
    padding: '0.6rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px 0 0 4px',
    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const socialInputStyle = {
    ...inputStyle,
    flex: 1,
    borderRadius: '0 4px 4px 0',
    borderLeft: 'none'
  };

  return (
    <motion.div
      className="club-editor full-page"
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
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Edit Club Profile</h2>
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
          Club profile updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.1rem' }}>Basic Information</h3>

          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label htmlFor="name" style={labelStyle}>
              Club Name <span style={{ color: 'var(--primary)' }}>*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label htmlFor="contact_email" style={labelStyle}>
                Contact Email
              </label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact_phone" style={labelStyle}>
                Contact Phone
              </label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '0.75rem', marginTop: '0.75rem' }}>
            <label htmlFor="website" style={labelStyle}>
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              style={inputStyle}
              placeholder="https://example.com"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label htmlFor="logo_url" style={labelStyle}>
              Logo URL
            </label>
            <input
              type="url"
              id="logo_url"
              name="logo_url"
              value={formData.logo_url}
              onChange={handleChange}
              style={inputStyle}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.1rem' }}>Social Media Links</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
            Add the club's social media profiles. These will be displayed on the club page.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="instagram" style={labelStyle}>
                Instagram
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={socialIconStyle}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </span>
                <input
                  type="url"
                  id="instagram"
                  name="instagram"
                  value={formData.social_links.instagram}
                  onChange={handleSocialLinkChange}
                  style={socialInputStyle}
                  placeholder="https://instagram.com/yourclub"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="facebook" style={labelStyle}>
                Facebook
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={socialIconStyle}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                  </svg>
                </span>
                <input
                  type="url"
                  id="facebook"
                  name="facebook"
                  value={formData.social_links.facebook}
                  onChange={handleSocialLinkChange}
                  style={socialInputStyle}
                  placeholder="https://facebook.com/yourclub"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="linkedin" style={labelStyle}>
                LinkedIn
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={socialIconStyle}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
                  </svg>
                </span>
                <input
                  type="url"
                  id="linkedin"
                  name="linkedin"
                  value={formData.social_links.linkedin}
                  onChange={handleSocialLinkChange}
                  style={socialInputStyle}
                  placeholder="https://linkedin.com/company/yourclub"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="twitter" style={labelStyle}>
                Twitter
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={socialIconStyle}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </span>
                <input
                  type="url"
                  id="twitter"
                  name="twitter"
                  value={formData.social_links.twitter}
                  onChange={handleSocialLinkChange}
                  style={socialInputStyle}
                  placeholder="https://twitter.com/yourclub"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="youtube" style={labelStyle}>
                YouTube
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={socialIconStyle}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                </span>
                <input
                  type="url"
                  id="youtube"
                  name="youtube"
                  value={formData.social_links.youtube}
                  onChange={handleSocialLinkChange}
                  style={socialInputStyle}
                  placeholder="https://youtube.com/c/yourclub"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="github" style={labelStyle}>
                GitHub
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={socialIconStyle}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </span>
                <input
                  type="url"
                  id="github"
                  name="github"
                  value={formData.social_links.github}
                  onChange={handleSocialLinkChange}
                  style={socialInputStyle}
                  placeholder="https://github.com/yourclub"
                />
              </div>
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

export default AdminClubEditor;
