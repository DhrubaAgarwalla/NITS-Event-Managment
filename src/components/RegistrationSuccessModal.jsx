import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logger from '../utils/logger';

const RegistrationSuccessModal = ({
  isOpen,
  onClose,
  registrationData,
  eventData
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isOpen]);

  // Auto-close after 10 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !registrationData || !eventData) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleContinue = () => {
    logger.log('Registration success modal closed by user');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            padding: '1rem',
            backdropFilter: 'blur(10px)'
          }}
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.5
            }}
            style={{
              backgroundColor: 'var(--dark-surface)',
              borderRadius: '20px',
              padding: '2.5rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            {/* Success Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              style={{
                fontSize: '4rem',
                marginBottom: '1.5rem',
                color: '#00ff33'
              }}
            >
              ✅
            </motion.div>

            {/* Success Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                color: '#00ff33',
                fontSize: '2rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                textShadow: '0 0 20px rgba(0, 255, 51, 0.3)'
              }}
            >
              Registration Successful!
            </motion.h1>

            {/* Event Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                backgroundColor: 'var(--dark-bg)',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h3 style={{
                color: 'var(--text-primary)',
                marginBottom: '1rem',
                fontSize: '1.3rem'
              }}>
                🎉 {eventData.title}
              </h3>

              <div style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
                <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
                  <strong style={{ color: 'var(--primary)' }}>📧 Email:</strong> {registrationData.email}
                </p>

                {/* Only show event date if it exists and is valid */}
                {eventData.start_date && (
                  <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
                    <strong style={{ color: 'var(--primary)' }}>📅 Event Date:</strong> {
                      (() => {
                        try {
                          const startDate = new Date(eventData.start_date);
                          const endDate = eventData.end_date ? new Date(eventData.end_date) : null;

                          if (endDate && startDate.toDateString() !== endDate.toDateString()) {
                            // Multi-day event
                            return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
                          } else {
                            // Single day event
                            return startDate.toLocaleDateString();
                          }
                        } catch (error) {
                          return 'Date not available';
                        }
                      })()
                    }
                  </p>
                )}

                {/* Only show time if it exists */}
                {eventData.start_date && (
                  <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
                    <strong style={{ color: 'var(--primary)' }}>⏰ Time:</strong> {
                      (() => {
                        try {
                          const startDate = new Date(eventData.start_date);
                          return startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        } catch (error) {
                          return 'Time not available';
                        }
                      })()
                    }
                  </p>
                )}

                {/* Only show venue if it exists */}
                {eventData.location && (
                  <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
                    <strong style={{ color: 'var(--primary)' }}>📍 Venue:</strong> {eventData.location}
                  </p>
                )}

                {registrationData.registrationId && (
                  <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
                    <strong style={{ color: 'var(--primary)' }}>🆔 Registration ID:</strong> {registrationData.registrationId}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                backgroundColor: 'rgba(0, 255, 51, 0.1)',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                border: '1px solid rgba(0, 255, 51, 0.3)'
              }}
            >
              <h4 style={{
                color: '#00ff33',
                marginBottom: '1rem',
                fontSize: '1.1rem'
              }}>
                📋 What's Next?
              </h4>
              <ul style={{
                textAlign: 'left',
                color: 'var(--text-secondary)',
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                <li style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>
                  ✉️ Check your email for confirmation and QR code
                </li>
                <li style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>
                  📱 Save the QR code for event check-in
                </li>
                <li style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>
                  📅 Add the event to your calendar
                </li>
                <li style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>
                  🎯 Arrive 15 minutes early for smooth check-in
                </li>
              </ul>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              <button
                onClick={handleContinue}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0, 255, 51, 0.3)',
                  minWidth: '150px'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#00cc29';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 51, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'var(--primary)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 51, 0.3)';
                }}
              >
                Continue
              </button>
            </motion.div>

            {/* Auto-close indicator */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginTop: '1.5rem',
                opacity: 0.7
              }}
            >
              This window will close automatically in 10 seconds
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RegistrationSuccessModal;
