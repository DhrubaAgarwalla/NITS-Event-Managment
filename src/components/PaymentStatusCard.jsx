import React, { useState } from 'react';
import { motion } from 'framer-motion';
import registrationService from '../services/registrationService';
import logger from '../utils/logger';

const PaymentStatusCard = ({ registration, onStatusUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'captured':
      case 'verified':
        return '#2ecc71';
      case 'pending':
      case 'authorized':
        return '#f39c12';
      case 'failed':
      case 'cancelled':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'razorpay':
        return '💳';
      case 'upi':
        return '📱';
      default:
        return '💰';
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setIsUpdating(true);
      logger.log(`Updating payment status to ${newStatus} for registration ${registration.id}`);
      
      await registrationService.updatePaymentStatus(registration.id, newStatus);
      
      // Call parent callback to refresh data
      if (onStatusUpdate) {
        onStatusUpdate(registration.id, newStatus);
      }
      
      logger.log('Payment status updated successfully');
    } catch (error) {
      logger.error('Error updating payment status:', error);
      alert('Failed to update payment status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return 'N/A';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1rem',
        marginBottom: '1rem'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>
            {getPaymentMethodIcon(registration.payment_method)}
          </span>
          <div>
            <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              {registration.participant_name || 'Unknown Participant'}
            </h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              {registration.participant_email}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600',
              backgroundColor: getPaymentStatusColor(registration.payment_status) + '20',
              color: getPaymentStatusColor(registration.payment_status),
              border: `1px solid ${getPaymentStatusColor(registration.payment_status)}40`
            }}
          >
            {registration.payment_status?.toUpperCase() || 'UNKNOWN'}
          </span>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              padding: '0.25rem'
            }}
          >
            {showDetails ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Payment Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '0.75rem',
        marginBottom: '0.75rem'
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Method</p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '500' }}>
            {registration.payment_method?.toUpperCase() || 'N/A'}
          </p>
        </div>
        
        <div>
          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Amount</p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '500' }}>
            {formatAmount(registration.payment_amount)}
          </p>
        </div>
        
        {registration.payment_id && (
          <div>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Payment ID</p>
            <p style={{ 
              margin: 0, 
              fontSize: '0.7rem', 
              color: 'var(--text-primary)', 
              fontFamily: 'monospace',
              wordBreak: 'break-all'
            }}>
              {registration.payment_id.substring(0, 12)}...
            </p>
          </div>
        )}
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '0.75rem',
            marginTop: '0.75rem'
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            {registration.payment_order_id && (
              <div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Order ID</p>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.75rem', 
                  color: 'var(--text-primary)', 
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}>
                  {registration.payment_order_id}
                </p>
              </div>
            )}
            
            {registration.payment_captured_at && (
              <div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Captured At</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                  {formatDate(registration.payment_captured_at)}
                </p>
              </div>
            )}
            
            {registration.payment_screenshot_url && (
              <div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Screenshot</p>
                <a
                  href={registration.payment_screenshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--primary)',
                    fontSize: '0.75rem',
                    textDecoration: 'none'
                  }}
                >
                  View Screenshot →
                </a>
              </div>
            )}
          </div>

          {/* Status Update Actions */}
          {registration.payment_method === 'upi' && registration.payment_status === 'pending' && (
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => handleStatusUpdate('verified')}
                disabled={isUpdating}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                  opacity: isUpdating ? 0.6 : 1
                }}
              >
                {isUpdating ? 'Updating...' : 'Verify Payment'}
              </button>
              
              <button
                onClick={() => handleStatusUpdate('failed')}
                disabled={isUpdating}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                  opacity: isUpdating ? 0.6 : 1
                }}
              >
                {isUpdating ? 'Updating...' : 'Mark Failed'}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default PaymentStatusCard;
