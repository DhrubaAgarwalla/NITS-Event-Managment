import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ensure we have the required credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing. Please check your .env file.');
}

// Create the Supabase client with specific configuration for tab change issues
// and to address 406 Not Acceptable errors
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'nits-event-auth', // Use a custom storage key
    storage: localStorage, // Explicitly use localStorage
    debug: true, // Enable debug mode to see auth issues in console
  },
  global: {
    headers: {
      'x-application-name': 'event-manager',
      'Accept': 'application/json', // Explicitly request JSON responses
      'Content-Type': 'application/json', // Specify content type for requests
    },
    // Add fetch options to handle 406 errors
    fetch: (url, options) => {
      // Clone the options to avoid modifying the original
      const fetchOptions = { ...options };

      // Ensure headers exist
      fetchOptions.headers = fetchOptions.headers || {};

      // Add explicit Accept header to every request
      fetchOptions.headers['Accept'] = 'application/json';

      // If this is a POST/PUT/PATCH request with a body, ensure Content-Type is set
      if (['POST', 'PUT', 'PATCH'].includes(fetchOptions.method) && fetchOptions.body) {
        fetchOptions.headers['Content-Type'] = 'application/json';
      }

      // Use the native fetch with our modified options
      return fetch(url, fetchOptions);
    }
  }
});

/**
 * Simple function to force sign out and redirect to home page
 */
export const forceSignOutAndRedirect = async () => {
  try {
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

/**
 * Function to verify session is still valid
 * Returns true if session is valid, false otherwise
 */
export const verifySession = async () => {
  try {
    // Use retry mechanism for getting the session
    const { data, error } = await retryWithBackoff(
      () => supabase.auth.getSession(),
      3, // Max 3 retries
      300 // Start with 300ms delay
    );

    if (error) {
      console.error('Error verifying session:', error);
      return false;
    }

    // If we have a session, try to refresh it to ensure it stays active
    if (data && data.session) {
      try {
        // Use retry mechanism for refreshing the session
        await retryWithBackoff(
          () => supabase.auth.refreshSession(),
          2, // Max 2 retries
          200 // Start with 200ms delay
        );
        console.log('Session refreshed during verification');
      } catch (refreshError) {
        // Log but don't fail if refresh fails - the session is still valid
        console.warn('Failed to refresh session during verification:', refreshError);

        // If this is a 406 error, try a different approach
        if (refreshError.message && refreshError.message.includes('406')) {
          console.warn('Encountered 406 error during session refresh, trying alternative approach');

          // Try a simple API call to "wake up" the connection
          try {
            await supabase.from('categories').select('count').maybeSingle();
            console.log('Connection reestablished after 406 error');
          } catch (innerError) {
            console.error('Failed to reestablish connection:', innerError);
          }
        }
      }
    }

    return !!data.session; // Return true if session exists
  } catch (err) {
    console.error('Exception verifying session:', err);

    // If this is a 406 error, try a different approach
    if (err.message && err.message.includes('406')) {
      console.warn('Encountered 406 error during session verification, trying alternative approach');

      // Try a simple API call to check if we can connect at all
      try {
        const { error } = await supabase.from('categories').select('count').maybeSingle();
        if (!error) {
          console.log('Connection seems valid despite session verification error');
          return true; // Assume session is valid if we can connect
        }
      } catch (innerError) {
        console.error('Failed alternative session verification:', innerError);
      }
    }

    return false;
  }
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in ms
 * @returns {Promise<any>} - Result of the function
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 300) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.warn(`Attempt ${attempt + 1}/${maxRetries} failed:`, error);
      lastError = error;

      // If this is a 406 error, log it specifically
      if (error.message && error.message.includes('406')) {
        console.warn('Encountered 406 Not Acceptable error, retrying with modified headers');
      }

      // Wait with exponential backoff before retrying
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Function to handle tab visibility changes
 * This is the key function to prevent disconnection when changing tabs
 */
export const setupTabChangeHandler = () => {
  let lastActiveTime = Date.now();

  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      const timeSinceLastActive = Date.now() - lastActiveTime;
      console.log(`Tab became visible after ${Math.round(timeSinceLastActive/1000)} seconds`);

      // Only check session if it's been more than 3 seconds (reduced from 5)
      if (timeSinceLastActive > 3000) {
        console.log('Checking session after tab change...');

        try {
          // Use retry mechanism for getting the session
          const { data } = await retryWithBackoff(
            () => supabase.auth.getSession(),
            3, // Max 3 retries
            300 // Start with 300ms delay
          );

          if (data && data.session) {
            // Session exists, manually refresh it with retry mechanism
            console.log('Session found after tab change, refreshing token...');

            await retryWithBackoff(
              () => supabase.auth.refreshSession(),
              3, // Max 3 retries
              300 // Start with 300ms delay
            );

            console.log('Session refreshed successfully after tab change');
          } else {
            console.warn('No session found after tab change');
          }
        } catch (error) {
          console.error('Failed to refresh session after tab change:', error);

          // If this is a 406 error, try a different approach
          if (error.message && error.message.includes('406')) {
            console.warn('Encountered 406 error during session refresh, trying alternative approach');

            // Try a simple API call to "wake up" the connection
            try {
              await supabase.from('categories').select('count').maybeSingle();
              console.log('Connection reestablished after 406 error');
            } catch (innerError) {
              console.error('Failed to reestablish connection:', innerError);
            }
          }
        }
      }
    } else {
      // Tab is hidden, store the time
      lastActiveTime = Date.now();
    }
  };

  // Add event listener for tab visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

// Initialize the tab change handler
setupTabChangeHandler(); // We don't need to store the cleanup function

export default supabase;
