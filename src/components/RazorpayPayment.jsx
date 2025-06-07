import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import razorpayService from '../services/razorpayService.js';
import clubService from '../services/clubService.js';
import logger from '../utils/logger.js';

const RazorpayPayment = ({
  eventData,
  registrationData,
  onPaymentSuccess,
  onPaymentError,
  isProcessing,
  setIsProcessing
}) => {
  const [paymentError, setPaymentError] = useState('');
  const [clubAccountStatus, setClubAccountStatus] = useState(null);
  const [useDirectPayment, setUseDirectPayment] = useState(false);
  const [platformCommission] = useState(5); // 5% platform commission

  // Check club's Razorpay account status on component mount
  useEffect(() => {
    const checkClubAccountStatus = async () => {
      try {
        if (eventData.club_id) {
          const status = await razorpayService.getClubAccountStatus(eventData.club_id);
          setClubAccountStatus(status);

          // Enable direct payment if club account is ready
          if (status.can_receive_direct_payments) {
            setUseDirectPayment(true);
            logger.log('Direct payment enabled for club:', eventData.club_id);
          }
        }
      } catch (error) {
        logger.error('Error checking club account status:', error);
        // Fallback to regular payment if status check fails
        setUseDirectPayment(false);
      }
    };

    checkClubAccountStatus();
  }, [eventData.club_id]);

  const handleRazorpayPayment = async () => {
    try {
      setIsProcessing(true);
      setPaymentError('');

      logger.log('Starting Razorpay payment process...');

      const paymentDetails = {
        amount: eventData.payment_amount,
        eventId: eventData.id,
        clubId: eventData.club_id,
        eventTitle: eventData.title,
        name: registrationData.name,
        email: registrationData.email,
        phone: registrationData.phone,
        registrationData: registrationData
      };

      let result;

      // Use direct payment if club account is ready
      if (useDirectPayment && clubAccountStatus?.razorpay_account_status?.id) {
        logger.log('Processing direct payment to club account:', clubAccountStatus.razorpay_account_status.id);
        result = await razorpayService.processDirectPayment(
          paymentDetails,
          clubAccountStatus.razorpay_account_status.id,
          platformCommission
        );
      } else {
        logger.log('Processing regular payment (platform collection)');
        result = await razorpayService.processPayment(paymentDetails);
      }

      logger.log('Razorpay payment completed successfully:', result);

      // Call success callback with payment details
      onPaymentSuccess({
        payment_method: 'razorpay',
        payment_id: result.payment_id,
        order_id: result.order_id,
        registration_id: result.registration_id,
        payment_status: 'captured'
      });

    } catch (error) {
      logger.error('Razorpay payment failed:', error);
      setPaymentError(error.message || 'Payment failed. Please try again.');
      onPaymentError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        padding: '1.5rem',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '1.5rem'
      }}
    >
      <h3 style={{
        margin: '0 0 1rem',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span>💳</span> Secure Payment Gateway
      </h3>

      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
          <strong>Registration Fee: ₹{eventData.payment_amount}</strong>
        </p>

        {/* Payment Method Indicator */}
        {clubAccountStatus && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: useDirectPayment
              ? 'rgba(46, 204, 113, 0.1)'
              : 'rgba(52, 152, 219, 0.1)',
            borderRadius: '6px',
            border: `1px solid ${useDirectPayment ? 'rgba(46, 204, 113, 0.2)' : 'rgba(52, 152, 219, 0.2)'}`,
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ color: useDirectPayment ? '#2ecc71' : '#3498db' }}>
                {useDirectPayment ? '🏦' : '🏢'}
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                {useDirectPayment ? 'Direct Club Payment' : 'Platform Payment'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {useDirectPayment
                ? `Payment goes directly to ${eventData.club_name || 'club'} account (${platformCommission}% platform fee)`
                : 'Payment processed through platform, transferred to club later'
              }
            </p>
          </div>
        )}

        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          Pay securely using Razorpay. Supports UPI, Cards, Net Banking, and Wallets.
        </p>
      </div>

      {/* Payment Features */}
      <div style={{
        marginBottom: '1.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.75rem'
      }}>
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          borderRadius: '6px',
          border: '1px solid rgba(46, 204, 113, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ color: '#2ecc71' }}>✓</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Instant Verification
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Automatic payment confirmation
          </p>
        </div>

        <div style={{
          padding: '0.75rem',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderRadius: '6px',
          border: '1px solid rgba(52, 152, 219, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ color: '#3498db' }}>🔒</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Secure & Encrypted
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Bank-grade security
          </p>
        </div>

        <div style={{
          padding: '0.75rem',
          backgroundColor: 'rgba(155, 89, 182, 0.1)',
          borderRadius: '6px',
          border: '1px solid rgba(155, 89, 182, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ color: '#9b59b6' }}>💰</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Multiple Options
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            UPI, Cards, Net Banking
          </p>
        </div>
      </div>

      {/* Error Display */}
      {paymentError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '1rem',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            border: '1px solid rgba(231, 76, 60, 0.3)',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#e74c3c' }}>⚠️</span>
            <span style={{ color: '#e74c3c', fontSize: '0.9rem', fontWeight: '500' }}>
              Payment Error
            </span>
          </div>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {paymentError}
          </p>
        </motion.div>
      )}

      {/* Pay Now Button */}
      <button
        onClick={handleRazorpayPayment}
        disabled={isProcessing}
        style={{
          width: '100%',
          padding: '1rem 1.5rem',
          fontSize: '1rem',
          fontWeight: '600',
          borderRadius: '8px',
          background: isProcessing
            ? 'rgba(108, 117, 125, 0.5)'
            : 'linear-gradient(90deg, #2ecc71 0%, #27ae60 100%)',
          border: 'none',
          color: 'white',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: isProcessing
            ? 'none'
            : '0 4px 15px rgba(46, 204, 113, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseOver={(e) => {
          if (!isProcessing) {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(46, 204, 113, 0.4)';
          }
        }}
        onMouseOut={(e) => {
          if (!isProcessing) {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(46, 204, 113, 0.3)';
          }
        }}
      >
        {isProcessing ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span style={{
              display: 'inline-block',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white',
              animation: 'spin 1s linear infinite'
            }}></span>
            Processing Payment...
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🚀</span>
            Pay ₹{eventData.payment_amount} Now
          </div>
        )}
      </button>

      <p style={{
        margin: '1rem 0 0',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        textAlign: 'center',
        lineHeight: '1.4'
      }}>
        By proceeding, you agree to our terms and conditions.
        Your payment is processed securely by Razorpay.
      </p>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
};

export default RazorpayPayment;
