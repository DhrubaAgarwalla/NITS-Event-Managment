import Razorpay from 'razorpay';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { club_id } = req.query;

    if (!club_id) {
      return res.status(400).json({ error: 'Club ID is required' });
    }

    console.log('Getting account status for club:', club_id);

    // Get club bank details from Firebase
    const bankDetailsRef = ref(database, `club_bank_details/${club_id}`);
    const snapshot = await get(bankDetailsRef);

    if (!snapshot.exists()) {
      return res.status(404).json({ 
        error: 'Club bank details not found',
        has_bank_details: false,
        razorpay_account_status: null
      });
    }

    const bankDetails = snapshot.val();

    // If no Razorpay account ID, return basic status
    if (!bankDetails.razorpay_account_id) {
      return res.status(200).json({
        has_bank_details: true,
        has_razorpay_account: false,
        verification_status: bankDetails.verification_status || 'pending',
        razorpay_account_status: null,
        can_receive_direct_payments: false
      });
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Get account details from Razorpay
    try {
      const account = await razorpay.accounts.fetch(bankDetails.razorpay_account_id);
      
      console.log('Razorpay account status:', {
        id: account.id,
        status: account.status,
        reference_id: account.reference_id
      });

      // Determine if account can receive direct payments
      const canReceivePayments = account.status === 'activated' && 
                                bankDetails.verification_status === 'verified';

      return res.status(200).json({
        has_bank_details: true,
        has_razorpay_account: true,
        verification_status: bankDetails.verification_status || 'pending',
        razorpay_account_status: {
          id: account.id,
          status: account.status,
          reference_id: account.reference_id,
          created_at: account.created_at,
          activated_at: account.activated_at || null,
          live_mode: account.live_mode
        },
        can_receive_direct_payments: canReceivePayments,
        bank_account_verified: !!bankDetails.razorpay_bank_account_id
      });

    } catch (razorpayError) {
      console.error('Error fetching Razorpay account:', razorpayError);
      
      // If account not found in Razorpay, update local status
      if (razorpayError.statusCode === 404) {
        return res.status(200).json({
          has_bank_details: true,
          has_razorpay_account: false,
          verification_status: 'error',
          razorpay_account_status: null,
          can_receive_direct_payments: false,
          error: 'Razorpay account not found'
        });
      }

      // For other Razorpay errors, return what we know from Firebase
      return res.status(200).json({
        has_bank_details: true,
        has_razorpay_account: true,
        verification_status: bankDetails.verification_status || 'pending',
        razorpay_account_status: {
          id: bankDetails.razorpay_account_id,
          status: 'unknown',
          error: 'Unable to fetch current status'
        },
        can_receive_direct_payments: false,
        error: 'Unable to verify Razorpay account status'
      });
    }

  } catch (error) {
    console.error('Error getting club account status:', error);
    
    // Handle Firebase errors
    if (error.code && error.code.startsWith('FIREBASE_')) {
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to fetch club details'
      });
    }

    // Handle general errors
    res.status(500).json({
      error: 'Failed to get club account status',
      message: error.message
    });
  }
}
