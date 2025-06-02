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
  const [cameraQuality, setCameraQuality] = useState(null);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isLaptopFrontCamera, setIsLaptopFrontCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const cooldownIntervalRef = useRef(null);

  // Start camera and scanning with optimized settings
  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);
      setScanAttempts(0); // Reset scan counter

      // Get available video devices to choose the best camera
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      // Store available cameras for switching
      setAvailableCameras(videoDevices);
      console.log('Available cameras:', videoDevices.map(d => ({ label: d.label, deviceId: d.deviceId })));

      // Smart camera selection - prefer back camera on mobile, best quality camera on desktop
      let preferredDeviceId = null;
      let selectedCamera = null;

      // Check if we're on mobile or desktop
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        // On mobile, prefer back camera
        const backCamera = videoDevices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        if (backCamera) {
          preferredDeviceId = backCamera.deviceId;
          selectedCamera = backCamera;
        }
      } else {
        // On desktop, prefer external cameras over built-in front cameras
        const externalCamera = videoDevices.find(device =>
          !device.label.toLowerCase().includes('integrated') &&
          !device.label.toLowerCase().includes('built-in') &&
          !device.label.toLowerCase().includes('facetime') &&
          device.label.toLowerCase().includes('usb') ||
          device.label.toLowerCase().includes('external')
        );

        if (externalCamera) {
          preferredDeviceId = externalCamera.deviceId;
          selectedCamera = externalCamera;
          console.log('Using external camera:', externalCamera.label);
        } else {
          // If no external camera, use the first available (usually front camera)
          selectedCamera = videoDevices[0];
          if (selectedCamera) {
            preferredDeviceId = selectedCamera.deviceId;
            console.log('Using built-in camera:', selectedCamera.label);
          }
        }
      }

      // Enhanced camera constraints optimized for laptop front cameras
      const detectedLaptopFrontCamera = !isMobile && selectedCamera &&
        (selectedCamera.label.toLowerCase().includes('integrated') ||
         selectedCamera.label.toLowerCase().includes('built-in') ||
         selectedCamera.label.toLowerCase().includes('facetime') ||
         selectedCamera.label.toLowerCase().includes('front'));

      // Set the laptop front camera state
      setIsLaptopFrontCamera(detectedLaptopFrontCamera);

      const constraints = {
        video: {
          facingMode: preferredDeviceId ? undefined : (isMobile ? 'environment' : 'user'),
          deviceId: preferredDeviceId ? { exact: preferredDeviceId } : undefined,
          width: {
            min: 640,
            ideal: detectedLaptopFrontCamera ? 1280 : 1920, // Lower resolution for front cameras
            max: detectedLaptopFrontCamera ? 1280 : 1920
          },
          height: {
            min: 480,
            ideal: detectedLaptopFrontCamera ? 720 : 1080, // Lower resolution for front cameras
            max: detectedLaptopFrontCamera ? 720 : 1080
          },
          frameRate: {
            min: 15,
            ideal: 30,
            max: detectedLaptopFrontCamera ? 30 : 60 // Limit frame rate for stability
          },
          // Focus optimization for laptop front cameras
          focusMode: detectedLaptopFrontCamera ? 'manual' : 'continuous',
          focusDistance: detectedLaptopFrontCamera ? 0.3 : undefined, // Set focus distance for close-up scanning
          exposureMode: 'manual',
          exposureCompensation: detectedLaptopFrontCamera ? 0.5 : 0, // Increase exposure for better QR visibility
          whiteBalanceMode: 'manual',
          colorTemperature: detectedLaptopFrontCamera ? 5500 : undefined, // Optimize for indoor lighting
          // Additional settings for front camera optimization
          torch: false, // Disable torch for front cameras
          zoom: detectedLaptopFrontCamera ? 1.0 : undefined,
          // Request high resolution and quality
          aspectRatio: { ideal: 16/9 },
          resizeMode: 'crop-and-scale'
        }
      };

      console.log('Camera type detected:', {
        isMobile,
        isLaptopFrontCamera,
        selectedCamera: selectedCamera?.label,
        constraints: constraints.video
      });

      console.log('Requesting camera with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Log actual camera settings and set quality indicator
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      console.log('Camera settings:', settings);

      // Determine camera quality based on resolution
      const resolution = settings.width * settings.height;
      let quality = 'Low';
      if (resolution >= 1920 * 1080) {
        quality = 'High (1080p+)';
      } else if (resolution >= 1280 * 720) {
        quality = 'Medium (720p)';
      } else if (resolution >= 640 * 480) {
        quality = 'Standard (480p)';
      }

      setCameraQuality({
        resolution: `${settings.width}x${settings.height}`,
        frameRate: settings.frameRate,
        quality: quality,
        facingMode: settings.facingMode
      });

      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Set video element properties for better quality
        videoRef.current.setAttribute('playsinline', true);
        videoRef.current.setAttribute('webkit-playsinline', true);
        videoRef.current.muted = true;

        await videoRef.current.play();

        // Start scanning after video loads and is ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded:', {
            videoWidth: videoRef.current.videoWidth,
            videoHeight: videoRef.current.videoHeight
          });

          // Small delay to ensure video is fully ready
          setTimeout(() => {
            startQRDetection();
          }, 500);
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);

      // Fallback to basic constraints if advanced ones fail
      try {
        console.log('Trying fallback camera constraints...');
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        setCameraStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play();
          videoRef.current.onloadedmetadata = () => startQRDetection();
        }
      } catch (fallbackErr) {
        console.error('Fallback camera access failed:', fallbackErr);
        setError('Unable to access camera. Please check permissions and try again.');
        setIsScanning(false);
      }
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

  // Start QR code detection with optimized scanning
  const startQRDetection = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas size to match video with high quality
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    console.log('Starting QR detection with canvas size:', canvas.width, 'x', canvas.height);

    // Use requestAnimationFrame for smoother scanning (60fps when possible)
    const scanFrame = () => {
      if (!isScanning || isProcessing) {
        if (isScanning) {
          requestAnimationFrame(scanFrame);
        }
        return;
      }

      try {
        // Clear canvas and draw video frame with high quality
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Use high-quality image rendering
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data for QR detection
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        // Increment scan attempts counter
        setScanAttempts(prev => prev + 1);

        // Try to detect QR code
        detectQRCode(imageData);
      } catch (err) {
        console.error('Error during QR detection:', err);
      }

      // Continue scanning
      requestAnimationFrame(scanFrame);
    };

    // Start the scanning loop
    requestAnimationFrame(scanFrame);
  };

  // Enhanced QR code detection with multiple attempts and image processing
  const detectQRCode = async (imageData) => {
    try {
      // Multiple detection attempts with different settings for better accuracy
      const detectionAttempts = [
        // Standard detection
        {
          inversionAttempts: "dontInvert",
        },
        // Try with inversion for better contrast
        {
          inversionAttempts: "onlyInvert",
        },
        // Try both inversion attempts
        {
          inversionAttempts: "attemptBoth",
        },
        // Try with different locator settings
        {
          inversionAttempts: "dontInvert",
          locateOptions: {
            tryHarder: true,
            pureBarcode: false
          }
        }
      ];

      // Try each detection method
      for (const options of detectionAttempts) {
        const code = jsQR(imageData.data, imageData.width, imageData.height, options);

        if (code && code.data) {
          console.log('QR Code detected with options:', options);
          console.log('QR Code data:', code.data);
          console.log('QR Code location:', code.location);

          // Process the detected QR code
          await processQRCode(code.data);
          return true; // QR code found and processed
        }
      }

      // If no QR code found with standard methods, try with image preprocessing
      const preprocessedImageData = preprocessImage(imageData);
      if (preprocessedImageData) {
        const code = jsQR(preprocessedImageData.data, preprocessedImageData.width, preprocessedImageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code && code.data) {
          console.log('QR Code detected after preprocessing:', code.data);
          await processQRCode(code.data);
          return true;
        }
      }

      return false; // No QR code found
    } catch (error) {
      console.error('Error detecting QR code:', error);
      return false;
    }
  };

  // Image preprocessing for better QR detection
  const preprocessImage = (imageData) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = imageData.width;
      canvas.height = imageData.height;

      // Put original image data
      ctx.putImageData(imageData, 0, 0);

      // Apply image enhancements
      ctx.filter = 'contrast(150%) brightness(110%) saturate(120%)';
      ctx.drawImage(canvas, 0, 0);

      // Get enhanced image data
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.error('Error preprocessing image:', error);
      return null;
    }
  };

  // Switch to next available camera
  const switchCamera = async () => {
    if (availableCameras.length <= 1) return;

    // Stop current camera
    stopScanning();

    // Switch to next camera
    const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
    setCurrentCameraIndex(nextIndex);

    // Small delay before starting new camera
    setTimeout(() => {
      startScanning();
    }, 500);
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
                />
                <canvas
                  ref={canvasRef}
                  className="camera-canvas"
                  style={{ display: 'none' }}
                />
                <div className="scan-overlay">
                  <div className="scan-frame"></div>
                  <p>Position QR code within the frame</p>

                  {/* Camera Quality Indicator */}
                  {cameraQuality && (
                    <div className="camera-quality-indicator">
                      <div className="quality-badge">
                        📹 {cameraQuality.quality}
                      </div>
                      <div className="quality-details">
                        {cameraQuality.resolution} • {cameraQuality.frameRate}fps
                      </div>
                    </div>
                  )}

                  {/* Scan Attempts Counter */}
                  <div className="scan-counter">
                    🔍 Scans: {scanAttempts}
                  </div>
                </div>
              </div>

              <div className="scanner-controls">
                <button
                  className="stop-scan-button"
                  onClick={stopScanning}
                >
                  Stop Scanning
                </button>

                {/* Camera Switch Button */}
                {availableCameras.length > 1 && (
                  <button
                    className="switch-camera-button"
                    onClick={switchCamera}
                    title={`Switch to ${availableCameras[(currentCameraIndex + 1) % availableCameras.length]?.label || 'next camera'}`}
                  >
                    🔄 Switch Camera
                  </button>
                )}

                <button
                  className="manual-input-button"
                  onClick={handleManualInput}
                >
                  Manual Input
                </button>
              </div>

              {/* Focus Assistance for Laptop Front Cameras */}
              {isLaptopFrontCamera && (
                <div className="focus-assistance">
                  <div className="focus-tips">
                    <h4>📷 Front Camera Focus Tips:</h4>
                    <ul>
                      <li>Hold QR code 8-12 inches from camera</li>
                      <li>Ensure good lighting on the QR code</li>
                      <li>Keep QR code flat and steady</li>
                      <li>Try moving closer/farther if blurry</li>
                      <li>Clean your camera lens if needed</li>
                    </ul>
                  </div>
                </div>
              )}

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
          height: 400px;
          object-fit: cover;
          border-radius: 14px;
          /* Enhanced video quality settings */
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
          image-rendering: pixelated;
          /* Prevent video compression artifacts */
          filter: contrast(110%) brightness(105%);
          /* Smooth video playback */
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
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

        .camera-quality-indicator {
          position: absolute;
          top: 15px;
          left: 15px;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 8px;
          padding: 8px 12px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(110, 68, 255, 0.3);
        }

        .quality-badge {
          color: var(--accent);
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .quality-details {
          color: var(--text-secondary);
          font-size: 10px;
          font-family: monospace;
        }

        .scan-counter {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 8px;
          padding: 8px 12px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(68, 255, 210, 0.3);
          color: var(--accent);
          font-size: 12px;
          font-weight: 600;
          font-family: monospace;
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

        .scanner-controls {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .switch-camera-button {
          padding: 12px 20px;
          background: linear-gradient(135deg, var(--secondary, #ff44e3), var(--primary, #6e44ff));
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(110, 68, 255, 0.3);
        }

        .switch-camera-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(110, 68, 255, 0.4);
        }

        .switch-camera-button:active {
          transform: translateY(0);
        }

        .focus-assistance {
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid rgba(255, 193, 7, 0.3);
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          backdrop-filter: blur(10px);
        }

        .focus-tips h4 {
          color: #ffc107;
          margin: 0 0 15px 0;
          font-size: 16px;
          text-shadow: 0 0 8px rgba(255, 193, 7, 0.5);
        }

        .focus-tips ul {
          margin: 0;
          padding-left: 20px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .focus-tips li {
          margin-bottom: 8px;
          font-size: 14px;
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
          .scan-another-button, .retry-button, .switch-camera-button {
            padding: 12px 20px;
            font-size: 14px;
            margin: 6px;
            width: auto;
            min-width: 120px;
          }

          .focus-assistance {
            padding: 15px;
            margin: 15px 0;
          }

          .focus-tips h4 {
            font-size: 14px;
          }

          .focus-tips li {
            font-size: 13px;
            margin-bottom: 6px;
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
