import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';

import logger from '../utils/logger';
const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  // Check connection status
  const checkConnection = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      // Try to fetch a small amount of data to test connection
      const { error } = await supabase
        .from('categories')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      // If no error, we're connected
      setIsConnected(!error);
      setLastChecked(new Date());
    } catch (err) {
      logger.error('Connection check failed:', err);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Check connection on mount and periodically
  useEffect(() => {
    // Initial check
    checkConnection();
    
    // Set up periodic checks
    const interval = setInterval(() => {
      checkConnection();
    }, 30000); // Check every 30 seconds
    
    // Listen for online/offline events
    const handleOnline = () => {
      checkConnection();
    };
    
    const handleOffline = () => {
      setIsConnected(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Clean up
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Format last checked time
  const getLastCheckedText = () => {
    if (!lastChecked) return '';
    
    const seconds = Math.floor((new Date() - lastChecked) / 1000);
    
    if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ago`;
    } else {
      return `${Math.floor(seconds / 3600)}h ago`;
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: isConnected ? 'rgba(0, 200, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
        borderLeft: `4px solid ${isConnected ? '#00cc00' : '#ff0033'}`,
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '0.8rem',
        color: isConnected ? '#00cc00' : '#ff0033',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s ease'
      }}
      onClick={checkConnection}
      title="Click to check connection"
    >
      <div 
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: isConnected ? '#00cc00' : '#ff0033',
          boxShadow: `0 0 5px ${isConnected ? '#00cc00' : '#ff0033'}`
        }}
      />
      <div>
        {isConnected ? 'Connected' : 'Disconnected'}
        {lastChecked && (
          <span style={{ marginLeft: '5px', fontSize: '0.7rem', opacity: 0.8 }}>
            • {getLastCheckedText()}
          </span>
        )}
      </div>
      {isChecking && (
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderTopColor: isConnected ? '#00cc00' : '#ff0033',
            animation: 'spin 1s linear infinite',
            marginLeft: '5px'
          }}
        />
      )}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ConnectionStatus;
