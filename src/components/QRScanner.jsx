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
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [focusSupported, setFocusSupported] = useState(false);
  const [isAutoFocusing, setIsAutoFocusing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const cooldownIntervalRef = useRef(null);
  const focusTimeoutRef = useRef(null);

  // Enhanced camera constraints for better focus and quality
  const getCameraConstraints = () => {
    return {
      video: {
        facingMode: 'environment', // Use back camera on mobile
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        frameRate: { ideal: 30, min: 15 },
        focusMode: 'continuous',
        // Advanced constraints for better image quality
        aspectRatio: { ideal: 16/9 },
        resizeMode: 'crop-and-scale',
        // Focus and exposure settings
        exposureMode: 'continuous',
        whiteBalanceMode: 'continuous',
        // Image quality improvements
        brightness: { ideal: 0 },
        contrast: { ideal: 1 },
        saturation: { ideal: 1 },
        sharpness: { ideal: 1 }
      }
    };
  };

  // Check camera capabilities and focus support
  const checkCameraCapabilities = async (stream) => {
    try {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();

      console.log('Camera capabilities:', capabilities);

      // Check if focus is supported
      const supportsFocus = capabilities.focusMode && capabilities.focusMode.length > 0;
      setFocusSupported(supportsFocus);

      // Apply optimal settings if supported
      const constraints = {};

      if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
        constraints.focusMode = 'continuous';
      }

      if (capabilities.exposureMode && capabilities.exposureMode.includes('continuous')) {
        constraints.exposureMode = 'continuous';
      }

      if (capabilities.whiteBalanceMode && capabilities.whiteBalanceMode.includes('continuous')) {
        constraints.whiteBalanceMode = 'continuous';
      }

      // Apply constraints if any are available
      if (Object.keys(constraints).length > 0) {
        await track.applyConstraints(constraints);
        console.log('Applied camera constraints:', constraints);
      }

      return supportsFocus;
    } catch (err) {
      console.warn('Could not check camera capabilities:', err);
      return false;
    }
  };

  // Auto-focus function
  const performAutoFocus = async () => {
    if (!cameraStream || isAutoFocusing) return;

    try {
      setIsAutoFocusing(true);
      const track = cameraStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();

      if (capabilities.focusMode && capabilities.focusMode.includes('single-shot')) {
        await track.applyConstraints({
          focusMode: 'single-shot'
        });

        // Wait a moment then switch back to continuous
        setTimeout(async () => {
          try {
            if (capabilities.focusMode.includes('continuous')) {
              await track.applyConstraints({
                focusMode: 'continuous'
              });
            }
          } catch (err) {
            console.warn('Could not switch back to continuous focus:', err);
          }
          setIsAutoFocusing(false);
        }, 1000);
      } else {
        setIsAutoFocusing(false);
      }
    } catch (err) {
      console.warn('Auto-focus failed:', err);
      setIsAutoFocusing(false);
    }
  };

  // Tap-to-focus functionality
  const handleTapToFocus = async (event) => {
    if (!cameraStream || !focusSupported) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width * 100).toFixed(2);
    const y = ((event.clientY - rect.top) / rect.height * 100).toFixed(2);

    try {
      const track = cameraStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();

      if (capabilities.focusMode && capabilities.focusMode.includes('manual')) {
        await track.applyConstraints({
          focusMode: 'manual',
          pointsOfInterest: [{ x: x / 100, y: y / 100 }]
        });

        // Show focus indicator
        showFocusIndicator(event.clientX - rect.left, event.clientY - rect.top);

        // Switch back to continuous after a moment
        setTimeout(async () => {
          try {
            if (capabilities.focusMode.includes('continuous')) {
              await track.applyConstraints({
                focusMode: 'continuous'
              });
            }
          } catch (err) {
            console.warn('Could not switch back to continuous focus:', err);
          }
        }, 2000);
      }
    } catch (err) {
      console.warn('Tap-to-focus failed:', err);
    }
  };

  // Show focus indicator at tap location
  const showFocusIndicator = (x, y) => {
    const indicator = document.createElement('div');
    indicator.className = 'focus-indicator';
    indicator.style.cssText = `
      position: absolute;
      left: ${x - 25}px;
      top: ${y - 25}px;
      width: 50px;
      height: 50px;
      border: 2px solid #00ff88;
      border-radius: 50%;
      pointer-events: none;
      z-index: 1001;
      animation: focusPulse 1s ease-out;
    `;

    const container = document.querySelector('.camera-container');
    if (container) {
      container.appendChild(indicator);
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 1000);
    }
  };

  // Start camera and scanning
  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Request camera access with enhanced constraints
      const constraints = getCameraConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      setCameraStream(stream);

      // Check camera capabilities and apply optimal settings
      await checkCameraCapabilities(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Start scanning after video loads
        videoRef.current.onloadedmetadata = () => {
          startQRDetection();

          // Perform initial auto-focus after a short delay
          setTimeout(() => {
            performAutoFocus();
          }, 1000);

          // Set up periodic auto-focus
          focusTimeoutRef.current = setInterval(() => {
            performAutoFocus();
          }, 5000); // Auto-focus every 5 seconds
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

    if (focusTimeoutRef.current) {
      clearInterval(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }

    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Reset focus states
    setFocusSupported(false);
    setIsAutoFocusing(false);
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

  // Start cooldown timer
  const startCooldown = () => {
    setCooldownActive(true);
    setCooldownTime(2);

    cooldownIntervalRef.current = setInterval(() => {
      setCooldownTime(prev => {
        if (prev <= 1) {
          setCooldownActive(false);
          clearInterval(cooldownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Process scanned QR code
  const processQRCode = async (qrData) => {
    if (isProcessing || cooldownActive) return;

    setIsProcessing(true);
    setError(null);

    try {
      console.log('Processing QR code:', qrData);
      console.log('Expected event ID:', eventId);

      // Mark attendance using the registration service with event ID validation
      const result = await registrationService.markAttendanceByQR(qrData, eventId);

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

        // Start cooldown timer for successful scans
        startCooldown();

        // Stop scanning after successful scan
        stopScanning();
      } else {
        setError(result.error || 'Failed to mark attendance');

        // Handle different error types
        if (result.alreadyAttended) {
          setScanResult({
            success: false,
            message: result.error,
            alreadyAttended: true
          });
        } else if (result.eventMismatch) {
          setScanResult({
            success: false,
            message: result.error,
            eventMismatch: true
          });
        } else if (result.dataInconsistency) {
          setScanResult({
            success: false,
            message: result.error,
            dataInconsistency: true
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
    if (!eventId) {
      setError('Event ID is required for QR code validation');
      return;
    }

    const qrData = prompt('Enter QR code data for testing:');
    if (qrData) {
      processQRCode(qrData);
    }
  };

  // Prevent body scrolling when QR scanner is open
  useEffect(() => {
    // Store original body styles
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;

    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.classList.add('qr-scanner-open');

    // Cleanup function to restore scrolling
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.body.classList.remove('qr-scanner-open');
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      if (focusTimeoutRef.current) {
        clearInterval(focusTimeoutRef.current);
        focusTimeoutRef.current = null;
      }
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
                Manual Input
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
                  onClick={handleTapToFocus}
                  style={{ cursor: focusSupported ? 'crosshair' : 'default' }}
                />
                <canvas
                  ref={canvasRef}
                  className="camera-canvas"
                  style={{ display: 'none' }}
                />
                <div className="scan-overlay">
                  <div className="scan-frame"></div>
                  <p>Position QR code within the frame</p>
                  {focusSupported && (
                    <p className="tap-to-focus-hint">
                      📍 Tap to focus
                    </p>
                  )}
                  {isAutoFocusing && (
                    <div className="auto-focus-indicator">
                      <div className="focus-ring"></div>
                      <p>🔍 Auto-focusing...</p>
                    </div>
                  )}
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

              {cooldownActive && (
                <div className="cooldown-indicator">
                  <div className="cooldown-timer">{cooldownTime}</div>
                  <p>Cooldown active... Please wait {cooldownTime}s</p>
                </div>
              )}
            </div>
          )}

          {scanResult && (
            <div className={`scan-result ${scanResult.success ? 'success' : 'error'}`}>
              <div className="result-icon">
                {scanResult.success ? '✅' :
                 scanResult.eventMismatch ? '🚫' :
                 scanResult.alreadyAttended ? '⚠️' :
                 scanResult.dataInconsistency ? '🔧' : '❌'}
              </div>
              <h3>
                {scanResult.success ? 'Attendance Marked!' :
                 scanResult.eventMismatch ? 'Wrong Event QR Code' :
                 scanResult.alreadyAttended ? 'Already Attended' :
                 scanResult.dataInconsistency ? 'Data Error' : 'Scan Failed'}
              </h3>
              <p>{scanResult.message}</p>

              {scanResult.success && (
                <div className="success-details">
                  <p><strong>Participant:</strong> {scanResult.participantName}</p>
                  <p><strong>Event:</strong> {scanResult.eventTitle}</p>
                  <p><strong>Time:</strong> {new Date(scanResult.timestamp).toLocaleString()}</p>
                </div>
              )}

              {scanResult.eventMismatch && (
                <div className="error-details">
                  <p><strong>⚠️ Security Notice:</strong></p>
                  <p>This QR code belongs to a different event. Each event has unique QR codes for security purposes.</p>
                  <p><strong>Solution:</strong> Please use the QR code that was sent for this specific event.</p>
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

          {error && !scanResult && (
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
          overflow: hidden;
          touch-action: none;
          -webkit-overflow-scrolling: touch;
        }

        .qr-scanner-modal {
          background: var(--dark-surface, #111111);
          border-radius: 16px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(110, 68, 255, 0.3);
        }

        .qr-scanner-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid rgba(110, 68, 255, 0.2);
          background: linear-gradient(135deg, var(--primary, #6e44ff), var(--secondary, #ff44e3));
          color: white;
          border-radius: 16px 16px 0 0;
          position: relative;
          overflow: hidden;
        }

        .qr-scanner-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
          animation: shimmer 3s infinite;
        }

        .qr-scanner-header h2 {
          margin: 0;
          color: white;
          font-size: 18px;
          font-weight: 600;
          position: relative;
          z-index: 1;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .close-button {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 20px;
          cursor: pointer;
          color: white;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.3s ease;
          position: relative;
          z-index: 2;
          backdrop-filter: blur(10px);
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
        }

        .qr-scanner-content {
          padding: 25px;
          background: var(--dark-bg, #050505);
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
        }

        .scanner-start {
          text-align: center;
          padding: 50px 20px;
          background: linear-gradient(135deg, rgba(110, 68, 255, 0.1), rgba(255, 68, 227, 0.1));
          border-radius: 12px;
          border: 1px solid rgba(110, 68, 255, 0.2);
          margin-bottom: 20px;
        }

        .scanner-start p {
          color: var(--text-secondary, rgba(255, 255, 255, 0.7));
          font-size: 16px;
          margin-bottom: 30px;
          line-height: 1.5;
        }

        .scanner-icon {
          font-size: 80px;
          margin-bottom: 25px;
          color: var(--accent, #44ffd2);
          text-shadow:
            0 0 20px rgba(68, 255, 210, 0.8),
            0 0 40px rgba(68, 255, 210, 0.6),
            0 4px 8px rgba(0, 0, 0, 0.3);
          animation: float 3s ease-in-out infinite;
          display: block;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .start-scan-button, .manual-input-button, .stop-scan-button,
        .scan-another-button, .retry-button {
          background: linear-gradient(135deg, var(--primary, #6e44ff), var(--accent, #44ffd2));
          color: #000;
          border: none;
          padding: 14px 28px;
          border-radius: 25px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          margin: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(110, 68, 255, 0.3);
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .start-scan-button:hover, .scan-another-button:hover, .retry-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(110, 68, 255, 0.4);
        }

        .start-scan-button::before, .scan-another-button::before, .retry-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s;
        }

        .start-scan-button:hover::before, .scan-another-button:hover::before, .retry-button:hover::before {
          left: 100%;
        }

        .manual-input-button {
          background: linear-gradient(135deg, var(--secondary, #ff44e3), #ff6b9d);
          color: white;
          box-shadow: 0 4px 15px rgba(255, 68, 227, 0.3);
        }

        .manual-input-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 68, 227, 0.4);
        }

        .manual-input-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .manual-input-button:hover::before {
          left: 100%;
        }

        .stop-scan-button {
          background: linear-gradient(135deg, #ff4757, #ff6b7a);
          color: white;
          box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3);
        }

        .stop-scan-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 71, 87, 0.4);
        }

        .stop-scan-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .stop-scan-button:hover::before {
          left: 100%;
        }

        .camera-container {
          position: relative;
          background: linear-gradient(135deg, #000, #1a1a1a);
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 25px;
          border: 2px solid rgba(110, 68, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
        }

        .camera-video {
          width: 100%;
          height: 300px;
          object-fit: cover;
          border-radius: 14px;
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
          color: var(--accent, #44ffd2);
          text-shadow: 0 0 8px rgba(68, 255, 210, 0.8);
          font-weight: 600;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(2px);
        }

        .scan-frame {
          width: 220px;
          height: 220px;
          border: 3px solid var(--accent, #44ffd2);
          border-radius: 20px;
          margin-bottom: 25px;
          animation: neonPulse 2s ease-in-out infinite;
          box-shadow:
            0 0 20px rgba(68, 255, 210, 0.5),
            inset 0 0 20px rgba(68, 255, 210, 0.1);
          position: relative;
        }

        .scan-frame::before {
          content: '';
          position: absolute;
          top: -3px;
          left: -3px;
          right: -3px;
          bottom: -3px;
          border: 1px solid rgba(68, 255, 210, 0.3);
          border-radius: 20px;
          animation: neonPulse 2s ease-in-out infinite reverse;
        }

        @keyframes neonPulse {
          0%, 100% {
            opacity: 1;
            box-shadow:
              0 0 20px rgba(68, 255, 210, 0.5),
              inset 0 0 20px rgba(68, 255, 210, 0.1);
          }
          50% {
            opacity: 0.7;
            box-shadow:
              0 0 40px rgba(68, 255, 210, 0.8),
              inset 0 0 30px rgba(68, 255, 210, 0.2);
          }
        }

        .scanner-controls {
          text-align: center;
        }

        .processing-indicator {
          text-align: center;
          padding: 25px;
          background: linear-gradient(135deg, rgba(110, 68, 255, 0.1), rgba(255, 68, 227, 0.1));
          border-radius: 12px;
          border: 1px solid rgba(110, 68, 255, 0.2);
        }

        .processing-indicator p {
          color: var(--text-secondary, rgba(255, 255, 255, 0.7));
          margin-top: 15px;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(110, 68, 255, 0.2);
          border-top: 4px solid var(--primary, #6e44ff);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
          box-shadow: 0 0 20px rgba(110, 68, 255, 0.3);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .cooldown-indicator {
          text-align: center;
          padding: 25px;
          background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1));
          border: 1px solid rgba(255, 193, 7, 0.3);
          border-radius: 12px;
          margin-top: 20px;
          box-shadow: 0 4px 15px rgba(255, 193, 7, 0.2);
        }

        .cooldown-indicator p {
          color: var(--text-secondary, rgba(255, 255, 255, 0.7));
          margin-top: 15px;
        }

        .cooldown-timer {
          width: 60px;
          height: 60px;
          border: 3px solid #ffc107;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: bold;
          color: #ffc107;
          margin: 0 auto 15px;
          animation: countdown 1s ease-in-out infinite;
          box-shadow:
            0 0 20px rgba(255, 193, 7, 0.4),
            inset 0 0 10px rgba(255, 193, 7, 0.1);
          text-shadow: 0 0 8px rgba(255, 193, 7, 0.8);
        }

        @keyframes countdown {
          0%, 100% {
            transform: scale(1);
            box-shadow:
              0 0 20px rgba(255, 193, 7, 0.4),
              inset 0 0 10px rgba(255, 193, 7, 0.1);
          }
          50% {
            transform: scale(1.1);
            box-shadow:
              0 0 30px rgba(255, 193, 7, 0.6),
              inset 0 0 15px rgba(255, 193, 7, 0.2);
          }
        }

        .scan-result {
          text-align: center;
          padding: 35px;
          border-radius: 16px;
          margin: 20px 0;
        }

        .scan-result.success {
          background: linear-gradient(135deg, rgba(68, 255, 210, 0.1), rgba(40, 167, 69, 0.1));
          border: 1px solid var(--accent, #44ffd2);
          box-shadow: 0 8px 25px rgba(68, 255, 210, 0.2);
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
        }

        .scan-result.error {
          background: linear-gradient(135deg, rgba(255, 71, 87, 0.1), rgba(220, 53, 69, 0.1));
          border: 1px solid #ff4757;
          box-shadow: 0 8px 25px rgba(255, 71, 87, 0.2);
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
        }

        .result-icon {
          font-size: 64px;
          margin-bottom: 20px;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        }

        .scan-result.success .result-icon {
          color: var(--accent, #44ffd2);
          text-shadow: 0 0 20px rgba(68, 255, 210, 0.8);
        }

        .scan-result.error .result-icon {
          color: #ff4757;
          text-shadow: 0 0 20px rgba(255, 71, 87, 0.8);
        }

        .success-details {
          background: rgba(68, 255, 210, 0.1);
          padding: 20px;
          border-radius: 12px;
          margin: 20px 0;
          text-align: left;
          border: 1px solid rgba(68, 255, 210, 0.2);
          backdrop-filter: blur(10px);
        }

        .success-details p {
          margin: 8px 0;
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
        }

        .success-details strong {
          color: var(--accent, #44ffd2);
        }

        .error-details {
          background: rgba(255, 71, 87, 0.1);
          padding: 20px;
          border-radius: 12px;
          margin: 20px 0;
          text-align: left;
          border: 1px solid rgba(255, 71, 87, 0.2);
          backdrop-filter: blur(10px);
        }

        .error-details p {
          margin: 8px 0;
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
          line-height: 1.5;
        }

        .error-details strong {
          color: #ff4757;
        }

        .result-actions {
          margin-top: 20px;
        }

        .error-message {
          text-align: center;
          padding: 25px;
          background: linear-gradient(135deg, rgba(255, 71, 87, 0.1), rgba(220, 53, 69, 0.1));
          border: 1px solid #ff4757;
          border-radius: 12px;
          color: var(--text-primary, rgba(255, 255, 255, 0.87));
          box-shadow: 0 8px 25px rgba(255, 71, 87, 0.2);
        }

        .error-icon {
          font-size: 48px;
          margin-bottom: 15px;
          color: #ff4757;
          text-shadow: 0 0 20px rgba(255, 71, 87, 0.8);
        }

        @media (max-width: 768px) {
          .qr-scanner-container {
            padding: 8px;
            align-items: flex-start;
            padding-top: 2rem;
          }

          .qr-scanner-modal {
            max-height: calc(100vh - 4rem);
            border-radius: 12px;
            width: 100%;
            max-width: 100%;
          }

          .qr-scanner-header {
            padding: 15px;
            border-radius: 12px 12px 0 0;
          }

          .qr-scanner-header h2 {
            font-size: 16px;
          }

          .qr-scanner-content {
            padding: 15px;
          }

          .scanner-start {
            padding: 30px 15px;
          }

          .camera-video {
            height: 250px;
          }

          .scan-frame {
            width: 180px;
            height: 180px;
          }

          .scanner-icon {
            font-size: 60px;
          }

          .start-scan-button, .manual-input-button, .stop-scan-button,
          .scan-another-button, .retry-button {
            padding: 12px 20px;
            font-size: 14px;
            margin: 6px;
            width: auto;
            min-width: 120px;
          }

          .result-icon {
            font-size: 48px;
          }

          .cooldown-timer {
            width: 50px;
            height: 50px;
            font-size: 24px;
          }

          .success-details {
            padding: 15px;
            font-size: 14px;
          }

          .scan-result {
            padding: 25px 15px;
          }

          .scanner-controls {
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: center;
          }

          .result-actions {
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: center;
          }
        }

        /* Focus-related styles */
        .tap-to-focus-hint {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.7);
          color: var(--accent, #44ffd2);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid rgba(68, 255, 210, 0.3);
          backdrop-filter: blur(10px);
          text-shadow: 0 0 8px rgba(68, 255, 210, 0.8);
          animation: fadeInOut 3s ease-in-out infinite;
        }

        .auto-focus-indicator {
          position: absolute;
          top: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.7);
          color: var(--accent, #44ffd2);
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid rgba(68, 255, 210, 0.3);
          backdrop-filter: blur(10px);
          text-shadow: 0 0 8px rgba(68, 255, 210, 0.8);
        }

        .focus-ring {
          width: 20px;
          height: 20px;
          border: 2px solid var(--accent, #44ffd2);
          border-radius: 50%;
          border-top: 2px solid transparent;
          animation: spin 1s linear infinite;
          box-shadow: 0 0 10px rgba(68, 255, 210, 0.5);
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes focusPulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }

        /* Focus indicator for tap-to-focus */
        .focus-indicator {
          animation: focusPulse 1s ease-out !important;
        }

        /* Enhanced camera video styles */
        .camera-video {
          width: 100%;
          height: 300px;
          object-fit: cover;
          border-radius: 14px;
          transition: filter 0.3s ease;
        }

        .camera-video:active {
          filter: brightness(1.1);
        }

        @media (max-width: 480px) {
          .qr-scanner-container {
            padding: 4px;
            padding-top: 1rem;
          }

          .qr-scanner-modal {
            max-height: calc(100vh - 2rem);
            border-radius: 8px;
          }

          .qr-scanner-header {
            padding: 12px;
          }

          .qr-scanner-header h2 {
            font-size: 14px;
          }

          .qr-scanner-content {
            padding: 12px;
          }

          .scanner-start {
            padding: 20px 10px;
          }

          .camera-video {
            height: 200px;
          }

          .scan-frame {
            width: 150px;
            height: 150px;
          }

          .scanner-icon {
            font-size: 50px;
          }

          .start-scan-button, .manual-input-button, .stop-scan-button,
          .scan-another-button, .retry-button {
            padding: 10px 16px;
            font-size: 13px;
            margin: 4px;
            width: 100%;
            max-width: 200px;
          }

          .success-details {
            padding: 12px;
            font-size: 13px;
          }

          .scan-result {
            padding: 20px 12px;
          }

          .scan-result h3 {
            font-size: 16px;
          }

          .close-button {
            width: 28px;
            height: 28px;
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
