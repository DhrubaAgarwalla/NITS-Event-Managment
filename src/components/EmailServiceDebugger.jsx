import React, { useState } from 'react';
import emailService from '../services/emailService';

/**
 * Email Service Debugger Component
 * Temporary component to test email service in deployed environment
 * Add this to any page to test email functionality
 */
const EmailServiceDebugger = () => {
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const testEmailService = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      console.log('🔍 Starting email service test...');
      
      // Test data
      const testData = {
        participantEmail: 'test@example.com',
        participantName: 'Test User',
        eventTitle: 'Debug Test Event',
        eventDate: new Date().toISOString(),
        eventLocation: 'Test Location',
        qrCodeImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        registrationId: 'debug-test-123',
        eventId: 'debug-event'
      };

      console.log('🔍 Test data prepared:', testData);

      const result = await emailService.sendQRCodeEmail(testData);
      
      console.log('🔍 Email service result:', result);
      
      setTestResult({
        success: result.success,
        message: result.success ? 'Email sent successfully!' : result.error,
        details: result.details || result,
        timestamp: new Date().toLocaleString()
      });

    } catch (error) {
      console.error('🔍 Email service test error:', error);
      setTestResult({
        success: false,
        message: error.message,
        details: {
          error: error.toString(),
          stack: error.stack
        },
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testBackendConnection = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const backendUrl = import.meta.env.VITE_SHEETS_BACKEND_URL || 'http://localhost:3001';
      console.log('🔍 Testing backend connection to:', backendUrl);

      const response = await fetch(`${backendUrl}/api/v1/health`);
      const data = await response.json();

      setTestResult({
        success: response.ok,
        message: response.ok ? 'Backend connection successful!' : 'Backend connection failed',
        details: {
          status: response.status,
          data: data,
          backendUrl: backendUrl
        },
        timestamp: new Date().toLocaleString()
      });

    } catch (error) {
      console.error('🔍 Backend connection test error:', error);
      setTestResult({
        success: false,
        message: 'Backend connection failed',
        details: {
          error: error.toString(),
          backendUrl: import.meta.env.VITE_SHEETS_BACKEND_URL
        },
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: '#fff',
      border: '2px solid #007bff',
      borderRadius: '8px',
      padding: '20px',
      maxWidth: '400px',
      zIndex: 9999,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#007bff' }}>
        📧 Email Service Debugger
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={testBackendConnection}
          disabled={isLoading}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            marginRight: '10px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '⏳' : '🔗'} Test Backend
        </button>
        
        <button
          onClick={testEmailService}
          disabled={isLoading}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '⏳ Testing...' : '📧 Test Email'}
        </button>
      </div>

      {testResult && (
        <div style={{
          background: testResult.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${testResult.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          padding: '10px',
          marginTop: '10px'
        }}>
          <div style={{
            fontWeight: 'bold',
            color: testResult.success ? '#155724' : '#721c24',
            marginBottom: '5px'
          }}>
            {testResult.success ? '✅' : '❌'} {testResult.message}
          </div>
          
          <div style={{ fontSize: '12px', color: '#666' }}>
            {testResult.timestamp}
          </div>
          
          {testResult.details && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontSize: '12px' }}>
                View Details
              </summary>
              <pre style={{
                background: '#f8f9fa',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '10px',
                overflow: 'auto',
                maxHeight: '200px',
                marginTop: '5px'
              }}>
                {JSON.stringify(testResult.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      <div style={{
        fontSize: '11px',
        color: '#666',
        marginTop: '10px',
        borderTop: '1px solid #eee',
        paddingTop: '10px'
      }}>
        💡 Check browser console for detailed logs
      </div>
    </div>
  );
};

export default EmailServiceDebugger;
