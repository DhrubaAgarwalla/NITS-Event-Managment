import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import eventService from '../services/eventService';

const RegistrationDetails = ({ registration, onClose }) => {
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Load event data to get custom field definitions
  useEffect(() => {
    const loadEventData = async () => {
      if (registration?.event_id) {
        try {
          const data = await eventService.getEventById(registration.event_id);
          setEventData(data);
        } catch (error) {
          console.error('Error loading event data:', error);
        }
      }
      setLoading(false);
    };

    loadEventData();
  }, [registration?.event_id]);

  // Get team members if available
  const teamMembers = registration?.additional_info?.team_members || [];
  const teamType = registration?.additional_info?.team_type || 'individual';
  const department = registration?.additional_info?.department || 'N/A';
  const year = registration?.additional_info?.year || 'N/A';

  // Get custom fields data
  const customFields = eventData?.custom_fields || [];
  const customFieldsData = registration?.additional_info?.custom_fields || {};

  // Status badge style based on status
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'registered':
        return {
          backgroundColor: 'rgba(0, 128, 255, 0.2)',
          color: '#0080ff',
          border: '1px solid rgba(0, 128, 255, 0.3)'
        };
      case 'attended':
        return {
          backgroundColor: 'rgba(0, 200, 0, 0.2)',
          color: '#00c800',
          border: '1px solid rgba(0, 200, 0, 0.3)'
        };
      case 'cancelled':
        return {
          backgroundColor: 'rgba(255, 0, 0, 0.2)',
          color: '#ff0000',
          border: '1px solid rgba(255, 0, 0, 0.3)'
        };
      default:
        return {
          backgroundColor: 'rgba(128, 128, 128, 0.2)',
          color: '#808080',
          border: '1px solid rgba(128, 128, 128, 0.3)'
        };
    }
  };

  return (
    <motion.div
      className="registration-details"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        backgroundColor: 'var(--dark-surface)',
        borderRadius: '10px',
        padding: '1.25rem',
        maxWidth: '600px',
        maxHeight: '90vh',
        width: '90%',
        margin: '0 auto',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        overflowY: 'auto'
      }}
    >
      <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Registration Details</h2>
        <button
          className="close-button"
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

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '1rem'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{registration.participant_name}</h3>
          <p style={{ margin: '0.3rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {registration.participant_email}
          </p>
        </div>
        <div style={{
          padding: '0.4rem 0.8rem',
          borderRadius: '4px',
          fontSize: '0.85rem',
          fontWeight: '500',
          ...getStatusBadgeStyle(registration.status)
        }}>
          {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 className="section-title" style={{ fontSize: '1rem', marginBottom: '0.8rem', color: 'var(--text-primary)' }}>Participant Information</h4>

        <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="info-item">
            <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ID/Roll Number</p>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>{registration.participant_id || 'N/A'}</p>
          </div>

          <div className="info-item">
            <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Phone</p>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>{registration.participant_phone || 'N/A'}</p>
          </div>

          <div className="info-item">
            <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Department</p>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>{department}</p>
          </div>

          <div>
            <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Year</p>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>{year}</p>
          </div>
        </div>
      </div>

      {/* Custom Fields Section */}
      {!loading && customFields.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '0.8rem', color: 'var(--text-primary)' }}>Additional Information</h4>

          <div className="custom-fields-container" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '6px',
            padding: '0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {customFields.map((field) => {
                const fieldValue = customFieldsData[field.id];
                let displayValue = 'N/A';

                if (fieldValue !== undefined && fieldValue !== null) {
                  if (Array.isArray(fieldValue)) {
                    // For checkbox fields that store arrays
                    displayValue = fieldValue.length > 0 ? fieldValue.join(', ') : 'N/A';
                  } else {
                    displayValue = fieldValue.toString();
                  }
                }

                return (
                  <div key={field.id}>
                    <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {field.label}
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '0.95rem',
                      wordBreak: field.type === 'textarea' ? 'break-word' : 'normal',
                      whiteSpace: field.type === 'textarea' ? 'pre-wrap' : 'normal'
                    }}>
                      {displayValue}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {teamType === 'team' && teamMembers.length > 0 && (
        <div className="team-members-section" style={{ marginBottom: '1.5rem' }}>
          <h4 className="section-title" style={{ fontSize: '1rem', marginBottom: '0.8rem', color: 'var(--text-primary)' }}>Team Members</h4>

          <div className="team-members-container" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '6px',
            padding: '0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="team-member-card"
                style={{
                  padding: '0.6rem',
                  borderBottom: index < teamMembers.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                }}
              >
                <div className="team-member-details" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem'
                }}>
                  <div>
                    <p style={{ margin: '0 0 0.2rem', fontSize: '0.95rem', fontWeight: '500' }}>{member.name}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      ID: {member.rollNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Department: {member.department || 'N/A'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Year: {member.year || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Information */}
      {(registration.payment_screenshot_url || registration.payment_status || registration.payment_amount) && (
        <div className="payment-section" style={{ marginBottom: '1.5rem' }}>
          <h4 className="section-title" style={{ fontSize: '1rem', marginBottom: '0.8rem', color: 'var(--text-primary)' }}>Payment Information</h4>

          <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            {registration.payment_amount && (
              <div>
                <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Payment Amount</p>
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>₹{registration.payment_amount}</p>
              </div>
            )}

            {registration.payment_status && (
              <div>
                <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Payment Status</p>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  backgroundColor: registration.payment_status === 'verified' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                  color: registration.payment_status === 'verified' ? '#22c55e' : '#fbbf24'
                }}>
                  {registration.payment_status.charAt(0).toUpperCase() + registration.payment_status.slice(1)}
                </span>
              </div>
            )}
          </div>

          {registration.payment_screenshot_url && (
            <div>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Payment Screenshot</p>
              <a
                className="payment-proof"
                href={registration.payment_screenshot_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(110, 68, 255, 0.1)',
                  border: '1px solid rgba(110, 68, 255, 0.3)',
                  borderRadius: '4px',
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = 'rgba(110, 68, 255, 0.15)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'rgba(110, 68, 255, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <span>📷</span> View Payment Screenshot
              </a>
            </div>
          )}
        </div>
      )}

      <div className="timeline-section" style={{ marginBottom: '1.5rem' }}>
        <h4 className="section-title" style={{ fontSize: '1rem', marginBottom: '0.8rem', color: 'var(--text-primary)' }}>Registration Timeline</h4>

        <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="info-item">
            <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Registered On</p>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>{formatDate(registration.created_at)}</p>
          </div>

          <div className="info-item">
            <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Last Updated</p>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>{formatDate(registration.updated_at)}</p>
          </div>
        </div>
      </div>

      <div className="form-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button
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
          Close
        </button>
      </div>
    </motion.div>
  );
};

export default RegistrationDetails;
