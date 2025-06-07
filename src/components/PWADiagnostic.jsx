import React, { useState, useEffect } from 'react';
import pwaService from '../services/pwaService';

/**
 * PWA Diagnostic Component
 * Helps debug PWA installation issues
 */
const PWADiagnostic = () => {
  const [diagnostics, setDiagnostics] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const results = {};

    // Check if running on mobile
    results.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    results.screenWidth = window.innerWidth;

    // Check HTTPS
    results.isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';

    // Check manifest
    try {
      const manifestResponse = await fetch('/manifest.json');
      results.manifestExists = manifestResponse.ok;
      if (manifestResponse.ok) {
        results.manifest = await manifestResponse.json();
      }
    } catch (error) {
      results.manifestExists = false;
      results.manifestError = error.message;
    }

    // Check service worker
    results.serviceWorkerSupported = 'serviceWorker' in navigator;
    if (results.serviceWorkerSupported) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        results.serviceWorkerRegistered = !!registration;
        if (registration) {
          results.serviceWorkerScope = registration.scope;
        }
      } catch (error) {
        results.serviceWorkerRegistered = false;
        results.serviceWorkerError = error.message;
      }
    }

    // Check icons
    const iconChecks = [];
    const iconSizes = ['192x192', '512x512'];
    
    for (const size of iconSizes) {
      try {
        const response = await fetch(`/icons/icon-${size}.svg`);
        iconChecks.push({
          size,
          exists: response.ok,
          url: `/icons/icon-${size}.svg`
        });
      } catch (error) {
        iconChecks.push({
          size,
          exists: false,
          error: error.message
        });
      }
    }
    results.icons = iconChecks;

    // Check PWA criteria
    results.beforeInstallPromptFired = !!pwaService.deferredPrompt;
    results.isInstalled = pwaService.isInstalled;
    results.isStandalone = pwaService.isStandalone;

    // Check browser support
    results.browser = getBrowserInfo();

    setDiagnostics(results);
  };

  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Unknown';
  };

  const forceShowInstallPrompt = () => {
    // Force show the fallback install prompt
    pwaService.installPromptShown = false;
    pwaService.showFallbackInstallPrompt();
  };

  const testServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      alert('Service Worker registered successfully!');
      runDiagnostics();
    } catch (error) {
      alert(`Service Worker registration failed: ${error.message}`);
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          fontSize: '24px',
          cursor: 'pointer',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(255, 68, 68, 0.3)'
        }}
        title="PWA Diagnostics"
      >
        🔧
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '80vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      color: 'white',
      borderRadius: '12px',
      padding: '20px',
      zIndex: 10000,
      overflow: 'auto',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#6e44ff' }}>🔧 PWA Diagnostics</h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px', color: '#ff44e3' }}>Device & Browser</h4>
          <div>📱 Mobile: {diagnostics.isMobile ? '✅ Yes' : '❌ No'}</div>
          <div>📏 Screen Width: {diagnostics.screenWidth}px</div>
          <div>🌐 Browser: {diagnostics.browser}</div>
          <div>🔒 HTTPS: {diagnostics.isHTTPS ? '✅ Yes' : '❌ No'}</div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px', color: '#ff44e3' }}>PWA Status</h4>
          <div>📋 Manifest: {diagnostics.manifestExists ? '✅ Found' : '❌ Missing'}</div>
          <div>⚙️ Service Worker: {diagnostics.serviceWorkerRegistered ? '✅ Registered' : '❌ Not Registered'}</div>
          <div>🎯 Install Prompt: {diagnostics.beforeInstallPromptFired ? '✅ Available' : '❌ Not Available'}</div>
          <div>📱 Installed: {diagnostics.isInstalled ? '✅ Yes' : '❌ No'}</div>
          <div>🖥️ Standalone: {diagnostics.isStandalone ? '✅ Yes' : '❌ No'}</div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px', color: '#ff44e3' }}>Icons</h4>
          {diagnostics.icons?.map((icon, index) => (
            <div key={index}>
              {icon.size}: {icon.exists ? '✅ Found' : '❌ Missing'}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px', color: '#ff44e3' }}>Actions</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={forceShowInstallPrompt}
              style={{
                background: 'linear-gradient(135deg, #6e44ff, #ff44e3)',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🚀 Force Show Install Prompt
            </button>
            
            <button
              onClick={testServiceWorker}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔄 Test Service Worker
            </button>
            
            <button
              onClick={runDiagnostics}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔍 Refresh Diagnostics
            </button>
          </div>
        </div>

        {diagnostics.manifestError && (
          <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255, 68, 68, 0.2)', borderRadius: '8px' }}>
            <strong>Manifest Error:</strong> {diagnostics.manifestError}
          </div>
        )}

        {diagnostics.serviceWorkerError && (
          <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255, 68, 68, 0.2)', borderRadius: '8px' }}>
            <strong>Service Worker Error:</strong> {diagnostics.serviceWorkerError}
          </div>
        )}
      </div>
    </div>
  );
};

export default PWADiagnostic;
