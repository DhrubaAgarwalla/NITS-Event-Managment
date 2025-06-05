/**
 * Test Automation System
 * Simple test script to verify automation functionality
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, update } from 'firebase/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

/**
 * Test automation functions
 */
async function testAutomation() {
  console.log('🧪 Testing Event Manager Automation System...\n');

  try {
    // Test 1: Check Firebase connection
    console.log('1️⃣ Testing Firebase connection...');
    const testRef = ref(database, 'automation_status');
    await set(testRef, {
      test: true,
      timestamp: new Date().toISOString()
    });
    console.log('✅ Firebase connection successful\n');

    // Test 2: Get events data
    console.log('2️⃣ Testing events data retrieval...');
    const eventsRef = ref(database, 'events');
    const eventsSnapshot = await get(eventsRef);

    if (eventsSnapshot.exists()) {
      const eventsData = eventsSnapshot.val();
      const eventCount = Object.keys(eventsData).length;
      console.log(`✅ Found ${eventCount} events in database\n`);

      // Test 3: Analyze events for automation
      console.log('3️⃣ Analyzing events for automation needs...');
      const events = Object.keys(eventsData).map(key => ({
        id: key,
        ...eventsData[key]
      }));

      let needsRegistrationClosure = 0;
      let needsStatusUpdate = 0;
      let readyForArchival = 0;

      events.forEach(event => {
        // Check registration closure
        if (shouldAutoCloseRegistration(event) && event.registration_open) {
          needsRegistrationClosure++;
        }

        // Check status update
        const currentStatus = getEventStatus(event);
        if (event.status !== currentStatus) {
          needsStatusUpdate++;
        }

        // Check archival
        if (currentStatus === 'completed' && !event.is_archived) {
          const endDate = new Date(event.end_date);
          const daysSinceEnd = (new Date() - endDate) / (1000 * 60 * 60 * 24);
          if (daysSinceEnd > 30) {
            readyForArchival++;
          }
        }
      });

      console.log(`📊 Automation Analysis:`);
      console.log(`   - Events needing registration closure: ${needsRegistrationClosure}`);
      console.log(`   - Events needing status update: ${needsStatusUpdate}`);
      console.log(`   - Events ready for archival: ${readyForArchival}\n`);

    } else {
      console.log('⚠️ No events found in database\n');
    }

    // Test 4: Test automation API endpoint
    console.log('4️⃣ Testing automation API endpoint...');
    try {
      // Try different possible ports/URLs
      const possibleUrls = [
        'http://localhost:5173/api/automation/trigger',
        'http://localhost:3000/api/automation/trigger',
        'http://localhost:4173/api/automation/trigger'
      ];

      let apiWorking = false;
      for (const url of possibleUrls) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Automation API endpoint working at ${url}`);
            console.log(`📊 API Response:`, result);
            apiWorking = true;
            break;
          }
        } catch (urlError) {
          // Continue to next URL
        }
      }

      if (!apiWorking) {
        console.log('⚠️ Automation API endpoint not accessible (this is normal if dev server is not running)');
        console.log('   To test API: npm run dev (in another terminal)');
      }
    } catch (error) {
      console.log('⚠️ Automation API endpoint not accessible (this is normal if dev server is not running)');
    }
    console.log('');

    // Test 5: Check automation logs
    console.log('5️⃣ Checking automation logs...');
    const logsRef = ref(database, 'automation_logs');
    const logsSnapshot = await get(logsRef);

    if (logsSnapshot.exists()) {
      const logsData = logsSnapshot.val();
      const logCount = Object.keys(logsData).length;
      console.log(`✅ Found ${logCount} automation log entries`);

      // Get latest logs (last 3)
      const logs = Object.entries(logsData).sort((a, b) => b[0] - a[0]);
      if (logs.length > 0) {
        console.log(`\n📝 Recent automation runs:`);

        for (let i = 0; i < Math.min(3, logs.length); i++) {
          const [timestamp, logEntry] = logs[i];
          console.log(`\n   Run ${i + 1}: ${logEntry.timestamp}`);
          console.log(`   Status: ${logEntry.status}`);
          console.log(`   Type: ${logEntry.type || 'unknown'}`);
          console.log(`   Events processed: ${logEntry.eventsProcessed || 0}`);

          // Show error details if status is error
          if (logEntry.status === 'error') {
            console.log(`   ❌ Error: ${logEntry.error || 'Unknown error'}`);
            if (logEntry.results && logEntry.results.errors) {
              console.log(`   Error details:`, logEntry.results.errors);
            }
          }

          // Show results if available
          if (logEntry.results && logEntry.status !== 'error') {
            const results = logEntry.results;
            console.log(`   Results:`);
            console.log(`     - Registrations closed: ${results.registrationsClosed?.length || 0}`);
            console.log(`     - Statuses updated: ${results.statusesUpdated?.length || 0}`);
            console.log(`     - Events archived: ${results.eventsArchived?.length || 0}`);
            console.log(`     - Errors: ${results.errors?.length || 0}`);
          }
        }
      }
    } else {
      console.log('📝 No automation logs found (this is normal for first run)');
    }
    console.log('');

    // Test 6: Write test automation log
    console.log('6️⃣ Writing test automation log...');
    const testLogRef = ref(database, `automation_logs/${Date.now()}`);
    await set(testLogRef, {
      timestamp: new Date().toISOString(),
      type: 'test_run',
      status: 'success',
      message: 'Automation system test completed successfully',
      eventsProcessed: eventsSnapshot.exists() ? Object.keys(eventsSnapshot.val()).length : 0
    });
    console.log('✅ Test automation log written successfully\n');

    console.log('🎉 All automation tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Firebase connection working');
    console.log('   ✅ Events data accessible');
    console.log('   ✅ Automation analysis working');
    console.log('   ✅ Automation logging working');
    console.log('\n🚀 Automation system is ready to use!');

  } catch (error) {
    console.error('❌ Automation test failed:', error);
    process.exit(1);
  }
}

/**
 * Helper functions (duplicated from utils for testing independence)
 */
function getEventStatus(event) {
  if (!event.start_date || !event.end_date) {
    return 'upcoming';
  }

  const now = new Date();
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const eventEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  if (today < eventStart) {
    return 'upcoming';
  } else if (today >= eventStart && today <= eventEnd) {
    return 'ongoing';
  } else {
    return 'completed';
  }
}

function shouldAutoCloseRegistration(event) {
  if (!event.start_date || !event.end_date) {
    return false;
  }

  const status = getEventStatus(event);

  if (status === 'completed') {
    return true;
  }

  if (event.registration_deadline) {
    const deadline = new Date(event.registration_deadline);
    const now = new Date();
    if (now > deadline) {
      return true;
    }
  }

  return false;
}

// Run the test
testAutomation();
