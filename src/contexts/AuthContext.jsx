import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { auth, database, forceSignOutAndRedirect } from '../lib/firebase';

import logger from '../utils/logger';

// Helper function to convert Firebase auth errors to user-friendly messages
const getAuthErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/operation-not-allowed':
      return 'This operation is not allowed. Please contact support.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
};

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [club, setClub] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('checking');

  // Check for current session on mount and set up auth state listener
  useEffect(() => {
    logger.log('Setting up Firebase auth state listener');

    // Check if there was an intentional logout
    const wasLoggedOut = localStorage.getItem('nits-event-logout') === 'true';
    if (wasLoggedOut) {
      logger.log('Detected previous logout, clearing flag');
      localStorage.removeItem('nits-event-logout');
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        logger.log('User is signed in:', currentUser.uid);
        setUser(currentUser);
        setSessionStatus('active');

        // Check user roles
        await checkUserRoles(currentUser.uid);
      } else {
        logger.log('No user is signed in');
        setUser(null);
        setClub(null);
        setIsAdmin(false);
        setSessionStatus('no-session');
      }

      setLoading(false);
    });

    // Helper function to check user roles
    const checkUserRoles = async (userId) => {
      try {
        // Check if user is an admin
        const adminRef = ref(database, `admins/${userId}`);
        const adminSnapshot = await get(adminRef);

        if (adminSnapshot.exists()) {
          logger.log('User is an admin');
          setIsAdmin(true);
          return;
        }

        // If not admin, check for club profile
        const clubRef = ref(database, `clubs/${userId}`);
        const clubSnapshot = await get(clubRef);

        if (clubSnapshot.exists()) {
          logger.log('User is a club');
          setClub({
            id: userId,
            ...clubSnapshot.val()
          });
        }
      } catch (err) {
        logger.error('Error checking user roles:', err);
      }
    };

    // Add storage event listener to sync auth state across tabs
    const handleStorageChange = (event) => {
      // Firebase handles this automatically, but we'll keep the listener for custom logic
      if (event.key === 'firebase:authUser') {
        logger.log('Auth storage changed in another tab');

        // If auth was removed in another tab but we still have a user here
        if (!event.newValue && user) {
          logger.log('Auth token removed in another tab, signing out in this tab');
          forceSignOutAndRedirect();
        } else if (event.newValue && !user) {
          logger.log('Auth token added in another tab, refreshing page to sync state');
          window.location.reload();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Add online/offline event listeners
    const handleOffline = () => {
      logger.log('Device went offline');
      setSessionStatus('offline');
    };

    const handleOnline = async () => {
      logger.log('Device came online, checking session');
      if (auth.currentUser) {
        setSessionStatus('active');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup subscription
    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sign in function
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      // Store email for reference
      localStorage.setItem('nits-event-last-email', email);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;

      // Check user roles
      let isUserAdmin = false;
      let isUserClub = false;
      let clubData = null;

      // Check if user is an admin
      const adminRef = ref(database, `admins/${currentUser.uid}`);
      const adminSnapshot = await get(adminRef);

      if (adminSnapshot.exists()) {
        isUserAdmin = true;
      } else {
        // If not admin, check for club profile
        const clubRef = ref(database, `clubs/${currentUser.uid}`);
        const clubSnapshot = await get(clubRef);

        if (clubSnapshot.exists()) {
          isUserClub = true;
          clubData = {
            id: currentUser.uid,
            ...clubSnapshot.val()
          };
        }
      }

      return {
        success: true,
        user: currentUser,
        isAdmin: isUserAdmin,
        isClub: isUserClub,
        club: clubData
      };
    } catch (err) {
      logger.error('Error signing in:', err);
      const userFriendlyError = getAuthErrorMessage(err);
      setError(userFriendlyError);
      return { success: false, error: userFriendlyError };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      // Set status to indicate intentional sign out
      setSessionStatus('signing-out');

      await firebaseSignOut(auth);

      setUser(null);
      setClub(null);
      setIsAdmin(false);
      setSessionStatus('signed-out');

      return { success: true };
    } catch (err) {
      logger.error('Error signing out:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Create club account (admin only)
  const createClubAccount = async (email, password, clubData) => {
    try {
      setLoading(true);
      setError(null);

      // Only admins can create club accounts
      if (!isAdmin) {
        throw new Error('Only administrators can create club accounts');
      }

      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Update user profile with club name
      await updateProfile(newUser, {
        displayName: clubData.name
      });

      // Create club profile in database
      const clubRef = ref(database, `clubs/${newUser.uid}`);
      await set(clubRef, {
        ...clubData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      return {
        success: true,
        club: {
          id: newUser.uid,
          ...clubData
        }
      };
    } catch (err) {
      logger.error('Error creating club account:', err);
      const userFriendlyError = getAuthErrorMessage(err);
      setError(userFriendlyError);
      return { success: false, error: userFriendlyError };
    } finally {
      setLoading(false);
    }
  };

  // Manual session refresh function (for compatibility with old code)
  const manualRefreshSession = async () => {
    try {
      setLoading(true);
      setSessionStatus('checking');

      // In Firebase, we don't need to manually refresh the session
      // But we'll check if the user is still authenticated
      if (auth.currentUser) {
        logger.log('User is still authenticated');
        setSessionStatus('active');
        return { success: true, valid: true };
      } else {
        logger.log('No valid session found');
        setSessionStatus('invalid');
        return { success: false, valid: false };
      }
    } catch (err) {
      logger.error('Error refreshing session:', err);
      setError(err.message);
      setSessionStatus('error');
      return { success: false, valid: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Send password reset email
  const sendPasswordResetEmail = async (email) => {
    try {
      setLoading(true);
      setError(null);

      // Include full URL with protocol
      const baseUrl = window.location.origin;
      const actionCodeSettings = {
        url: `${baseUrl}?reset-password=true`,
        handleCodeInApp: true
      };

      logger.log('Sending password reset email with redirect URL:', actionCodeSettings.url);

      await firebaseSendPasswordResetEmail(auth, email, actionCodeSettings);

      return { success: true };
    } catch (err) {
      logger.error('Error sending password reset email:', err);
      const userFriendlyError = getAuthErrorMessage(err);
      setError(userFriendlyError);
      return { success: false, error: userFriendlyError };
    } finally {
      setLoading(false);
    }
  };

  // Update user password
  const updatePassword = async (password) => {
    try {
      setLoading(true);
      setError(null);

      if (!auth.currentUser) {
        throw new Error('No authenticated user found');
      }

      await firebaseUpdatePassword(auth.currentUser, password);

      return { success: true };
    } catch (err) {
      logger.error('Error updating password:', err);
      const userFriendlyError = getAuthErrorMessage(err);
      setError(userFriendlyError);
      return { success: false, error: userFriendlyError };
    } finally {
      setLoading(false);
    }
  };

  // Value to be provided by the context
  const value = {
    user,
    club,
    isAdmin,
    loading,
    error,
    sessionStatus,
    signIn,
    signOut,
    createClubAccount,
    refreshSession: manualRefreshSession,
    sendPasswordResetEmail,
    updatePassword,
    forceSignOutAndRedirect,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
