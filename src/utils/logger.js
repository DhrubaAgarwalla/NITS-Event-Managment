/**
 * Production-safe logging utility with configurable log levels
 * Removes console.log statements in production builds
 */

const isDevelopment = import.meta.env.DEV;

// Log levels (higher number = more verbose)
const LOG_LEVELS = {
  ERROR: 0,   // Only errors
  WARN: 1,    // Errors and warnings
  INFO: 2,    // Errors, warnings, and info
  DEBUG: 3    // All logs including debug
};

// Set the current log level (you can change this to reduce verbosity)
// ERROR = minimal logging, DEBUG = maximum logging
let CURRENT_LOG_LEVEL = isDevelopment ? LOG_LEVELS.WARN : LOG_LEVELS.ERROR;

export const logger = {
  log: (...args) => {
    if (isDevelopment && CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) {
      console.log(...args);
    }
  },

  error: (...args) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.ERROR) {
      console.error(...args);
    }
  },

  warn: (...args) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.WARN) {
      console.warn(...args);
    }
  },

  info: (...args) => {
    if (isDevelopment && CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) {
      console.info(...args);
    }
  },

  debug: (...args) => {
    if (isDevelopment && CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
      console.debug(...args);
    }
  },

  // Utility methods to change log level at runtime
  setLogLevel: (level) => {
    if (isDevelopment && LOG_LEVELS.hasOwnProperty(level)) {
      CURRENT_LOG_LEVEL = LOG_LEVELS[level];
      console.log(`Logger level set to: ${level}`);
    }
  },

  // Silent mode - only show errors
  setSilent: () => {
    if (isDevelopment) {
      CURRENT_LOG_LEVEL = LOG_LEVELS.ERROR;
      console.log('Logger set to silent mode (errors only)');
    }
  },

  // Verbose mode - show all logs
  setVerbose: () => {
    if (isDevelopment) {
      CURRENT_LOG_LEVEL = LOG_LEVELS.DEBUG;
      console.log('Logger set to verbose mode (all logs)');
    }
  }
};

export default logger;
