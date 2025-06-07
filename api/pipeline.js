// Consolidated Data Pipeline API endpoints
import { ref, get, set } from 'firebase/database';
import { database } from '../src/lib/firebase-admin.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'start':
        return await startPipeline(req, res);
      case 'stop':
        return await stopPipeline(req, res);
      case 'status':
        return await getPipelineStatus(req, res);
      case 'health':
        return await getHealthStatus(req, res);
      case 'analytics':
        return await getAnalytics(req, res);
      case 'trigger':
        return await triggerPipeline(req, res);
      default:
        return res.status(404).json({ error: 'Action not found' });
    }
  } catch (error) {
    console.error('Pipeline API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Start Pipeline
async function startPipeline(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const statusRef = ref(database, 'pipeline_status');
    await set(statusRef, {
      status: 'running',
      started_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    });

    console.log('Data pipeline started');

    return res.status(200).json({
      success: true,
      message: 'Pipeline started successfully',
      status: 'running',
      started_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error starting pipeline:', error);
    return res.status(500).json({ error: 'Failed to start pipeline' });
  }
}

// Stop Pipeline
async function stopPipeline(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const statusRef = ref(database, 'pipeline_status');
    await set(statusRef, {
      status: 'stopped',
      stopped_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    });

    console.log('Data pipeline stopped');

    return res.status(200).json({
      success: true,
      message: 'Pipeline stopped successfully',
      status: 'stopped',
      stopped_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error stopping pipeline:', error);
    return res.status(500).json({ error: 'Failed to stop pipeline' });
  }
}

// Get Pipeline Status
async function getPipelineStatus(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const statusRef = ref(database, 'pipeline_status');
    const snapshot = await get(statusRef);

    if (!snapshot.exists()) {
      return res.status(200).json({
        status: 'unknown',
        message: 'Pipeline status not found'
      });
    }

    const status = snapshot.val();
    return res.status(200).json(status);
  } catch (error) {
    console.error('Error getting pipeline status:', error);
    return res.status(500).json({ error: 'Failed to get pipeline status' });
  }
}

// Get Health Status
async function getHealthStatus(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check database connectivity
    const healthRef = ref(database, 'health_check');
    const timestamp = new Date().toISOString();
    await set(healthRef, { timestamp });

    // Check if we can read back
    const snapshot = await get(healthRef);
    const canRead = snapshot.exists() && snapshot.val().timestamp === timestamp;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: canRead ? 'healthy' : 'unhealthy',
          can_write: true,
          can_read: canRead
        },
        api: {
          status: 'healthy',
          response_time: Date.now()
        }
      }
    };

    return res.status(200).json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

// Get Analytics
async function getAnalytics(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get basic analytics from Firebase
    const [eventsSnapshot, registrationsSnapshot, clubsSnapshot] = await Promise.all([
      get(ref(database, 'events')),
      get(ref(database, 'registrations')),
      get(ref(database, 'clubs'))
    ]);

    const events = eventsSnapshot.exists() ? Object.values(eventsSnapshot.val()) : [];
    const registrations = registrationsSnapshot.exists() ? Object.values(registrationsSnapshot.val()) : [];
    const clubs = clubsSnapshot.exists() ? Object.values(clubsSnapshot.val()) : [];

    // Calculate analytics
    const analytics = {
      overview: {
        total_events: events.length,
        total_registrations: registrations.length,
        total_clubs: clubs.length,
        active_events: events.filter(e => e.status === 'active').length
      },
      events: {
        by_status: events.reduce((acc, event) => {
          acc[event.status] = (acc[event.status] || 0) + 1;
          return acc;
        }, {}),
        by_category: events.reduce((acc, event) => {
          const category = event.category || 'uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {})
      },
      registrations: {
        by_status: registrations.reduce((acc, reg) => {
          acc[reg.status] = (acc[reg.status] || 0) + 1;
          return acc;
        }, {}),
        total_revenue: registrations
          .filter(r => r.payment_amount)
          .reduce((sum, r) => sum + (r.payment_amount || 0), 0)
      },
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(analytics);
  } catch (error) {
    console.error('Error getting analytics:', error);
    return res.status(500).json({ error: 'Failed to get analytics' });
  }
}

// Trigger Pipeline
async function triggerPipeline(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type = 'manual' } = req.body;

    // Log the trigger
    const triggerRef = ref(database, `pipeline_triggers/${Date.now()}`);
    await set(triggerRef, {
      type,
      triggered_at: new Date().toISOString(),
      status: 'completed'
    });

    console.log(`Pipeline triggered: ${type}`);

    return res.status(200).json({
      success: true,
      message: 'Pipeline triggered successfully',
      type,
      triggered_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering pipeline:', error);
    return res.status(500).json({ error: 'Failed to trigger pipeline' });
  }
}
