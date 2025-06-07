// Consolidated Automation API endpoints
import { ref, get, set, push } from 'firebase/database';
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
      case 'trigger':
        return await triggerAutomation(req, res);
      case 'status':
        return await getAutomationStatus(req, res);
      case 'logs':
        return await getAutomationLogs(req, res);
      default:
        return res.status(404).json({ error: 'Action not found' });
    }
  } catch (error) {
    console.error('Automation API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Trigger Automation
async function triggerAutomation(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type = 'manual', event_id } = req.body;

    // Log the automation trigger
    const logsRef = ref(database, 'automation_logs');
    const newLogRef = push(logsRef);
    
    const logEntry = {
      type,
      event_id: event_id || null,
      status: 'started',
      timestamp: new Date().toISOString(),
      triggered_by: 'api'
    };

    await set(newLogRef, logEntry);

    // Update automation status
    const statusRef = ref(database, 'automation_status');
    await set(statusRef, {
      status: 'running',
      last_run: new Date().toISOString(),
      type,
      event_id: event_id || null
    });

    // Simulate automation process
    setTimeout(async () => {
      try {
        // Update log entry as completed
        await set(newLogRef, {
          ...logEntry,
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration: Math.floor(Math.random() * 5000) + 1000 // Random duration
        });

        // Update status
        await set(statusRef, {
          status: 'idle',
          last_run: new Date().toISOString(),
          last_result: 'success',
          type,
          event_id: event_id || null
        });
      } catch (error) {
        console.error('Error completing automation:', error);
      }
    }, 2000);

    console.log(`Automation triggered: ${type}`);

    return res.status(200).json({
      success: true,
      message: 'Automation triggered successfully',
      log_id: newLogRef.key,
      type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering automation:', error);
    return res.status(500).json({ error: 'Failed to trigger automation' });
  }
}

// Get Automation Status
async function getAutomationStatus(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const statusRef = ref(database, 'automation_status');
    const snapshot = await get(statusRef);

    if (!snapshot.exists()) {
      return res.status(200).json({
        status: 'idle',
        message: 'No automation status found',
        last_run: null
      });
    }

    const status = snapshot.val();
    return res.status(200).json(status);
  } catch (error) {
    console.error('Error getting automation status:', error);
    return res.status(500).json({ error: 'Failed to get automation status' });
  }
}

// Get Automation Logs
async function getAutomationLogs(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = 50 } = req.query;
    
    const logsRef = ref(database, 'automation_logs');
    const snapshot = await get(logsRef);

    if (!snapshot.exists()) {
      return res.status(200).json({
        logs: [],
        total: 0
      });
    }

    const logsData = snapshot.val();
    const logs = Object.keys(logsData)
      .map(key => ({
        id: key,
        ...logsData[key]
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));

    return res.status(200).json({
      logs,
      total: logs.length
    });
  } catch (error) {
    console.error('Error getting automation logs:', error);
    return res.status(500).json({ error: 'Failed to get automation logs' });
  }
}
