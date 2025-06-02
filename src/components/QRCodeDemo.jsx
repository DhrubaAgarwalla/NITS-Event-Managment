import React, { useState } from 'react';
import qrCodeService from '../services/qrCodeService';

import logger from '../utils/logger';
/**
 * QR Code Demo Component
 * For testing QR code generation and verification
 */
const QRCodeDemo = () => {
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [testData, setTestData] = useState({
    registrationId: 'test-reg-123',
    eventId: 'test-event-456',
    participantEmail: 'test@example.com'
  });

  // Generate test QR code
  const generateTestQR = async () => {
    try {
      const result = await qrCodeService.generateQRCode(
        testData.registrationId,
        testData.eventId,
        testData.participantEmail
      );

      if (result.success) {
        setQrCodeImage(result.qrCodeImageUrl);
        setQrCodeData(result.qrCodeData);
        setVerificationResult(null);
      }
    } catch (error) {
      logger.error('Error generating QR code:', error);
    }
  };

  // Verify QR code
  const verifyQR = async () => {
    if (!qrCodeData) return;

    try {
      const result = await qrCodeService.verifyQRCode(qrCodeData);
      setVerificationResult(result);
    } catch (error) {
      logger.error('Error verifying QR code:', error);
    }
  };

  return (
    <div className="qr-demo-container">
      <div className="qr-demo-header">
        <h2>🔍 QR Code Demo & Testing</h2>
        <p>Generate and verify QR codes for attendance tracking system</p>
      </div>

      {/* Test Data Input */}
      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>Test Data</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          <div>
            <label>Registration ID:</label>
            <input
              type="text"
              value={testData.registrationId}
              onChange={(e) => setTestData({...testData, registrationId: e.target.value})}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          <div>
            <label>Event ID:</label>
            <input
              type="text"
              value={testData.eventId}
              onChange={(e) => setTestData({...testData, eventId: e.target.value})}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          <div>
            <label>Participant Email:</label>
            <input
              type="email"
              value={testData.participantEmail}
              onChange={(e) => setTestData({...testData, participantEmail: e.target.value})}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>

        <button
          onClick={generateTestQR}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '15px'
          }}
        >
          Generate QR Code
        </button>
      </div>

      {/* QR Code Display */}
      {qrCodeImage && (
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ddd',
          textAlign: 'center'
        }}>
          <h3>Generated QR Code</h3>
          <img
            src={qrCodeImage}
            alt="Generated QR Code"
            style={{
              maxWidth: '200px',
              border: '2px solid #007bff',
              borderRadius: '8px',
              padding: '10px',
              background: 'white'
            }}
          />

          <div style={{ marginTop: '15px', textAlign: 'left' }}>
            <h4>QR Code Data:</h4>
            <pre style={{
              background: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>
              {qrCodeData}
            </pre>
          </div>

          <button
            onClick={verifyQR}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '15px'
            }}
          >
            Verify QR Code
          </button>
        </div>
      )}

      {/* Verification Result */}
      {verificationResult && (
        <div style={{
          background: verificationResult.valid ? '#d4edda' : '#f8d7da',
          border: `1px solid ${verificationResult.valid ? '#c3e6cb' : '#f5c6cb'}`,
          color: verificationResult.valid ? '#155724' : '#721c24',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>Verification Result</h3>
          <p><strong>Valid:</strong> {verificationResult.valid ? 'Yes' : 'No'}</p>

          {verificationResult.valid ? (
            <div>
              <p><strong>Registration ID:</strong> {verificationResult.registrationId}</p>
              <p><strong>Event ID:</strong> {verificationResult.eventId}</p>
              <p><strong>Email:</strong> {verificationResult.email}</p>
              <p><strong>Generated:</strong> {new Date(verificationResult.timestamp).toLocaleString()}</p>
            </div>
          ) : (
            <p><strong>Error:</strong> {verificationResult.error}</p>
          )}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        background: '#e3f2fd',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #bbdefb'
      }}>
        <h3>📋 How to Use</h3>
        <ol>
          <li><strong>Generate QR Code:</strong> Enter test data and click "Generate QR Code"</li>
          <li><strong>View QR Code:</strong> The generated QR code image and data will be displayed</li>
          <li><strong>Verify QR Code:</strong> Click "Verify QR Code" to test the verification process</li>
          <li><strong>Test Scanning:</strong> You can use any QR code scanner app to scan the generated code</li>
        </ol>

        <h4>🔒 Security Features</h4>
        <ul>
          <li>Unique hash verification prevents tampering</li>
          <li>Timestamp validation (valid until event date)</li>
          <li>Structured data format with version control</li>
          <li>Event and registration ID validation</li>
        </ul>

        <h4>📱 Integration</h4>
        <p>This QR code system is integrated with:</p>
        <ul>
          <li>Event registration process (automatic generation)</li>
          <li>Email delivery system (sent to participants)</li>
          <li>Mobile scanning interface (QRScanner component)</li>
          <li>Attendance tracking (real-time updates)</li>
          <li>Export functionality (Excel/PDF/Google Sheets)</li>
        </ul>
      </div>

      <style jsx>{`
        .qr-demo-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: var(--dark-bg, #050505);
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
          min-height: 100vh;
        }

        .qr-demo-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .qr-demo-header h2 {
          background: linear-gradient(to right, var(--primary, #6e44ff), var(--secondary, #ff44e3));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin-bottom: 10px;
          font-size: 2.5rem;
          font-weight: 700;
        }

        .qr-demo-header p {
          color: var(--text-secondary, rgba(255, 255, 255, 0.6));
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
};

export default QRCodeDemo;
