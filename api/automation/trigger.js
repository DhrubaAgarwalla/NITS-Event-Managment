/**
 * Public Automation Trigger API
 * Allows automation to run without authentication for background services
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, update } from 'firebase/database';

// Firebase configuration (use environment variables in production)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

/**
 * Event status calculation (duplicated from utils for API independence)
 */
function getEventStatus(event) {
  if (!event.start_date || !event.end_date) {
    return 'upcoming';
  }

  const now = new Date();
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const eventEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  if (today < eventStart) {
    return 'upcoming';
  } else if (today >= eventStart && today <= eventEnd) {
    return 'ongoing';
  } else {
    return 'completed';
  }
}

/**
 * Check if registration should be auto-closed
 */
function shouldAutoCloseRegistration(event) {
  if (!event.start_date || !event.end_date) {
    return false;
  }

  const status = getEventStatus(event);

  if (status === 'completed') {
    return true;
  }

  if (event.registration_deadline) {
    const deadline = new Date(event.registration_deadline);
    const now = new Date();
    if (now > deadline) {
      return true;
    }
  }

  return false;
}

/**
 * Main automation function
 */
async function runAutomation() {
  const results = {
    registrationsClosed: [],
    statusesUpdated: [],
    eventsArchived: [],
    errors: [],
    timestamp: new Date().toISOString()
  };

  try {
    console.log('🤖 Starting public automation run...');

    // Get all events
    const eventsRef = ref(database, 'events');
    const eventsSnapshot = await get(eventsRef);

    if (!eventsSnapshot.exists()) {
      console.log('📭 No events found');
      return results;
    }

    const eventsData = eventsSnapshot.val();
    const events = Object.keys(eventsData).map(key => ({
      id: key,
      ...eventsData[key]
    }));

    console.log(`📊 Processing ${events.length} events...`);

    // Process each event
    for (const event of events) {
      try {
        // Auto-close registrations
        const shouldClose = shouldAutoCloseRegistration(event);
        if (shouldClose && event.registration_open) {
          console.log(`🔒 Auto-closing registration for: ${event.title}`);

          const eventRef = ref(database, `events/${event.id}`);
          await update(eventRef, {
            registration_open: false,
            updated_at: new Date().toISOString(),
            automation_last_run: new Date().toISOString()
          });

          results.registrationsClosed.push({
            id: event.id,
            title: event.title
          });
        }

        // Update event status
        const currentStatus = getEventStatus(event);
        if (event.status !== currentStatus) {
          console.log(`📝 Updating status for: ${event.title} (${event.status} → ${currentStatus})`);

          const eventRef = ref(database, `events/${event.id}`);
          await update(eventRef, {
            status: currentStatus,
            updated_at: new Date().toISOString(),
            automation_last_run: new Date().toISOString()
          });

          results.statusesUpdated.push({
            id: event.id,
            title: event.title,
            oldStatus: event.status,
            newStatus: currentStatus
          });
        }

        // Archive old completed events (30+ days old)
        if (currentStatus === 'completed' && !event.is_archived) {
          const endDate = new Date(event.end_date);
          const daysSinceEnd = (new Date() - endDate) / (1000 * 60 * 60 * 24);

          if (daysSinceEnd > 30) {
            console.log(`📦 Archiving old event: ${event.title}`);

            const eventRef = ref(database, `events/${event.id}`);
            await update(eventRef, {
              is_archived: true,
              updated_at: new Date().toISOString(),
              automation_last_run: new Date().toISOString()
            });

            results.eventsArchived.push({
              id: event.id,
              title: event.title,
              daysSinceEnd: Math.floor(daysSinceEnd)
            });
          }
        }



      } catch (error) {
        console.error(`❌ Error processing event ${event.id}:`, error);
        results.errors.push({
          eventId: event.id,
          error: error.message
        });
      }
    }

    // Log automation run
    const logRef = ref(database, `automation_logs/${Date.now()}`);
    await set(logRef, {
      timestamp: results.timestamp,
      type: 'public_api',
      results,
      eventsProcessed: events.length,
      status: results.errors.length > 0 ? 'partial_success' : 'success'
    });

    // Update automation status
    const statusRef = ref(database, 'automation_status');
    await set(statusRef, {
      status: 'running',
      lastUpdate: results.timestamp,
      lastRunType: 'public_api',
      eventsProcessed: events.length,
      actionsExecuted: results.registrationsClosed.length +
                      results.statusesUpdated.length +
                      results.eventsArchived.length,
      errors: results.errors.length
    });

    const totalActions = results.registrationsClosed.length +
                        results.statusesUpdated.length +
                        results.eventsArchived.length;

    console.log(`✅ Automation completed: ${totalActions} actions executed`);

    return results;

  } catch (error) {
    console.error('❌ Automation failed:', error);
    results.errors.push({
      type: 'system_error',
      error: error.message
    });

    // Log failed automation
    try {
      const logRef = ref(database, `automation_logs/${Date.now()}`);
      await set(logRef, {
        timestamp: results.timestamp,
        type: 'public_api',
        status: 'error',
        error: error.message,
        results
      });
    } catch (logError) {
      console.error('Failed to log automation error:', logError);
    }

    return results;
  }
}

/**
 * Vercel serverless function handler
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET and POST requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const results = await runAutomation();

    res.status(200).json({
      success: true,
      message: 'Automation completed successfully',
      data: results
    });

  } catch (error) {
    console.error('API Error:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
