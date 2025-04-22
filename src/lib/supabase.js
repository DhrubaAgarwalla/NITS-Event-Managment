import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ensure we have the required credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing. Please check your .env file.');
}

// Create the Supabase client with enhanced session persistence
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'event-manager-auth-storage',
    storage: window.localStorage
  },
  global: {
    headers: {
      'x-application-name': 'event-manager'
    },
    // Increase timeout for better reliability
    fetch: (url, options) => {
      const timeout = 30000; // 30 seconds timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      return fetch(url, {
        ...options,
        signal: controller.signal
      })
        .then(response => {
          clearTimeout(timeoutId);
          return response;
        })
        .catch(error => {
          clearTimeout(timeoutId);
          console.error('Supabase fetch error:', error);
          throw error;
        });
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Add session monitoring
let lastSessionCheck = 0;
let sessionCheckInterval = null;

// Function to check session status and refresh if needed
export const checkAndRefreshSession = async (forceRefresh = false) => {
  try {
    // Don't check too frequently (limit to once every 15 seconds) unless forced
    const now = Date.now();
    if (!forceRefresh && now - lastSessionCheck < 15000) {
      return { valid: true };
    }

    lastSessionCheck = now;

    // Get current session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log('No active session found');
      return { valid: false, reason: 'no-session' };
    }

    // Check if token is expired or about to expire
    const expiresAt = session.expires_at;
    const expiresIn = expiresAt * 1000 - Date.now();

    // If token expires in less than 10 minutes or force refresh is requested, refresh it
    if (forceRefresh || expiresIn < 600000) {
      console.log(`Session token ${forceRefresh ? 'force refreshing' : 'expiring soon, refreshing...'}`);

      // Try refreshing the session
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Error refreshing session:', error);

        // If refresh fails, try to get the session again to see if it's still valid
        const { data: retryData } = await supabase.auth.getSession();
        if (retryData?.session) {
          console.log('Session still valid despite refresh failure');
          return { valid: true, expiresIn: retryData.session.expires_at * 1000 - Date.now(), refreshFailed: true };
        }

        return { valid: false, reason: 'refresh-failed', error };
      }

      console.log('Session refreshed successfully');
      return { valid: true, refreshed: true };
    }

    return { valid: true, expiresIn };
  } catch (error) {
    console.error('Error checking session:', error);
    return { valid: false, reason: 'check-error', error };
  }
};

// Start session monitoring
export const startSessionMonitoring = (intervalMs = 30000) => {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
  }

  // Initial check with force refresh to ensure we start with a fresh token
  checkAndRefreshSession(true);

  // Set up periodic checks
  sessionCheckInterval = setInterval(() => checkAndRefreshSession(), intervalMs);
  console.log(`Session monitoring started (interval: ${intervalMs}ms)`);

  // Also check when the tab becomes visible again
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('Tab became visible, checking session...');
      checkAndRefreshSession(true); // Force refresh when tab becomes visible
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    if (sessionCheckInterval) {
      clearInterval(sessionCheckInterval);
      sessionCheckInterval = null;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      console.log('Session monitoring stopped');
    }
  };
};

export default supabase;
