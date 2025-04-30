import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Realtime Database
const database = getDatabase(app);

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Use emulators for local development if needed
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  // Uncomment these lines to use Firebase emulators during development
  // import { connectAuthEmulator } from 'firebase/auth';
  // import { connectDatabaseEmulator } from 'firebase/database';
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectDatabaseEmulator(database, 'localhost', 9000);
}

/**
 * Force sign out and redirect to home page
 */
export const forceSignOutAndRedirect = async () => {
  try {
    // Sign out from Firebase
    await auth.signOut();

    // Redirect to home page
    window.location.href = '/';
  } catch (err) {
    console.error('Error during forced sign out:', err);
    // If all else fails, hard redirect to home
    window.location.href = '/';
  }
};

export { app, auth, database, analytics };
