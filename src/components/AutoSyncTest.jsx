import React, { useState } from 'react';
import { testAutoSync, testManualSync, checkAutoSyncStatus, disableAutoSync, enableAutoSync } from '../utils/testAutoSync';

/**
 * Auto-Sync Test Component
 * Use this component to test the automatic Google Sheets functionality
 */
const AutoSyncTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [eventId, setEventId] = useState('');

  const addResult = (result) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      ...result
    }]);
  };

  const runFullTest = async () => {
    setIsLoading(true);
    addResult({ type: 'info', message: '🧪 Starting full auto-sync test...' });

    try {
      const result = await testAutoSync();
      
      if (result.success) {
        addResult({ 
          type: 'success', 
          message: `✅ Test completed! Event ID: ${result.eventId}` 
        });
        setEventId(result.eventId);
      } else {
        addResult({ 
          type: 'error', 
          message: `❌ Test failed: ${result.error}` 
        });
      }
    } catch (error) {
      addResult({ 
        type: 'error', 
        message: `❌ Test error: ${error.message}` 
      });
    }

    setIsLoading(false);
  };

  const runManualSync = async () => {
    if (!eventId) {
      addResult({ type: 'warning', message: '⚠️ Please enter an event ID' });
      return;
    }

    setIsLoading(true);
    addResult({ type: 'info', message: `🔄 Testing manual sync for event: ${eventId}` });

    try {
      const result = await testManualSync(eventId);
      
      if (result.success) {
        addResult({ 
          type: 'success', 
          message: '✅ Manual sync test successful' 
        });
      } else {
        addResult({ 
          type: 'warning', 
          message: `⚠️ Manual sync failed: ${result.reason || result.error}` 
        });
      }
    } catch (error) {
      addResult({ 
        type: 'error', 
        message: `❌ Manual sync error: ${error.message}` 
      });
    }

    setIsLoading(false);
  };

  const checkStatus = async () => {
    if (!eventId) {
      addResult({ type: 'warning', message: '⚠️ Please enter an event ID' });
      return;
    }

    setIsLoading(true);
    addResult({ type: 'info', message: `🔍 Checking status for event: ${eventId}` });

    try {
      const result = await checkAutoSyncStatus(eventId);
      
      if (result.success) {
        const status = result.status;
        addResult({ 
          type: 'info', 
          message: `📊 Status: ${status.hasGoogleSheet ? 'Sheet exists' : 'No sheet'}, Auto-sync: ${status.autoSyncEnabled ? 'Enabled' : 'Disabled'}` 
        });
        
        if (status.googleSheetUrl) {
          addResult({ 
            type: 'success', 
            message: `🔗 Sheet URL: ${status.googleSheetUrl}` 
          });
        }
      } else {
        addResult({ 
          type: 'error', 
          message: `❌ Status check failed: ${result.error}` 
        });
      }
    } catch (error) {
      addResult({ 
        type: 'error', 
        message: `❌ Status check error: ${error.message}` 
      });
    }

    setIsLoading(false);
  };

  const toggleAutoSync = async (enable) => {
    if (!eventId) {
      addResult({ type: 'warning', message: '⚠️ Please enter an event ID' });
      return;
    }

    setIsLoading(true);
    const action = enable ? 'Enabling' : 'Disabling';
    addResult({ type: 'info', message: `${action} auto-sync for event: ${eventId}` });

    try {
      const result = enable ? await enableAutoSync(eventId) : await disableAutoSync(eventId);
      
      if (result.success) {
        addResult({ 
          type: 'success', 
          message: `✅ Auto-sync ${enable ? 'enabled' : 'disabled'} successfully` 
        });
      } else {
        addResult({ 
          type: 'error', 
          message: `❌ Failed to ${enable ? 'enable' : 'disable'} auto-sync: ${result.error}` 
        });
      }
    } catch (error) {
      addResult({ 
        type: 'error', 
        message: `❌ Error ${enable ? 'enabling' : 'disabling'} auto-sync: ${error.message}` 
      });
    }

    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🧪 Auto-Sync Test Dashboard</h2>
      <p>Use this dashboard to test the automatic Google Sheets functionality.</p>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Test Controls</h3>
        
        <div style={{ marginBottom: '10px' }}>
          <button 
            onClick={runFullTest} 
            disabled={isLoading}
            style={{ 
              padding: '10px 20px', 
              marginRight: '10px', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? '⏳ Running...' : '🚀 Run Full Test'}
          </button>
          
          <button 
            onClick={clearResults}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#f44336', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🗑️ Clear Results
          </button>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Enter Event ID for manual tests"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            style={{ 
              padding: '8px', 
              marginRight: '10px', 
              width: '300px',
              border: '1px solid #ddd',
              borderRadius: '3px'
            }}
          />
        </div>

        <div>
          <button 
            onClick={runManualSync} 
            disabled={isLoading || !eventId}
            style={{ 
              padding: '8px 16px', 
              marginRight: '10px', 
              backgroundColor: '#2196F3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '3px',
              cursor: (isLoading || !eventId) ? 'not-allowed' : 'pointer'
            }}
          >
            🔄 Manual Sync
          </button>

          <button 
            onClick={checkStatus} 
            disabled={isLoading || !eventId}
            style={{ 
              padding: '8px 16px', 
              marginRight: '10px', 
              backgroundColor: '#FF9800', 
              color: 'white', 
              border: 'none', 
              borderRadius: '3px',
              cursor: (isLoading || !eventId) ? 'not-allowed' : 'pointer'
            }}
          >
            🔍 Check Status
          </button>

          <button 
            onClick={() => toggleAutoSync(false)} 
            disabled={isLoading || !eventId}
            style={{ 
              padding: '8px 16px', 
              marginRight: '10px', 
              backgroundColor: '#9E9E9E', 
              color: 'white', 
              border: 'none', 
              borderRadius: '3px',
              cursor: (isLoading || !eventId) ? 'not-allowed' : 'pointer'
            }}
          >
            🔇 Disable
          </button>

          <button 
            onClick={() => toggleAutoSync(true)} 
            disabled={isLoading || !eventId}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '3px',
              cursor: (isLoading || !eventId) ? 'not-allowed' : 'pointer'
            }}
          >
            🔊 Enable
          </button>
        </div>
      </div>

      <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Test Results</h3>
        <div style={{ 
          height: '400px', 
          overflowY: 'auto', 
          backgroundColor: '#f9f9f9', 
          padding: '10px',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          {testResults.length === 0 ? (
            <p style={{ color: '#666' }}>No test results yet. Run a test to see results here.</p>
          ) : (
            testResults.map(result => (
              <div 
                key={result.id} 
                style={{ 
                  marginBottom: '5px',
                  color: result.type === 'error' ? '#f44336' : 
                         result.type === 'warning' ? '#FF9800' :
                         result.type === 'success' ? '#4CAF50' : '#333'
                }}
              >
                <span style={{ color: '#666' }}>[{result.timestamp}]</span> {result.message}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
        <h4>💡 How to Test:</h4>
        <ol>
          <li><strong>Run Full Test:</strong> Creates a test event and registration, triggers auto-sync</li>
          <li><strong>Manual Sync:</strong> Test manual sync for a specific event ID</li>
          <li><strong>Check Status:</strong> View auto-sync status and Google Sheet info</li>
          <li><strong>Enable/Disable:</strong> Toggle auto-sync for an event</li>
        </ol>
        <p><strong>Note:</strong> Make sure your Google Sheets backend is running and accessible.</p>
      </div>
    </div>
  );
};

export default AutoSyncTest;
