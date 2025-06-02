import { useState, useEffect, useRef } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

import logger from '../utils/logger';
const ConnectionIndicator = () => {
  const { user, sessionStatus, refreshSession } = useAuth();
  const [isConnected, setIsConnected] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [lastCheckedTime, setLastCheckedTime] = useState(Date.now());
  const [showDetails, setShowDetails] = useState(false);
  const [pingTime, setPingTime] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [connectionHistory, setConnectionHistory] = useState([]);
  // We track auth status through the sessionStatus from useAuth
  const detailsRef = useRef(null);

  // Function to manually check session status
  const checkSessionStatus = async () => {
    if (!user) return;

    try {
      setIsChecking(true);

      // Check if user is authenticated in Firebase
      if (user.uid) {
        logger.log('Session is valid');
        setErrorMessage(null);
        return true;
      } else {
        logger.warn('Session is invalid');
        setErrorMessage('Session is invalid. Try refreshing the session.');
        return false;
      }
    } catch (err) {
      logger.error('Error checking session:', err);
      setErrorMessage('Error checking session status');
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  // Function to check Firebase connection
  const checkConnection = async () => {
    setIsChecking(true);
    setErrorMessage(null);
    const startTime = performance.now();

    // Create a timeout promise that rejects after 8 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Connection check timed out after 8 seconds'));
      }, 8000);
    });

    try {
      // Try to fetch a small amount of data to test the connection with a timeout
      const categoriesRef = ref(database, 'categories');
      await Promise.race([
        get(categoriesRef),
        timeoutPromise
      ]);

      // Calculate ping time
      const endTime = performance.now();
      const pingTimeMs = Math.round(endTime - startTime);
      setPingTime(pingTimeMs);

      // If we got here without an error, we're connected
      setIsConnected(true);

      // Add to connection history (keep last 10 entries)
      const newHistoryEntry = {
        timestamp: new Date(),
        status: true,
        pingTime: pingTimeMs,
        error: null,
        authStatus: user ? sessionStatus : 'no-user'
      };

      setConnectionHistory(prev => {
        const newHistory = [newHistoryEntry, ...prev];
        return newHistory.slice(0, 10); // Keep only last 10 entries
      });

      logger.log(`Firebase connection successful (${pingTimeMs}ms)`);

      // If ping time is high, add a warning
      if (pingTimeMs > 1000) {
        setErrorMessage(`Connection is slow (${pingTimeMs}ms). This may affect application performance.`);
      }
    } catch (err) {
      logger.error('Error checking Firebase connection:', err);
      setIsConnected(false);

      // Handle timeout specifically
      if (err.message && err.message.includes('timed out')) {
        setErrorMessage('Connection timed out. The server may be overloaded or unreachable.');
      } else {
        setErrorMessage(err.message || 'Connection error');
      }

      // Add to connection history
      setConnectionHistory(prev => {
        const newHistory = [{
          timestamp: new Date(),
          status: false,
          pingTime: null,
          error: err.message || 'Connection error',
          authStatus: user ? sessionStatus : 'no-user'
        }, ...prev];
        return newHistory.slice(0, 10); // Keep only last 10 entries
      });
    } finally {
      setIsChecking(false);
      const now = new Date();
      setLastChecked(now);
      setLastCheckedTime(now.getTime());
    }
  };

  // Check connection on component mount and periodically with optimized frequency
  useEffect(() => {
    // Initial check with a small delay to avoid immediate requests on page load
    const initialCheckTimeout = setTimeout(() => {
      checkConnection();
    }, 2000);

    // Set up periodic checks every 30 seconds (reduced frequency)
    const intervalId = setInterval(() => {
      checkConnection();
    }, 30000);

    // Check connection when the network status changes
    const handleOnline = () => {
      logger.log('Network is online, checking connection...');
      setIsConnected(true); // Optimistically set to true
      setTimeout(() => checkConnection(), 1000); // Verify after a short delay
    };

    const handleOffline = () => {
      logger.log('Network is offline');
      setIsConnected(false);
      setErrorMessage('Your device is offline. Please check your internet connection.');
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up interval and event listeners on unmount
    return () => {
      clearTimeout(initialCheckTimeout);
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check connection when session status changes
  useEffect(() => {
    if (user) {
      logger.log('Session status changed to:', sessionStatus);
      // If session status changes, check connection
      if (sessionStatus === 'refreshed' || sessionStatus === 'active') {
        // Short delay to allow session to stabilize
        setTimeout(() => checkConnection(), 500);
      } else if (sessionStatus === 'invalid' || sessionStatus === 'signed-out') {
        // Force a connection check when session becomes invalid
        checkConnection();
      }
    }
  }, [sessionStatus, user]);

  // Handle click outside to close details panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target)) {
        setShowDetails(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Don't show anything while initial check is in progress
  if (isConnected === null && isChecking) {
    return null;
  }

  return (
    <div ref={detailsRef}>
      {/* Main indicator button */}
      <motion.div
        className="connection-indicator"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          padding: '8px 14px',
          borderRadius: '20px',
          backgroundColor: isConnected ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)',
          color: isConnected ? '#2ecc71' : '#e74c3c',
          fontSize: '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 9999,
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${isConnected ? 'rgba(46, 204, 113, 0.5)' : 'rgba(231, 76, 60, 0.5)'}`,
          transform: isChecking ? 'scale(1.05)' : 'scale(1)',
        }}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#2ecc71' : '#e74c3c',
            boxShadow: `0 0 8px ${isConnected ? '#2ecc71' : '#e74c3c'}`,
            animation: isChecking ? 'pulse 1.5s infinite' : 'none',
            position: 'relative',
          }}
        >
          {/* Pulsing effect */}
          {isConnected && (
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                left: '-4px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                border: '1px solid #2ecc71',
                opacity: 0.5,
                animation: 'ripple 2s infinite ease-out',
              }}
            />
          )}
          <style>{`
            @keyframes ripple {
              0% { transform: scale(0.8); opacity: 0.8; }
              100% { transform: scale(1.5); opacity: 0; }
            }
          `}</style>
        </div>
        {isChecking ? (
          <span>Checking...</span>
        ) : (
          <span>
            {isConnected ? 'Connected' : 'Disconnected'}
            {pingTime && isConnected && ` (${pingTime}ms)`}
          </span>
        )}
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.4; }
            50% { opacity: 1; }
            100% { opacity: 0.4; }
          }
        `}</style>
      </motion.div>

      {/* Detailed connection panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              bottom: '50px',
              right: '10px',
              width: '300px',
              backgroundColor: 'rgba(30, 30, 30, 0.95)',
              borderRadius: '10px',
              padding: '15px',
              color: '#fff',
              zIndex: 9998,
              boxShadow: '0 5px 20px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Firebase Connection</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {user && (
                  <>
                    <button
                      onClick={checkSessionStatus}
                      style={{
                        background: 'rgba(155, 89, 182, 0.2)',
                        border: 'none',
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Check Session
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          setIsChecking(true);
                          const result = await refreshSession();
                          if (result.success) {
                            logger.log('Session refreshed manually');
                            setErrorMessage(null);
                          } else {
                            logger.error('Failed to refresh session:', result.error);
                            setErrorMessage('Session refresh failed');
                          }
                        } catch (err) {
                          logger.error('Error refreshing session:', err);
                          setErrorMessage('Session refresh error');
                        } finally {
                          setIsChecking(false);
                          checkConnection();
                        }
                      }}
                      style={{
                        background: 'rgba(52, 152, 219, 0.2)',
                        border: 'none',
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Refresh Session
                    </button>
                  </>
                )}
                <button
                  onClick={() => checkConnection()}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Check Connection
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                <span>Status:</span>
                <span style={{ color: isConnected ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                <span>Last checked:</span>
                <span>{lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}</span>
              </div>

              {pingTime && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                  <span>Response time:</span>
                  <span style={{
                    color: pingTime < 200 ? '#2ecc71' : pingTime < 500 ? '#f39c12' : '#e74c3c'
                  }}>
                    {pingTime}ms
                  </span>
                </div>
              )}

              {/* Show authentication status if user is logged in */}
              {user && (
                <div style={{
                  backgroundColor: 'rgba(52, 152, 219, 0.1)',
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginTop: '10px',
                  marginBottom: '10px',
                  color: '#3498db'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span>Auth Status:</span>
                    <span style={{
                      color:
                        sessionStatus === 'active' || sessionStatus === 'refreshed' ? '#2ecc71' :
                        sessionStatus === 'checking' ? '#f39c12' : '#e74c3c'
                    }}>
                      {sessionStatus === 'active' ? 'Active' :
                       sessionStatus === 'refreshed' ? 'Refreshed' :
                       sessionStatus === 'checking' ? 'Checking...' :
                       sessionStatus === 'invalid' ? 'Invalid' :
                       sessionStatus === 'signed-out' ? 'Signed Out' :
                       sessionStatus === 'error' ? 'Error' : 'Unknown'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Logged in as: {user.email}
                  </div>
                </div>
              )}

              {errorMessage && (
                <div style={{
                  backgroundColor: 'rgba(231, 76, 60, 0.2)',
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginTop: '10px',
                  color: '#e74c3c',
                  wordBreak: 'break-word'
                }}>
                  {errorMessage}
                </div>
              )}
            </div>

            {connectionHistory.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '5px' }}>
                  Connection History
                </h4>
                <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '12px' }}>
                  {connectionHistory.map((entry, index) => (
                    <div key={index} style={{
                      padding: '5px',
                      borderBottom: index < connectionHistory.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <span style={{ color: entry.status ? '#2ecc71' : '#e74c3c', marginRight: '5px' }}>
                          {entry.status ? '✓' : '✗'}
                        </span>
                        <span>{entry.timestamp.toLocaleTimeString()}</span>
                        {entry.authStatus && entry.authStatus !== 'no-user' && (
                          <span style={{
                            fontSize: '10px',
                            backgroundColor:
                              entry.authStatus === 'active' || entry.authStatus === 'refreshed' ? 'rgba(46, 204, 113, 0.2)' :
                              entry.authStatus === 'checking' ? 'rgba(243, 156, 18, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                            color:
                              entry.authStatus === 'active' || entry.authStatus === 'refreshed' ? '#2ecc71' :
                              entry.authStatus === 'checking' ? '#f39c12' : '#e74c3c',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            marginLeft: '5px'
                          }}>
                            {entry.authStatus === 'active' ? 'auth' :
                             entry.authStatus === 'refreshed' ? 'ref' :
                             entry.authStatus === 'checking' ? 'chk' :
                             entry.authStatus === 'invalid' ? 'inv' :
                             entry.authStatus === 'signed-out' ? 'out' :
                             entry.authStatus === 'error' ? 'err' : '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        {entry.pingTime ? `${entry.pingTime}ms` : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: '15px',
              textAlign: 'center'
            }}>
              Click outside to close
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConnectionIndicator;
