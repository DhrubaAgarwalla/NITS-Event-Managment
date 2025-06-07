import crypto from 'crypto';
import Razorpay from 'razorpay';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, get } from 'firebase/database';

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
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      event_id,
      registration_data
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification data' });
    }

    if (!event_id || !registration_data) {
      return res.status(400).json({ error: 'Missing registration data' });
    }

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.error('Payment signature verification failed:', {
        expected: expectedSignature,
        received: razorpay_signature
      });
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    console.log('Payment signature verified successfully');

    // Initialize Razorpay to fetch payment details
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    console.log('Payment details fetched:', {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      method: payment.method
    });

    // Check if payment is captured
    if (payment.status !== 'captured') {
      return res.status(400).json({ 
        error: 'Payment not captured',
        status: payment.status 
      });
    }

    // Get event details to validate payment amount
    const eventRef = ref(database, `events/${event_id}`);
    const eventSnapshot = await get(eventRef);
    
    if (!eventSnapshot.exists()) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventSnapshot.val();
    const expectedAmount = eventData.payment_amount * 100; // Convert to paise

    if (payment.amount !== expectedAmount) {
      console.error('Payment amount mismatch:', {
        expected: expectedAmount,
        received: payment.amount
      });
      return res.status(400).json({ error: 'Payment amount mismatch' });
    }

    // Create registration record
    const registrationRef = ref(database, 'registrations');
    const newRegistrationRef = push(registrationRef);
    const registrationId = newRegistrationRef.key;

    const registrationRecord = {
      ...registration_data,
      event_id: event_id,
      registration_date: new Date().toISOString(),
      status: 'registered',
      attendance_status: 'not_attended',
      
      // Payment information
      payment_method: 'razorpay',
      payment_status: 'captured',
      payment_id: razorpay_payment_id,
      payment_order_id: razorpay_order_id,
      payment_amount: payment.amount / 100, // Convert back to rupees
      payment_captured_at: new Date().toISOString(),
      
      // QR code for attendance
      qr_code_data: `${registrationId}_${Date.now()}`,
      qr_code_generated_at: new Date().toISOString(),
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save registration to Firebase
    await set(newRegistrationRef, registrationRecord);

    console.log('Registration created successfully:', {
      registrationId,
      eventId: event_id,
      paymentId: razorpay_payment_id
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Payment verified and registration completed',
      registration_id: registrationId,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      payment_status: 'captured',
      registration_status: 'registered'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    
    // Handle specific Razorpay errors
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: error.error?.description || 'Razorpay API error',
        code: error.error?.code
      });
    }

    // Handle Firebase errors
    if (error.code && error.code.startsWith('FIREBASE_')) {
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to save registration'
      });
    }

    // Handle general errors
    res.status(500).json({
      error: 'Payment verification failed',
      message: error.message
    });
  }
}
