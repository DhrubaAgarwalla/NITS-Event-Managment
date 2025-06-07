import crypto from 'crypto';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, query, orderByChild, equalTo, get, update } from 'firebase/database';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSignature || !webhookSecret) {
      console.error('Missing webhook signature or secret');
      return res.status(400).json({ error: 'Missing webhook signature' });
    }

    // Get raw body for signature verification
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      console.error('Webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    console.log('Webhook signature verified successfully');

    const { event, payload } = req.body;
    const paymentEntity = payload.payment?.entity;

    if (!paymentEntity) {
      console.log('No payment entity in webhook payload');
      return res.status(200).json({ message: 'No payment entity found' });
    }

    console.log('Processing webhook event:', {
      event,
      paymentId: paymentEntity.id,
      status: paymentEntity.status,
      amount: paymentEntity.amount
    });

    // Find registration by payment ID
    const registrationsRef = ref(database, 'registrations');
    const paymentQuery = query(
      registrationsRef,
      orderByChild('payment_id'),
      equalTo(paymentEntity.id)
    );

    const snapshot = await get(paymentQuery);
    
    if (!snapshot.exists()) {
      console.log('No registration found for payment ID:', paymentEntity.id);
      return res.status(200).json({ message: 'Registration not found' });
    }

    // Get the registration data
    const registrations = snapshot.val();
    const registrationId = Object.keys(registrations)[0];
    const registration = registrations[registrationId];

    console.log('Found registration:', {
      registrationId,
      currentStatus: registration.payment_status
    });

    // Update registration based on webhook event
    let updateData = {
      updated_at: new Date().toISOString()
    };

    switch (event) {
      case 'payment.captured':
        updateData.payment_status = 'captured';
        updateData.payment_captured_at = new Date().toISOString();
        console.log('Payment captured successfully');
        break;

      case 'payment.failed':
        updateData.payment_status = 'failed';
        updateData.payment_failed_at = new Date().toISOString();
        updateData.status = 'cancelled';
        console.log('Payment failed');
        break;

      case 'payment.authorized':
        updateData.payment_status = 'authorized';
        updateData.payment_authorized_at = new Date().toISOString();
        console.log('Payment authorized');
        break;

      default:
        console.log('Unhandled webhook event:', event);
        return res.status(200).json({ message: 'Event not handled' });
    }

    // Update registration in Firebase
    const registrationRef = ref(database, `registrations/${registrationId}`);
    await update(registrationRef, updateData);

    console.log('Registration updated successfully:', {
      registrationId,
      updates: updateData
    });

    // Trigger Google Sheets auto-sync if payment is captured
    if (event === 'payment.captured') {
      try {
        // Import auto-sync service dynamically to avoid circular dependencies
        const autoSyncModule = await import('../../src/services/autoSyncService.js');
        const autoSyncService = autoSyncModule.default;

        // Run auto-sync in background (don't await)
        autoSyncService.autoSyncRegistrations(registration.event_id, 'payment')
          .then(result => {
            if (result.success) {
              console.log(`✅ Google Sheet auto-synced for event ${registration.event_id} (webhook payment update)`);
            } else {
              console.warn(`⚠️ Google Sheet auto-sync failed for event ${registration.event_id}: ${result.reason || result.error}`);
            }
          })
          .catch(error => {
            console.error(`❌ Google Sheet auto-sync error for event ${registration.event_id}:`, error);
          });
      } catch (error) {
        console.warn('⚠️ Failed to initiate Google Sheet auto-sync from webhook:', error);
        // Don't fail webhook processing if auto-sync fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      event,
      registrationId,
      paymentStatus: updateData.payment_status
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message
    });
  }
}
