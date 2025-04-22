import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const ResetPassword = ({ setCurrentPage }) => {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasResetToken, setHasResetToken] = useState(false);

  // Check for reset token in URL on component mount
  useEffect(() => {
    const checkForResetToken = () => {
      // Check if we're in a reset password flow
      const hash = window.location.hash;
      const query = window.location.search;

      // Supabase adds the token to the URL hash or query params
      // Look for any of these patterns that indicate a reset token
      const hasToken =
        hash.includes('type=recovery') ||
        query.includes('type=recovery') ||
        hash.includes('access_token=') ||
        query.includes('access_token=') ||
        query.includes('reset-password=true');

      console.log('Reset password token check:', { hash, query, hasToken });

      setHasResetToken(hasToken);

      if (!hasToken) {
        setError('Invalid or missing password reset token. Please request a new password reset link.');
      }
    };

    checkForResetToken();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validate passwords
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Update password using AuthContext
      const { success, error: updateError } = await updatePassword(password);

      if (!success) throw new Error(updateError || 'Failed to update password');

      // Show success message
      setSuccess(true);

      // Clear form
      setPassword('');
      setConfirmPassword('');

      // Redirect to home page after 3 seconds
      setTimeout(() => {
        setCurrentPage('home');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'An error occurred while resetting your password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="section" id="reset-password" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
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
            Create New Password
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ marginBottom: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}
          >
            Enter your new password below.
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
              <p style={{ margin: 0, marginBottom: '0.5rem' }}>{error}</p>
              {!hasResetToken && (
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage('forgot-password');
                    }}
                    style={{ color: '#ff0033', textDecoration: 'underline' }}
                  >
                    Request a new password reset link
                  </a>
                </p>
              )}
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
              <h3 style={{ color: '#00ff33', marginTop: 0, marginBottom: '0.5rem' }}>Password Updated!</h3>
              <p style={{ margin: 0 }}>
                Your password has been successfully updated. You will be redirected to the home page in a few seconds.
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
                  htmlFor="password"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!hasResetToken}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    fontSize: '1rem'
                  }}
                  placeholder="Enter your new password"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="confirmPassword"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={!hasResetToken}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    fontSize: '1rem'
                  }}
                  placeholder="Confirm your new password"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !hasResetToken}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: hasResetToken ? 'pointer' : 'not-allowed',
                  fontSize: '1rem',
                  fontWeight: '500',
                  marginBottom: '1.5rem',
                  opacity: hasResetToken ? 1 : 0.7
                }}
              >
                {isLoading ? 'Updating...' : 'Update Password'}
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

export default ResetPassword;
