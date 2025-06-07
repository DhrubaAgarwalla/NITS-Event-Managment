import React, { useState, useEffect } from 'react';
import pwaService from '../services/pwaService';

/**
 * PWA Install Button Component
 * Shows install button when app can be installed
 */
const PWAInstallButton = ({ 
  variant = 'primary', 
  size = 'medium',
  showIcon = true,
  className = '',
  style = {}
}) => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check initial status
    const status = pwaService.getStatus();
    setCanInstall(status.canInstall);
    setIsInstalled(status.isInstalled);

    // Listen for install prompt availability
    const handleBeforeInstallPrompt = () => {
      setCanInstall(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    try {
      await pwaService.installApp();
    } catch (error) {
      console.error('Install failed:', error);
    }
  };

  // Don't show if already installed or can't install
  if (isInstalled || !canInstall) {
    return null;
  }

  const getButtonStyles = () => {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      textDecoration: 'none',
      ...style
    };

    // Size variants
    const sizeStyles = {
      small: {
        padding: '0.5rem 1rem',
        fontSize: '0.875rem'
      },
      medium: {
        padding: '0.75rem 1.5rem',
        fontSize: '1rem'
      },
      large: {
        padding: '1rem 2rem',
        fontSize: '1.125rem'
      }
    };

    // Color variants
    const variantStyles = {
      primary: {
        background: 'linear-gradient(135deg, #6e44ff, #ff44e3)',
        color: 'white',
        boxShadow: '0 4px 15px rgba(110, 68, 255, 0.3)'
      },
      secondary: {
        background: 'rgba(255, 255, 255, 0.1)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)'
      },
      outline: {
        background: 'transparent',
        color: '#6e44ff',
        border: '2px solid #6e44ff'
      },
      minimal: {
        background: 'transparent',
        color: 'rgba(255, 255, 255, 0.8)',
        padding: '0.5rem'
      }
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant]
    };
  };

  const getHoverStyles = () => {
    const hoverStyles = {
      primary: {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(110, 68, 255, 0.4)'
      },
      secondary: {
        background: 'rgba(255, 255, 255, 0.15)',
        transform: 'translateY(-1px)'
      },
      outline: {
        background: '#6e44ff',
        color: 'white',
        transform: 'translateY(-1px)'
      },
      minimal: {
        color: 'white'
      }
    };

    return hoverStyles[variant] || {};
  };

  return (
    <button
      onClick={handleInstall}
      className={`pwa-install-button ${className}`}
      style={getButtonStyles()}
      onMouseEnter={(e) => {
        const hoverStyles = getHoverStyles();
        Object.assign(e.target.style, hoverStyles);
      }}
      onMouseLeave={(e) => {
        const baseStyles = getButtonStyles();
        Object.assign(e.target.style, baseStyles);
      }}
      title="Install NITS Events app for better experience"
    >
      {showIcon && (
        <span style={{ fontSize: '1.2em' }}>📱</span>
      )}
      Install App
    </button>
  );
};

/**
 * PWA Status Indicator Component
 * Shows current PWA status
 */
export const PWAStatusIndicator = () => {
  const [status, setStatus] = useState(pwaService.getStatus());

  useEffect(() => {
    const updateStatus = () => {
      setStatus(pwaService.getStatus());
    };

    // Update status periodically
    const interval = setInterval(updateStatus, 1000);

    // Listen for status changes
    window.addEventListener('appinstalled', updateStatus);
    window.addEventListener('beforeinstallprompt', updateStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('appinstalled', updateStatus);
      window.removeEventListener('beforeinstallprompt', updateStatus);
    };
  }, []);

  if (!status.isInstalled && !status.canInstall) {
    return null;
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      background: status.isInstalled 
        ? 'rgba(68, 255, 68, 0.1)' 
        : 'rgba(110, 68, 255, 0.1)',
      color: status.isInstalled ? '#44ff44' : '#6e44ff',
      fontSize: '0.875rem',
      fontWeight: '500'
    }}>
      <span>
        {status.isInstalled ? '✅' : '📱'}
      </span>
      <span>
        {status.isInstalled 
          ? 'App Installed' 
          : status.canInstall 
            ? 'Can Install' 
            : 'PWA Ready'
        }
      </span>
      {!status.isOnline && (
        <span style={{ color: '#ff4444' }}>🔴</span>
      )}
    </div>
  );
};

/**
 * PWA Install Banner Component
 * Shows a banner at the top encouraging installation
 */
export const PWAInstallBanner = ({ onDismiss }) => {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState(pwaService.getStatus());

  useEffect(() => {
    const updateStatus = () => {
      const newStatus = pwaService.getStatus();
      setStatus(newStatus);
      
      // Show banner if can install and not dismissed
      const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
      setShow(newStatus.canInstall && !newStatus.isInstalled && !dismissed);
    };

    updateStatus();

    window.addEventListener('beforeinstallprompt', updateStatus);
    window.addEventListener('appinstalled', updateStatus);

    return () => {
      window.removeEventListener('beforeinstallprompt', updateStatus);
      window.removeEventListener('appinstalled', updateStatus);
    };
  }, []);

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('pwa-banner-dismissed', 'true');
    if (onDismiss) onDismiss();
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(135deg, #6e44ff, #ff44e3)',
      color: 'white',
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 9999,
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '1.5rem' }}>📱</span>
        <div>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            Install NITS Events
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            Get faster access and offline features
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <PWAInstallButton 
          variant="secondary" 
          size="small" 
          showIcon={false}
        />
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '1.5rem',
            opacity: 0.7,
            padding: '0.25rem'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default PWAInstallButton;
