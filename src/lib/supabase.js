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
 * Simple function to check and refresh the session if needed
 */
export const refreshSession = async () => {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log('No active session found during refresh check');
      return { valid: false };
    }

    // Check if token is close to expiry (less than 10 minutes)
    const expiresAt = session.expires_at;
    const expiresIn = expiresAt * 1000 - Date.now();

    if (expiresIn < 600000) {
      console.log(`Session token expiring soon (${Math.round(expiresIn/1000/60)} minutes), refreshing...`);
      const { data, error } = await supabase.auth.refreshSession();

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
    return { valid: false, error };
  }
};

/**
 * Simple function to handle visibility change
 */
export const setupVisibilityChangeHandler = () => {
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      console.log('Tab became visible, checking session...');
      await refreshSession();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

// Set up visibility change handler when the module loads
const cleanup = setupVisibilityChangeHandler();

// Set up a simple interval to refresh the session periodically
let refreshInterval = setInterval(() => {
  refreshSession();
}, 5 * 60 * 1000); // Check every 5 minutes

// Clean up function for the module
export const cleanupAuth = () => {
  cleanup();
  clearInterval(refreshInterval);
};

export default supabase;
