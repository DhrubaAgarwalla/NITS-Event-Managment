import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

import logger from '../utils/logger';
const ForgotPassword = ({ setCurrentPage }) => {
  const { sendPasswordResetEmail, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validate email
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Send password reset email using AuthContext
      const { success, error: resetError } = await sendPasswordResetEmail(email);

      if (!success) throw new Error(resetError || 'Failed to send password reset email');

      // Show success message
      setSuccess(true);
    } catch (err) {
      logger.error('Password reset error:', err);
      setError(err.message || 'An error occurred while sending the password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="section" id="forgot-password" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <div className="container">
        <motion.div
          className="auth-container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            maxWidth: '500px',
            margin: '0 auto',
            padding: '2.5rem',
            backgroundColor: 'var(--dark-surface)',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
          }}
        >
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ marginBottom: '1.5rem', textAlign: 'center' }}
          >
            Reset Your Password
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ marginBottom: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}
          >
            Enter your email address and we'll send you a link to reset your password.
          </motion.p>

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

          {success ? (
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
              <h3 style={{ color: '#00ff33', marginTop: 0, marginBottom: '0.5rem' }}>Email Sent!</h3>
              <p style={{ margin: 0 }}>
                We've sent a password reset link to {email}. Please check your inbox and follow the instructions to reset your password.
              </p>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  placeholder="Enter your email address"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  marginBottom: '1.5rem'
                }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </motion.form>
          )}

          <motion.div
            style={{ textAlign: 'center' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage('login');
              }}
              style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}
            >
              Back to Login
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ForgotPassword;
