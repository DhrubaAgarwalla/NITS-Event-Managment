import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import registrationService from '../services/registrationService';

/**
 * QR Scanner Component for Attendance Tracking
 * Mobile-friendly interface for scanning QR codes
 */
const QRScanner = ({ eventId, onScanResult, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Start camera and scanning
  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Start scanning after video loads
        videoRef.current.onloadedmetadata = () => {
          startQRDetection();
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  // Stop camera and scanning
  const stopScanning = () => {
    setIsScanning(false);

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start QR code detection
  const startQRDetection = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Scan for QR codes every 500ms
    scanIntervalRef.current = setInterval(() => {
      if (isProcessing) return;

      try {
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        // Try to detect QR code using a simple approach
        // Note: For production, you might want to use a proper QR code library like jsQR
        detectQRCode(imageData);
      } catch (err) {
        console.error('Error during QR detection:', err);
      }
    }, 500);
  };

  // QR code detection using jsQR library
  const detectQRCode = async (imageData) => {
    try {
      // Use jsQR to decode the QR code from image data
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        console.log('QR Code detected:', code.data);

        // Process the detected QR code
        await processQRCode(code.data);

        return true; // QR code found and processed
      }

      return false; // No QR code found
    } catch (error) {
      console.error('Error detecting QR code:', error);
      return false;
    }
  };

  // Process scanned QR code
  const processQRCode = async (qrData) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      console.log('Processing QR code:', qrData);

      // Mark attendance using the registration service
      const result = await registrationService.markAttendanceByQR(qrData);

      if (result.success) {
        setScanResult({
          success: true,
          message: result.message,
          participantName: result.participantName,
          eventTitle: result.eventTitle,
          timestamp: result.timestamp
        });

        // Notify parent component
        if (onScanResult) {
          onScanResult(result);
        }

        // Stop scanning after successful scan
        stopScanning();
      } else {
        setError(result.error || 'Failed to mark attendance');

        if (result.alreadyAttended) {
          setScanResult({
            success: false,
            message: result.error,
            alreadyAttended: true
          });
        }
      }
    } catch (err) {
      console.error('Error processing QR code:', err);
      setError('Failed to process QR code. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Manual QR input for testing/fallback
  const handleManualInput = () => {
    const qrData = prompt('Enter QR code data for testing:');
    if (qrData) {
      processQRCode(qrData);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="qr-scanner-container">
      <div className="qr-scanner-modal">
        <div className="qr-scanner-header">
          <h2>📱 Scan QR Code for Attendance</h2>
          <button
            className="close-button"
            onClick={() => {
              stopScanning();
              if (onClose) onClose();
            }}
          >
            ✕
          </button>
        </div>

        <div className="qr-scanner-content">
          {!isScanning && !scanResult && (
            <div className="scanner-start">
              <div className="scanner-icon">📷</div>
              <p>Ready to scan QR codes for attendance tracking</p>
              <button
                className="start-scan-button"
                onClick={startScanning}
              >
                Start Camera
              </button>
              <button
                className="manual-input-button"
                onClick={handleManualInput}
              >
                Manual Input (Testing)
              </button>
            </div>
          )}

          {isScanning && (
            <div className="scanner-active">
              <div className="camera-container">
                <video
                  ref={videoRef}
                  className="camera-video"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="camera-canvas"
                  style={{ display: 'none' }}
                />
                <div className="scan-overlay">
                  <div className="scan-frame"></div>
                  <p>Position QR code within the frame</p>
                </div>
              </div>

              <div className="scanner-controls">
                <button
                  className="stop-scan-button"
                  onClick={stopScanning}
                >
                  Stop Scanning
                </button>
                <button
                  className="manual-input-button"
                  onClick={handleManualInput}
                >
                  Manual Input
                </button>
              </div>

              {isProcessing && (
                <div className="processing-indicator">
                  <div className="spinner"></div>
                  <p>Processing QR code...</p>
                </div>
              )}
            </div>
          )}

          {scanResult && (
            <div className={`scan-result ${scanResult.success ? 'success' : 'error'}`}>
              <div className="result-icon">
                {scanResult.success ? '✅' : '❌'}
              </div>
              <h3>
                {scanResult.success ? 'Attendance Marked!' : 'Scan Failed'}
              </h3>
              <p>{scanResult.message}</p>

              {scanResult.success && (
                <div className="success-details">
                  <p><strong>Participant:</strong> {scanResult.participantName}</p>
                  <p><strong>Event:</strong> {scanResult.eventTitle}</p>
                  <p><strong>Time:</strong> {new Date(scanResult.timestamp).toLocaleString()}</p>
                </div>
              )}

              <div className="result-actions">
                <button
                  className="scan-another-button"
                  onClick={() => {
                    setScanResult(null);
                    setError(null);
                    startScanning();
                  }}
                >
                  Scan Another
                </button>
                <button
                  className="close-button"
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button
                className="retry-button"
                onClick={() => {
                  setError(null);
                  setScanResult(null);
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .qr-scanner-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .qr-scanner-modal {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .qr-scanner-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .qr-scanner-header h2 {
          margin: 0;
          color: #333;
          font-size: 18px;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qr-scanner-content {
          padding: 20px;
        }

        .scanner-start {
          text-align: center;
          padding: 40px 20px;
        }

        .scanner-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .start-scan-button, .manual-input-button, .stop-scan-button,
        .scan-another-button, .retry-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          margin: 10px;
          transition: background-color 0.2s;
        }

        .start-scan-button:hover, .scan-another-button:hover, .retry-button:hover {
          background: #0056b3;
        }

        .manual-input-button {
          background: #6c757d;
        }

        .manual-input-button:hover {
          background: #545b62;
        }

        .stop-scan-button {
          background: #dc3545;
        }

        .stop-scan-button:hover {
          background: #c82333;
        }

        .camera-container {
          position: relative;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .camera-video {
          width: 100%;
          height: 300px;
          object-fit: cover;
        }

        .scan-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
        }

        .scan-frame {
          width: 200px;
          height: 200px;
          border: 3px solid #00ff00;
          border-radius: 8px;
          margin-bottom: 20px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .scanner-controls {
          text-align: center;
        }

        .processing-indicator {
          text-align: center;
          padding: 20px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .scan-result {
          text-align: center;
          padding: 30px;
        }

        .scan-result.success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 8px;
        }

        .scan-result.error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
        }

        .result-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }

        .success-details {
          background: white;
          padding: 15px;
          border-radius: 6px;
          margin: 15px 0;
          text-align: left;
        }

        .success-details p {
          margin: 5px 0;
        }

        .result-actions {
          margin-top: 20px;
        }

        .error-message {
          text-align: center;
          padding: 20px;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
        }

        .error-icon {
          font-size: 32px;
          margin-bottom: 10px;
        }

        @media (max-width: 600px) {
          .qr-scanner-container {
            padding: 10px;
          }

          .qr-scanner-modal {
            max-height: 95vh;
          }

          .camera-video {
            height: 250px;
          }

          .scan-frame {
            width: 150px;
            height: 150px;
          }
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
