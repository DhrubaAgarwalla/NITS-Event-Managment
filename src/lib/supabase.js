import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ensure we have the required credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing. Please check your .env file.');
}

// Create the Supabase client with Google OAuth support
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'nits-event-auth',
    storage: localStorage,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-application-name': 'event-manager'
    }
  }
});

/**
 * Sign in with Google OAuth
 * This function redirects the user to Google's authentication page
 */
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          // Optional: Restrict to specific domain
          // hd: 'nitsilchar.ac.in', // Uncomment to restrict to NIT Silchar domain
          // access_type: 'offline', // Get a refresh token
          // prompt: 'consent', // Force consent screen
        }
      }
    });

    if (error) {
      console.error('Error initiating Google sign-in:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception during Google sign-in:', error);
    return { success: false, error };
  }
};

/**
 * Check if the user's email is from an allowed domain
 * This can be used to restrict access to specific email domains
 */
export const isAllowedEmail = (email) => {
  if (!email) return false;

  // Allow any email for now - you can restrict to specific domains if needed
  // Example: return email.endsWith('@nitsilchar.ac.in');
  return true;
};

/**
 * Check and refresh the session if needed
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
      const { error } = await supabase.auth.refreshSession();

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
 * Handle visibility change to maintain session across tab changes
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
