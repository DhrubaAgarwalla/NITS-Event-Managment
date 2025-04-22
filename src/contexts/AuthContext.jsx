import { createContext, useContext, useState, useEffect, useRef } from 'react';
import supabase, { startSessionMonitoring, checkAndRefreshSession } from '../lib/supabase';

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
  const stopSessionMonitoring = useRef(null);

  // Check for current session on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        setLoading(true);

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setUser(session.user);
          setSessionStatus('active');

          // Start session monitoring
          if (stopSessionMonitoring.current) {
            stopSessionMonitoring.current();
          }
          stopSessionMonitoring.current = startSessionMonitoring(20000); // Check every 20 seconds

          // Check if user is an admin
          const { data: adminData } = await supabase
            .from('admins')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (adminData) {
            setIsAdmin(true);
          } else {
            // If not admin, check for club profile
            const { data: clubData } = await supabase
              .from('clubs')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (clubData) {
              setClub(clubData);
            }
          }
        } else {
          setSessionStatus('no-session');
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);

        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          setSessionStatus('active');

          // Start session monitoring when user signs in
          if (stopSessionMonitoring.current) {
            stopSessionMonitoring.current();
          }
          stopSessionMonitoring.current = startSessionMonitoring(20000); // Check every 20 seconds

          // Check if user is an admin
          const { data: adminData } = await supabase
            .from('admins')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (adminData) {
            setIsAdmin(true);
          } else {
            // If not admin, check for club profile
            const { data: clubData } = await supabase
              .from('clubs')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (clubData) {
              setClub(clubData);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setClub(null);
          setIsAdmin(false);
          setSessionStatus('signed-out');

          // Stop session monitoring when user signs out
          if (stopSessionMonitoring.current) {
            stopSessionMonitoring.current();
            stopSessionMonitoring.current = null;
          }
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Auth token refreshed');
          setSessionStatus('refreshed');

          // Force a session check to update user data
          const sessionCheck = await checkAndRefreshSession();
          console.log('Session check after token refresh:', sessionCheck);
        }
      }
    );

    // Clean up subscription
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Sign in function
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check user roles
      let isUserAdmin = false;
      let isUserClub = false;
      let clubData = null;

      if (data.user) {
        // Check if user is an admin
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (adminData) {
          isUserAdmin = true;
        } else {
          // If not admin, check for club profile
          const { data: fetchedClubData } = await supabase
            .from('clubs')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (fetchedClubData) {
            isUserClub = true;
            clubData = fetchedClubData;
          }
        }
      }

      return {
        success: true,
        user: data.user,
        isAdmin: isUserAdmin,
        isClub: isUserClub,
        club: clubData
      };
    } catch (err) {
      console.error('Error signing in:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setUser(null);
      setClub(null);
      setIsAdmin(false);

      return { success: true };
    } catch (err) {
      console.error('Error signing out:', err);
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
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
      });

      if (authError) throw authError;

      // Create club profile
      if (authData.user) {
        const { data, error } = await supabase
          .from('clubs')
          .insert([{ ...clubData, id: authData.user.id }])
          .select();

        if (error) throw error;

        return { success: true, club: data[0] };
      }

      throw new Error('Failed to create user');
    } catch (err) {
      console.error('Error creating club account:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Add a function to manually check and refresh the session
  const refreshSession = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setSessionStatus('checking');

      const result = await checkAndRefreshSession(forceRefresh);
      console.log('Manual session refresh result:', result);

      if (result.valid) {
        // If session is valid, update the session status
        setSessionStatus(result.refreshed ? 'refreshed' : 'active');

        // If we haven't fetched the user's club data yet, do it now
        if (user && !club && !isAdmin) {
          try {
            const { data: clubData } = await supabase
              .from('clubs')
              .select('*')
              .eq('id', user.id)
              .single();

            if (clubData) {
              setClub(clubData);
            }
          } catch (clubErr) {
            console.error('Error fetching club data during refresh:', clubErr);
          }
        }

        return { success: true, ...result };
      } else {
        // If session is invalid, update the session status
        setSessionStatus('invalid');

        // If the reason is 'no-session', clear the user data
        if (result.reason === 'no-session') {
          setUser(null);
          setClub(null);
          setIsAdmin(false);
        }

        return { success: false, ...result };
      }
    } catch (err) {
      console.error('Error in manual session refresh:', err);
      setError(err.message);
      setSessionStatus('error');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Send password reset email
  const sendPasswordResetEmail = async (email) => {
    try {
      setLoading(true);
      setError(null);

      // Make sure we include the full URL with protocol
      const baseUrl = window.location.origin;
      const redirectUrl = `${baseUrl}?reset-password=true`;

      console.log('Sending password reset email with redirect URL:', redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      return { success: true };
    } catch (err) {
      console.error('Error sending password reset email:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Update user password
  const updatePassword = async (password) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Attempting to update password');

      // First check if we have a session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Current session:', sessionData?.session ? 'Active' : 'None');

      // Update the user's password
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Error in updateUser:', error);
        throw error;
      }

      console.log('Password updated successfully:', data?.user ? 'User updated' : 'No user data');

      return { success: true };
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err.message);
      return { success: false, error: err.message };
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
    refreshSession,
    sendPasswordResetEmail,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
