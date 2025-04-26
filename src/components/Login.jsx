import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { navigateAfterLogin } from '../utils/navigation';

export default function Login({ setCurrentPage, setIsClubLoggedIn }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use Supabase authentication
      const { success, error: authError, user, isAdmin, isClub } = await signIn(
        formData.email,
        formData.password,
        formData.rememberMe
      );

      if (success) {
        // Set club login state if needed
        if (isClub) {
          setIsClubLoggedIn(true);
        }

        // Navigate to the appropriate dashboard based on user role
        navigateAfterLogin(setCurrentPage, user, isAdmin, isClub);
      } else {
        setError(authError || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="section" id="login">
      <div className="container">
        <motion.div
          className="login-container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            maxWidth: '500px',
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
            style={{ textAlign: 'center', marginBottom: '2rem' }}
          >
            <span className="gradient-text">Login</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ textAlign: 'center', marginBottom: '1rem' }}
          >
            Access your dashboard to manage events and clubs
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

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                name="email"
                value={formData.email}
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
                placeholder="your-club@nitsilchar.ac.in"
              />
            </div>

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
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
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
                placeholder="Enter your password"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                style={{
                  marginRight: '0.5rem',
                  accentColor: 'var(--primary)'
                }}
              />
              <label
                htmlFor="rememberMe"
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Keep me logged in
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem' }}
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setCurrentPage('forgot-password'); }}
                style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}
              >
                Forgot password?
              </a>
            </div>
          </motion.form>

          <motion.div
            style={{ textAlign: 'center', marginTop: '2rem' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Not a registered club? <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('club-request'); }} style={{ color: 'var(--primary)' }}>Request club account</a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};


