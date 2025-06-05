/**
 * Production-safe logging utility with configurable log levels
 * Shows console logs in development mode OR when admin is logged in
 */

const isDevelopment = import.meta.env.DEV;

// Log levels (higher number = more verbose)
const LOG_LEVELS = {
  ERROR: 0,   // Only errors
  WARN: 1,    // Errors and warnings
  INFO: 2,    // Errors, warnings, and info
  DEBUG: 3    // All logs including debug
};

// Track admin login status for production logging
let isAdminLoggedIn = false;

// Set the current log level (you can change this to reduce verbosity)
// ERROR = minimal logging, DEBUG = maximum logging
let CURRENT_LOG_LEVEL = isDevelopment ? LOG_LEVELS.WARN : LOG_LEVELS.ERROR;

// Helper function to determine if logging should be enabled
const shouldLog = () => isDevelopment || isAdminLoggedIn;

export const logger = {
  log: (...args) => {
    if (shouldLog() && CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) {
      console.log(...args);
    }
  },

  error: (...args) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.ERROR) {
      console.error(...args);
    }
  },

  warn: (...args) => {
    if (shouldLog() && CURRENT_LOG_LEVEL >= LOG_LEVELS.WARN) {
      console.warn(...args);
    }
  },

  info: (...args) => {
    if (shouldLog() && CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) {
      console.info(...args);
    }
  },

  debug: (...args) => {
    if (shouldLog() && CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
      console.debug(...args);
    }
  },

  // Set admin login status to enable/disable logging in production
  setAdminStatus: (isAdmin) => {
    isAdminLoggedIn = isAdmin;
    if (isAdmin && !isDevelopment) {
      console.log('🔧 Admin logging enabled in production mode');
      // Set more verbose logging for admin in production
      CURRENT_LOG_LEVEL = LOG_LEVELS.INFO;
      console.log('🔧 Log level set to INFO for admin debugging');
    } else if (!isAdmin && !isDevelopment) {
      console.log('🔧 Admin logging disabled in production mode');
      // Reset to minimal logging when admin logs out in production
      CURRENT_LOG_LEVEL = LOG_LEVELS.ERROR;
    }
  },

  // Get current admin status
  getAdminStatus: () => isAdminLoggedIn,

  // Utility methods to change log level at runtime
  setLogLevel: (level) => {
    if (shouldLog() && LOG_LEVELS.hasOwnProperty(level)) {
      CURRENT_LOG_LEVEL = LOG_LEVELS[level];
      console.log(`Logger level set to: ${level}`);
    }
  },

  // Silent mode - only show errors
  setSilent: () => {
    if (shouldLog()) {
      CURRENT_LOG_LEVEL = LOG_LEVELS.ERROR;
      console.log('Logger set to silent mode (errors only)');
    }
  },

  // Verbose mode - show all logs
  setVerbose: () => {
    if (shouldLog()) {
      CURRENT_LOG_LEVEL = LOG_LEVELS.DEBUG;
      console.log('Logger set to verbose mode (all logs)');
    }
  }
};

export default logger;
