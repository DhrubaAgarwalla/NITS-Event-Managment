import { createContext, useContext, useState, useEffect } from 'react';
import supabase, { refreshSession, signInWithGoogle, isAllowedEmail } from '../lib/supabase';

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
    // Initial session check
    const checkUser = async () => {
      try {
        setLoading(true);

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log('Session found on initial load');
          setUser(session.user);
          setSessionStatus('active');

          // Check user roles
          await checkUserRoles(session.user.id);
        } else {
          console.log('No session found on initial load');
          setSessionStatus('no-session');
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Helper function to check user roles
    const checkUserRoles = async (userId) => {
      try {
        // Check if user is an admin
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('id', userId)
          .single();

        if (adminData) {
          setIsAdmin(true);
          return;
        }

        // If not admin, check for club profile
        const { data: clubData } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', userId)
          .single();

        if (clubData) {
          setClub(clubData);
        }
      } catch (err) {
        console.error('Error checking user roles:', err);
      }
    };

    // Run initial check
    checkUser();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);

        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          setSessionStatus('active');
          await checkUserRoles(session.user.id);
        }
        else if (event === 'SIGNED_OUT') {
          setUser(null);
          setClub(null);
          setIsAdmin(false);
          setSessionStatus('signed-out');
        }
        else if (event === 'TOKEN_REFRESHED') {
          console.log('Auth token refreshed');
          setSessionStatus('refreshed');

          // Refresh user data if needed
          if (user) {
            await checkUserRoles(user.id);
          }
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
  const signIn = async (email, password, rememberMe = true) => {
    try {
      setLoading(true);
      setError(null);

      // Store email for reference
      localStorage.setItem('nits-event-last-email', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
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

      // Set status to indicate intentional sign out
      setSessionStatus('signing-out');

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setUser(null);
      setClub(null);
      setIsAdmin(false);
      setSessionStatus('signed-out');

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
        email_confirm: true // Auto-confirm email
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

  // Manual session refresh function
  const manualRefreshSession = async () => {
    try {
      setLoading(true);
      setSessionStatus('checking');

      const result = await refreshSession();
      console.log('Manual session refresh result:', result);

      if (result.valid) {
        setSessionStatus(result.refreshed ? 'refreshed' : 'active');
        return { success: true };
      } else {
        setSessionStatus('invalid');
        return { success: false };
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

      // Include full URL with protocol
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

      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

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
    signInWithGoogle,
    createClubAccount,
    refreshSession: manualRefreshSession,
    sendPasswordResetEmail,
    updatePassword,
    isAllowedEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
