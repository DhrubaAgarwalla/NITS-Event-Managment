/**
 * Test script to debug email service issues in deployed environment
 */

// Simulate the deployed environment
const DEPLOYED_BACKEND_URL = 'https://google-sheets-backend-five.vercel.app';

async function testEmailService() {
  console.log('🔍 Testing Email Service in Deployed Environment');
  console.log('================================================');
  console.log(`Backend URL: ${DEPLOYED_BACKEND_URL}`);

  // Test 1: Check if backend is accessible
  console.log('\n1. Testing backend accessibility...');
  try {
    const healthResponse = await fetch(`${DEPLOYED_BACKEND_URL}/api/v1/health`);
    console.log(`Health check status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend is accessible');
      console.log('Health data:', healthData);
    } else {
      console.log('❌ Backend health check failed');
      const errorText = await healthResponse.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Backend is not accessible:', error.message);
    return;
  }

  // Test 2: Test CORS preflight
  console.log('\n2. Testing CORS preflight...');
  try {
    const corsResponse = await fetch(`${DEPLOYED_BACKEND_URL}/api/v1/send-email`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://nits-event-managment.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log(`CORS preflight status: ${corsResponse.status}`);
    console.log('CORS headers:', Object.fromEntries(corsResponse.headers.entries()));
    
    if (corsResponse.ok) {
      console.log('✅ CORS preflight successful');
    } else {
      console.log('❌ CORS preflight failed');
    }
  } catch (error) {
    console.log('❌ CORS preflight error:', error.message);
  }

  // Test 3: Test actual email sending
  console.log('\n3. Testing email sending...');
  try {
    const emailData = {
      to: 'test@example.com',
      subject: 'Test Email from Deployed Frontend',
      html: '<h1>Test Email</h1><p>This is a test email from the deployed frontend.</p>'
    };

    const emailResponse = await fetch(`${DEPLOYED_BACKEND_URL}/api/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://nits-event-managment.vercel.app'
      },
      body: JSON.stringify(emailData)
    });

    console.log(`Email send status: ${emailResponse.status}`);
    
    if (emailResponse.ok) {
      const result = await emailResponse.json();
      console.log('✅ Email sending successful');
      console.log('Result:', result);
    } else {
      const errorData = await emailResponse.json();
      console.log('❌ Email sending failed');
      console.log('Error:', errorData);
    }
  } catch (error) {
    console.log('❌ Email sending error:', error.message);
  }

  // Test 4: Test QR email endpoint specifically
  console.log('\n4. Testing QR email endpoint...');
  try {
    const qrEmailData = {
      participantEmail: 'test@example.com',
      participantName: 'Test User',
      eventTitle: 'Test Event',
      eventDate: new Date().toISOString(),
      eventLocation: 'Test Location',
      qrCodeImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      registrationId: 'test-registration-123'
    };

    const qrResponse = await fetch(`${DEPLOYED_BACKEND_URL}/api/v1/send-qr-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://nits-event-managment.vercel.app'
      },
      body: JSON.stringify(qrEmailData)
    });

    console.log(`QR email status: ${qrResponse.status}`);
    
    if (qrResponse.ok) {
      const result = await qrResponse.json();
      console.log('✅ QR email sending successful');
      console.log('Result:', result);
    } else {
      const errorData = await qrResponse.json();
      console.log('❌ QR email sending failed');
      console.log('Error:', errorData);
    }
  } catch (error) {
    console.log('❌ QR email sending error:', error.message);
  }

  console.log('\n📊 Test Summary');
  console.log('================');
  console.log('If all tests pass, the email service should work in the deployed environment.');
  console.log('If any tests fail, check the specific error messages above.');
}

// Run the test
testEmailService().catch(console.error);
