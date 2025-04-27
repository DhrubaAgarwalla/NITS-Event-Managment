import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import clubService from '../services/clubService';
import { useAuth } from '../contexts/AuthContext';

const ClubProfileEditor = ({ onClose, onUpdate }) => {
  const { club } = useAuth();
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
      console.error('Error updating club profile:', err);
      setError(err.message || 'An error occurred while updating your profile');
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
      className="profile-editor"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        backgroundColor: 'var(--dark-surface)',
        borderRadius: '10px',
        padding: '1.25rem',
        maxWidth: '800px',
        maxHeight: '90vh',
        width: '90%',
        margin: '0 auto',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        overflowY: 'auto'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Edit Club Profile</h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>

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
          Profile updated successfully!
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

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
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

            <div>
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
            Add your club's social media profiles. These will be displayed on your club page.
          </p>

          <div className="social-links-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="instagram" style={labelStyle}>
                Instagram
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={socialIconStyle}>
                  📸
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
                  f
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
                  in
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
                  🐦
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
                  📺
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
                  🐙
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
    </motion.div>
  );
};

export default ClubProfileEditor;
