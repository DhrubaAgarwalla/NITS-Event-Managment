import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import clubService from '../services/clubService';
import supabase from '../lib/supabase';

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
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.match('image.*')) {
      setError('Please upload an image file (PNG, JPG, JPEG).');
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo file size should be less than 2MB.');
      return;
    }

    setLogoFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);
    setUploadProgress(0);

    try {
      // Validate form
      if (!formData.club_name || !formData.contact_person || !formData.contact_email) {
        throw new Error('Please fill in all required fields');
      }

      // Check if logo is provided
      if (!logoFile) {
        throw new Error('Please upload a club logo');
      }

      // First upload the logo file if provided
      let logoUrl = null;
      if (logoFile) {
        // Create a unique file path in the storage bucket
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `club-logos/${fileName}`;

        // Upload the file
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('public')
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: (progress) => {
              const percent = Math.round((progress.loaded / progress.total) * 100);
              setUploadProgress(percent);
            }
          });

        if (uploadError) {
          throw new Error(`Error uploading logo: ${uploadError.message}`);
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('public')
          .getPublicUrl(filePath);

        logoUrl = publicUrl;
      }

      // Submit club request with logo URL
      await clubService.submitClubRequest({
        ...formData,
        logo_url: logoUrl
      });

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
      setLogoFile(null);
      setLogoPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error submitting club request:', err);
      setError(err.message || 'An error occurred while submitting your request');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
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

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label
                    htmlFor="club_logo"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Club Logo <span style={{ color: 'var(--primary)' }}>*</span>
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {!logoPreview ? (
                      <div
                        style={{
                          border: '2px dashed rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          padding: '2rem',
                          textAlign: 'center',
                          cursor: 'pointer',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)'
                        }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Click to upload club logo</p>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                          PNG, JPG or JPEG (max 2MB)
                        </p>
                      </div>
                    ) : (
                      <div
                        style={{
                          position: 'relative',
                          width: '150px',
                          height: '150px',
                          margin: '0 auto',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <img
                          src={logoPreview}
                          alt="Club logo preview"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <input
                      type="file"
                      id="club_logo"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png, image/jpeg, image/jpg"
                      style={{ display: 'none' }}
                    />

                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div style={{ width: '100%' }}>
                        <div
                          style={{
                            height: '6px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            marginTop: '0.5rem'
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${uploadProgress}%`,
                              backgroundColor: 'var(--primary)',
                              borderRadius: '3px',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>
                        <p style={{ fontSize: '0.8rem', textAlign: 'center', margin: '0.5rem 0 0' }}>
                          Uploading: {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
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


