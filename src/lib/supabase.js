import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ensure we have the required credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing. Please check your .env file.');
}

// Create the Supabase client with simple, robust configuration
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'nits-event-auth',
    // Use default localStorage implementation for simplicity and reliability
    storage: localStorage,
    // Use PKCE flow for better security
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-application-name': 'event-manager'
    }
  }
});

/**
 * Enhanced function to check and refresh the session if needed
 * with improved connection error handling
 */
export const refreshSession = async () => {
  try {
    // Check if we're online first
    if (!navigator.onLine) {
      console.warn('Device is offline, cannot refresh session');
      return { valid: false, offline: true };
    }

    // Add a timeout to the session check to prevent hanging
    const sessionPromise = supabase.auth.getSession();

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Session check timed out')), 10000); // 10 second timeout
    });

    // Race the session check against the timeout
    const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

    if (!session) {
      console.log('No active session found during refresh check');
      return { valid: false };
    }

    // Check if token is close to expiry (less than 10 minutes)
    const expiresAt = session.expires_at;
    const expiresIn = expiresAt * 1000 - Date.now();

    if (expiresIn < 600000) {
      console.log(`Session token expiring soon (${Math.round(expiresIn/1000/60)} minutes), refreshing...`);

      // Add timeout to refresh operation as well
      const refreshPromise = supabase.auth.refreshSession();
      const { error } = await Promise.race([refreshPromise, timeoutPromise]);

      if (error) {
        console.error('Error refreshing session:', error);
        return { valid: false, error };
      }

      console.log('Session refreshed successfully');
      return { valid: true, refreshed: true };
    }

    return { valid: true, expiresIn };
  } catch (error) {
    console.error('Error in refreshSession:', error);

    // Special handling for timeout and network errors
    if (error.message === 'Session check timed out' ||
        error.message.includes('network') ||
        error.message.includes('fetch')) {
      console.warn('Network issue detected during session refresh');
      return { valid: false, networkError: true };
    }

    return { valid: false, error };
  }
};

/**
 * Function to handle visibility change with improved error handling
 */
export const setupVisibilityChangeHandler = () => {
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      console.log('Tab became visible, checking session...');
      try {
        const result = await refreshSession();

        if (!result.valid) {
          console.warn('Session invalid after tab change, logging out...');
          // Force sign out and redirect to home page
          await forceSignOutAndRedirect();
        }
      } catch (error) {
        console.error('Error checking session after tab change:', error);
        // Force sign out and redirect to home page on error
        await forceSignOutAndRedirect();
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

/**
 * Force sign out and redirect to home page
 */
export const forceSignOutAndRedirect = async () => {
  try {
    // Clear any local storage items related to authentication
    localStorage.removeItem('nits-event-auth');

    // Sign out from Supabase
    await supabase.auth.signOut();

    // Redirect to home page
    window.location.href = '/';
  } catch (err) {
    console.error('Error during forced sign out:', err);
    // If all else fails, hard redirect to home
    window.location.href = '/';
  }
};

// Set up visibility change handler when the module loads
const cleanup = setupVisibilityChangeHandler();

// Set up an interval to refresh the session periodically with error handling
let refreshInterval = setInterval(async () => {
  try {
    const result = await refreshSession();

    if (!result.valid) {
      console.warn('Session invalid during periodic check, logging out...');
      // Force sign out and redirect to home page
      await forceSignOutAndRedirect();
    }
  } catch (error) {
    console.error('Error during periodic session refresh:', error);
    // Force sign out and redirect to home page on error
    await forceSignOutAndRedirect();
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Clean up function for the module
export const cleanupAuth = () => {
  cleanup();
  clearInterval(refreshInterval);
};

export default supabase;
