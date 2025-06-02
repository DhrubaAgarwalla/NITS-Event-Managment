import { useState, useEffect } from 'react';
import { ref, set, get, onValue } from 'firebase/database';
import { database, auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

import logger from '../utils/logger';
export default function FirebaseTest() {
  const [testMessage, setTestMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Checking...');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check connection status
  useEffect(() => {
    const connectedRef = ref(database, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        setConnectionStatus('Connected to Firebase');
      } else {
        setConnectionStatus('Not connected to Firebase');
      }
    });

    // Check for current user
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  // Write test data
  const writeTestData = async () => {
    try {
      setLoading(true);
      setError(null);

      const testRef = ref(database, 'test');
      await set(testRef, {
        message: 'Hello from Firebase!',
        timestamp: new Date().toISOString()
      });

      setTestMessage('Test data written successfully');
    } catch (error) {
      logger.error('Error writing test data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Read test data
  const readTestData = async () => {
    try {
      setLoading(true);
      setError(null);

      const testRef = ref(database, 'test');
      const snapshot = await get(testRef);

      if (snapshot.exists()) {
        setTestMessage(`Test data: ${JSON.stringify(snapshot.val())}`);
      } else {
        setTestMessage('No test data found');
      }
    } catch (error) {
      logger.error('Error reading test data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Create a test user
  const createTestUser = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!email || !password) {
        setError('Email and password are required');
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      setTestMessage(`User created: ${userCredential.user.email}`);
    } catch (error) {
      logger.error('Error creating user:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign in a user
  const signInUser = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!email || !password) {
        setError('Email and password are required');
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      setTestMessage(`User signed in: ${userCredential.user.email}`);
    } catch (error) {
      logger.error('Error signing in:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOutUser = async () => {
    try {
      setLoading(true);
      setError(null);

      await signOut(auth);
      setUser(null);
      setTestMessage('User signed out');
    } catch (error) {
      logger.error('Error signing out:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <h2 className="gradient-text" style={{
        fontSize: '2.5rem',
        marginBottom: '30px',
        background: 'linear-gradient(90deg, #9c27b0, #673ab7)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textAlign: 'center'
      }}>
        Firebase Test
      </h2>

      <div style={{
        marginBottom: '30px',
        background: 'rgba(156, 39, 176, 0.1)',
        padding: '20px',
        borderRadius: '10px',
        border: '1px solid rgba(156, 39, 176, 0.2)'
      }}>
        <h3 style={{
          color: '#9c27b0',
          marginBottom: '15px',
          fontSize: '1.3rem',
          borderBottom: '1px solid rgba(156, 39, 176, 0.2)',
          paddingBottom: '10px'
        }}>
          Connection Status
        </h3>
        <p style={{
          fontSize: '1.1rem',
          color: connectionStatus.includes('Connected') ? '#4CAF50' : '#f44336',
          fontWeight: '500'
        }}>
          {connectionStatus}
        </p>
      </div>

      <div style={{
        marginBottom: '30px',
        background: 'rgba(156, 39, 176, 0.1)',
        padding: '20px',
        borderRadius: '10px',
        border: '1px solid rgba(156, 39, 176, 0.2)'
      }}>
        <h3 style={{
          color: '#9c27b0',
          marginBottom: '15px',
          fontSize: '1.3rem',
          borderBottom: '1px solid rgba(156, 39, 176, 0.2)',
          paddingBottom: '10px'
        }}>
          Database Test
        </h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button
            onClick={writeTestData}
            disabled={loading}
            style={{
              padding: '10px 15px',
              background: 'rgba(156, 39, 176, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontWeight: '500',
              flex: 1
            }}
          >
            Write Test Data
          </button>
          <button
            onClick={readTestData}
            disabled={loading}
            style={{
              padding: '10px 15px',
              background: 'rgba(103, 58, 183, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontWeight: '500',
              flex: 1
            }}
          >
            Read Test Data
          </button>
        </div>
        {testMessage && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '15px',
            borderRadius: '5px',
            marginTop: '10px'
          }}>
            <p style={{ margin: 0, color: 'var(--text-primary)' }}>{testMessage}</p>
          </div>
        )}
      </div>

      <div style={{
        marginBottom: '30px',
        background: 'rgba(156, 39, 176, 0.1)',
        padding: '20px',
        borderRadius: '10px',
        border: '1px solid rgba(156, 39, 176, 0.2)'
      }}>
        <h3 style={{
          color: '#9c27b0',
          marginBottom: '15px',
          fontSize: '1.3rem',
          borderBottom: '1px solid rgba(156, 39, 176, 0.2)',
          paddingBottom: '10px'
        }}>
          Authentication Test
        </h3>
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: '10px 15px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '5px',
                color: 'var(--text-primary)',
                flex: '1 1 200px'
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: '10px 15px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '5px',
                color: 'var(--text-primary)',
                flex: '1 1 200px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={createTestUser}
              disabled={loading || !email || !password}
              style={{
                padding: '10px 15px',
                background: 'rgba(156, 39, 176, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer',
                opacity: (loading || !email || !password) ? 0.7 : 1,
                fontWeight: '500',
                flex: '1 1 auto'
              }}
            >
              Create User
            </button>
            <button
              onClick={signInUser}
              disabled={loading || !email || !password}
              style={{
                padding: '10px 15px',
                background: 'rgba(103, 58, 183, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer',
                opacity: (loading || !email || !password) ? 0.7 : 1,
                fontWeight: '500',
                flex: '1 1 auto'
              }}
            >
              Sign In
            </button>
            <button
              onClick={signOutUser}
              disabled={loading || !user}
              style={{
                padding: '10px 15px',
                background: 'rgba(233, 30, 99, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: (loading || !user) ? 'not-allowed' : 'pointer',
                opacity: (loading || !user) ? 0.7 : 1,
                fontWeight: '500',
                flex: '1 1 auto'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
        {user && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '15px',
            borderRadius: '5px',
            marginTop: '15px'
          }}>
            <p style={{ margin: '0 0 5px 0', color: 'var(--text-primary)' }}>
              <strong>Current User:</strong> {user.email}
            </p>
            <p style={{ margin: 0, color: 'var(--text-primary)' }}>
              <strong>User ID:</strong> {user.uid}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          color: '#f44336',
          marginTop: '20px',
          background: 'rgba(244, 67, 54, 0.1)',
          padding: '15px',
          borderRadius: '5px',
          border: '1px solid rgba(244, 67, 54, 0.3)'
        }}>
          <p style={{ margin: 0 }}><strong>Error:</strong> {error}</p>
        </div>
      )}
    </div>
  );
}
