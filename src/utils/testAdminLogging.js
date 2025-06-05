/**
 * Test utility for Admin Logging functionality
 * Use this to test that console logs are visible when admin is logged in
 */

import logger from './logger';

/**
 * Test admin logging functionality
 */
export const testAdminLogging = () => {
  console.log('🧪 Starting Admin Logging Test...');
  
  // Test 1: Check initial state
  console.log('✅ Test 1: Initial logger state');
  console.log('   Admin status:', logger.getAdminStatus());
  console.log('   Environment:', import.meta.env.DEV ? 'development' : 'production');
  
  // Test 2: Test logging without admin status
  console.log('\n🧪 Test 2: Testing logs without admin status...');
  logger.setAdminStatus(false);
  logger.log('This log should only show in development mode');
  logger.info('This info should only show in development mode');
  logger.warn('This warning should only show in development mode');
  logger.debug('This debug should only show in development mode');
  logger.error('This error should always show');
  
  // Test 3: Test logging with admin status
  console.log('\n🧪 Test 3: Testing logs with admin status...');
  logger.setAdminStatus(true);
  logger.log('This log should show in both development and production when admin is logged in');
  logger.info('This info should show in both development and production when admin is logged in');
  logger.warn('This warning should show in both development and production when admin is logged in');
  logger.debug('This debug should show in both development and production when admin is logged in');
  logger.error('This error should always show');
  
  // Test 4: Test log level changes
  console.log('\n🧪 Test 4: Testing log level changes...');
  logger.setVerbose();
  logger.debug('This debug should now show (verbose mode)');
  
  logger.setSilent();
  logger.log('This log should not show (silent mode)');
  logger.warn('This warning should not show (silent mode)');
  logger.error('This error should still show (silent mode)');
  
  // Test 5: Reset to default
  console.log('\n🧪 Test 5: Resetting to default state...');
  logger.setLogLevel('WARN');
  logger.setAdminStatus(false);
  
  console.log('✅ Admin Logging Test completed!');
  console.log('💡 Check the console output above to verify logging behavior');
  
  return {
    success: true,
    message: 'Admin logging test completed. Check console for results.'
  };
};

/**
 * Simulate admin login/logout cycle
 */
export const simulateAdminLoginCycle = () => {
  console.log('🔄 Simulating Admin Login/Logout Cycle...');
  
  // Simulate login
  console.log('\n👤 Simulating admin login...');
  logger.setAdminStatus(true);
  logger.log('Admin logged in - this should show in production');
  
  // Wait and simulate logout
  setTimeout(() => {
    console.log('\n👋 Simulating admin logout...');
    logger.setAdminStatus(false);
    logger.log('Admin logged out - this should only show in development');
    
    console.log('✅ Admin login/logout cycle completed!');
  }, 2000);
  
  return {
    success: true,
    message: 'Admin login/logout cycle started. Check console for results.'
  };
};

/**
 * Test performance monitoring logs (useful for admin debugging)
 */
export const testPerformanceLogging = () => {
  console.log('⚡ Testing Performance Logging...');
  
  logger.setAdminStatus(true);
  
  // Simulate performance monitoring
  const startTime = performance.now();
  
  // Simulate some work
  setTimeout(() => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    logger.log(`⚡ Performance: Operation completed in ${duration.toFixed(2)}ms`);
    logger.info(`📊 Memory usage: ${(performance.memory?.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    logger.warn(`⚠️ Performance warning: Operation took ${duration.toFixed(2)}ms`);
    
    if (duration > 100) {
      logger.error(`🚨 Performance issue: Operation took ${duration.toFixed(2)}ms (threshold: 100ms)`);
    }
    
    console.log('✅ Performance logging test completed!');
  }, 50);
  
  return {
    success: true,
    message: 'Performance logging test started. Check console for results.'
  };
};

// Export all test functions
export default {
  testAdminLogging,
  simulateAdminLoginCycle,
  testPerformanceLogging
};
