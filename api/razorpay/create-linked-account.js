import Razorpay from 'razorpay';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, update } from 'firebase/database';

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
    const { club_id, bank_details } = req.body;

    // Validate required fields
    if (!club_id || !bank_details) {
      return res.status(400).json({ error: 'Club ID and bank details are required' });
    }

    const requiredFields = ['account_holder_name', 'account_number', 'ifsc_code', 'contact_email'];
    const missingFields = requiredFields.filter(field => !bank_details[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log('Creating Razorpay linked account for club:', club_id);

    // Create linked account data
    const accountData = {
      email: bank_details.contact_email,
      phone: bank_details.contact_phone || '',
      type: 'route',
      reference_id: `club_${club_id}`,
      legal_business_name: bank_details.account_holder_name,
      business_type: bank_details.business_type || 'individual',
      contact_name: bank_details.contact_name || bank_details.account_holder_name,
      profile: {
        category: 'education',
        subcategory: 'college',
        addresses: {
          registered: {
            street1: bank_details.address_line1 || '',
            street2: bank_details.address_line2 || '',
            city: bank_details.city || '',
            state: bank_details.state || '',
            postal_code: bank_details.pincode || '',
            country: 'IN'
          }
        }
      },
      legal_info: {
        pan: '', // Would need PAN for business accounts
        gst: ''  // Would need GST for business accounts
      }
    };

    // Create the linked account
    const account = await razorpay.accounts.create(accountData);

    console.log('Razorpay linked account created:', {
      id: account.id,
      status: account.status,
      reference_id: account.reference_id
    });

    // Add bank account to the linked account
    const bankAccountData = {
      account_number: bank_details.account_number,
      ifsc_code: bank_details.ifsc_code,
      beneficiary_name: bank_details.account_holder_name,
      account_type: bank_details.account_type || 'savings'
    };

    const bankAccount = await razorpay.accounts.addBankAccount(account.id, bankAccountData);

    console.log('Bank account added to linked account:', {
      account_id: account.id,
      bank_account_id: bankAccount.id
    });

    // Update Firebase with Razorpay account details
    const bankDetailsRef = ref(database, `club_bank_details/${club_id}`);
    const updateData = {
      razorpay_account_id: account.id,
      razorpay_bank_account_id: bankAccount.id,
      verification_status: 'under_review',
      razorpay_status: account.status,
      razorpay_created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await update(bankDetailsRef, updateData);

    console.log('Firebase updated with Razorpay account details');

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Razorpay linked account created successfully',
      account_id: account.id,
      bank_account_id: bankAccount.id,
      status: account.status,
      verification_status: 'under_review'
    });

  } catch (error) {
    console.error('Error creating Razorpay linked account:', error);
    
    // Handle specific Razorpay errors
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: error.error?.description || 'Razorpay API error',
        code: error.error?.code,
        field: error.error?.field
      });
    }

    // Handle Firebase errors
    if (error.code && error.code.startsWith('FIREBASE_')) {
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to save account details'
      });
    }

    // Handle general errors
    res.status(500).json({
      error: 'Failed to create linked account',
      message: error.message
    });
  }
}
