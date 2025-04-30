import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ref, get } from 'firebase/database';
import { database } from '../lib/firebase';

export default function AdminCheck({ setCurrentPage }) {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [adminStatus, setAdminStatus] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true);

        if (!user) {
          setError('You are not logged in');
          return;
        }

        // Check if user is in admins table
        const adminRef = ref(database, `admins/${user.uid}`);
        const snapshot = await get(adminRef);

        setAdminStatus(snapshot.exists());
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  return (
    <div className="container" style={{ padding: '3rem' }}>
      <h2>Admin Status Check</h2>

      {loading ? (
        <p>Checking admin status...</p>
      ) : error ? (
        <div style={{ color: 'var(--error)', marginBottom: '1rem' }}>
          <p>{error}</p>
        </div>
      ) : (
        <div>
          <p>User ID: {user?.id}</p>
          <p>Email: {user?.email}</p>
          <p>Admin status from context: {isAdmin ? 'Yes' : 'No'}</p>
          <p>Admin status from direct check: {adminStatus ? 'Yes' : 'No'}</p>

          <div style={{ marginTop: '2rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => setCurrentPage('admin-dashboard')}
              style={{ marginRight: '1rem' }}
            >
              Go to Admin Dashboard
            </button>

            <button
              className="btn"
              onClick={() => setCurrentPage('home')}
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
