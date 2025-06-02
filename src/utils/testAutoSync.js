/**
 * Test utility for Auto-Sync functionality
 * Use this to test the automatic Google Sheets creation and updates
 */

import autoSyncService from '../services/autoSyncService';
import eventService from '../services/eventService';
import registrationService from '../services/registrationService';
import logger from './logger';
/**
 * Test auto-sync functionality
 */
export const testAutoSync = async () => {
  logger.log('🧪 Starting Auto-Sync Test...');

  try {
    // Test 1: Check if autoSyncService loads correctly
    logger.log('✅ Test 1: AutoSyncService loaded successfully');

    // Test 2: Create a test event (this should auto-create a Google Sheet)
    logger.log('🧪 Test 2: Creating test event...');

    const testEventData = {
      title: 'Auto-Sync Test Event',
      description: 'This is a test event to verify auto-sync functionality',
      start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      end_date: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
      location: 'Test Location',
      participation_type: 'individual',
      status: 'upcoming',
      club_id: 'test-club-id', // You may need to use a real club ID
      category_id: 'test-category-id', // You may need to use a real category ID
      requires_payment: false,
      custom_fields: []
    };

    // Note: This will trigger auto-sheet creation in the background
    const createdEvent = await eventService.createEvent(testEventData);
    logger.log('✅ Test 2: Event created successfully:', createdEvent.id);
    logger.log('   📊 Google Sheet should be auto-creating in the background...');

    // Test 3: Wait a moment and check if sheet info was added to event
    setTimeout(async () => {
      try {
        const updatedEvent = await eventService.getEventById(createdEvent.id);
        if (updatedEvent.google_sheet_id) {
          logger.log('✅ Test 3: Google Sheet auto-created successfully!');
          logger.log('   📊 Sheet ID:', updatedEvent.google_sheet_id);
          logger.log('   🔗 Sheet URL:', updatedEvent.google_sheet_url);
        } else {
          logger.log('⏳ Test 3: Google Sheet creation still in progress...');
          logger.log('   💡 Check the console logs for auto-creation status');
        }
      } catch (error) {
        logger.error('❌ Test 3 failed:', error);
      }
    }, 5000); // Wait 5 seconds

    // Test 4: Create a test registration (this should auto-sync the sheet)
    logger.log('🧪 Test 4: Creating test registration...');

    const testRegistrationData = {
      event_id: createdEvent.id,
      participant_name: 'Test Participant',
      participant_email: 'test@example.com',
      participant_phone: '1234567890',
      participant_student_id: 'TEST123',
      participant_department: 'Computer Science',
      participant_year: '3'
    };

    // Note: This will trigger auto-sync in the background
    const registration = await registrationService.registerForEvent(testRegistrationData);
    logger.log('✅ Test 4: Registration created successfully:', registration.id);
    logger.log('   🔄 Google Sheet should be auto-syncing in the background...');

    // Test 5: Test attendance marking (this should also auto-sync)
    setTimeout(async () => {
      try {
        logger.log('🧪 Test 5: Marking attendance...');

        // Mark attendance
        const attendanceResult = await registrationService.updateAttendanceStatus(
          registration.id,
          'attended'
        );

        logger.log('✅ Test 5: Attendance marked successfully');
        logger.log('   🔄 Google Sheet should be auto-syncing attendance...');

      } catch (error) {
        logger.error('❌ Test 5 failed:', error);
      }
    }, 8000); // Wait 8 seconds

    return {
      success: true,
      eventId: createdEvent.id,
      registrationId: registration.id,
      message: 'Auto-sync test initiated. Check console logs for progress.'
    };

  } catch (error) {
    logger.error('❌ Auto-Sync Test Failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Test manual sync for an existing event
 */
export const testManualSync = async (eventId) => {
  logger.log(`🧪 Testing manual sync for event: ${eventId}`);

  try {
    const result = await autoSyncService.autoSyncRegistrations(eventId, 'manual_test');

    if (result.success) {
      logger.log('✅ Manual sync test successful');
      return result;
    } else {
      logger.log('⚠️ Manual sync test failed:', result.reason || result.error);
      return result;
    }
  } catch (error) {
    logger.error('❌ Manual sync test error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check auto-sync status for an event
 */
export const checkAutoSyncStatus = async (eventId) => {
  logger.log(`🔍 Checking auto-sync status for event: ${eventId}`);

  try {
    const eventData = await eventService.getEventById(eventId);

    if (!eventData) {
      return {
        success: false,
        error: 'Event not found'
      };
    }

    const status = {
      eventId,
      eventTitle: eventData.title,
      hasGoogleSheet: !!eventData.google_sheet_id,
      googleSheetId: eventData.google_sheet_id || null,
      googleSheetUrl: eventData.google_sheet_url || null,
      autoSyncEnabled: eventData.auto_sync_enabled || false,
      sheetCreatedAt: eventData.sheet_created_at || null,
      lastSyncAt: eventData.last_sync_at || null,
      lastSyncType: eventData.last_sync_type || null,
      syncError: eventData.sync_error || null
    };

    logger.log('📊 Auto-sync status:', status);
    return {
      success: true,
      status
    };

  } catch (error) {
    logger.error('❌ Error checking auto-sync status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Disable auto-sync for an event
 */
export const disableAutoSync = async (eventId) => {
  logger.log(`🔇 Disabling auto-sync for event: ${eventId}`);

  try {
    await autoSyncService.disableAutoSync(eventId);
    logger.log('✅ Auto-sync disabled successfully');
    return { success: true };
  } catch (error) {
    logger.error('❌ Error disabling auto-sync:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Enable auto-sync for an event
 */
export const enableAutoSync = async (eventId) => {
  logger.log(`🔊 Enabling auto-sync for event: ${eventId}`);

  try {
    await autoSyncService.enableAutoSync(eventId);
    logger.log('✅ Auto-sync enabled successfully');
    return { success: true };
  } catch (error) {
    logger.error('❌ Error enabling auto-sync:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export all test functions
export default {
  testAutoSync,
  testManualSync,
  checkAutoSyncStatus,
  disableAutoSync,
  enableAutoSync
};
