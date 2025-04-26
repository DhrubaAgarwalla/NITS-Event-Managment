import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { navigateAfterLogin } from '../utils/navigation';
import supabase from '../lib/supabase';

export default function Login({ setCurrentPage, setIsClubLoggedIn }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for OAuth redirect on page load
  useEffect(() => {
    const checkOAuthRedirect = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (data?.session && !error) {
        console.log('OAuth redirect detected, user is signed in');

        // Check if the user's email is allowed
        if (!isAllowedEmail(data.session.user.email)) {
          console.error('Email domain not allowed:', data.session.user.email);
          setError('Your email domain is not authorized. Please use an approved email address.');
          await supabase.auth.signOut();
          return;
        }

        // Check user roles
        let isAdmin = false;
        let isClub = false;

        try {
          // Check if user is an admin
          const { data: adminData } = await supabase
            .from('admins')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          if (adminData) {
            isAdmin = true;
          } else {
            // If not admin, check for club profile
            const { data: clubData } = await supabase
              .from('clubs')
              .select('*')
              .eq('id', data.session.user.id)
              .single();

            if (clubData) {
              isClub = true;
              setIsClubLoggedIn(true);
            }
          }

          // Navigate to the appropriate dashboard
          navigateAfterLogin(setCurrentPage, data.session.user, isAdmin, isClub);
        } catch (err) {
          console.error('Error checking user roles after OAuth redirect:', err);
          setError('Authentication successful, but there was an error loading your profile.');
        }
      }
    };

    checkOAuthRedirect();
  }, [setCurrentPage, setIsClubLoggedIn]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const { signIn, signInWithGoogle, isAllowedEmail } = useAuth();

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const { success, error } = await signInWithGoogle();

      if (!success) {
        throw error || new Error('Failed to initiate Google sign-in');
      }

      // The user will be redirected to Google's OAuth page
      // After authentication, they'll be redirected back to our app
      // The redirect handling is done in the useEffect above
    } catch (err) {
      console.error('Error signing in with Google:', err);
      setError(err.message || 'An error occurred during Google sign-in');
      setGoogleLoading(false);
    }
  };

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
              disabled={isLoading || googleLoading}
            >
              {isLoading ? 'Logging in...' : 'Login with Email'}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '1.5rem 0',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
              <span style={{ margin: '0 10px', fontSize: '0.9rem' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading || googleLoading}
              style={{
                width: '100%',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '10px' }}>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {googleLoading ? 'Connecting...' : 'Continue with Google'}
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


