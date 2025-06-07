// Consolidated Razorpay API endpoints
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { ref, get, set, push } from 'firebase/database';
import { database } from '../src/lib/firebase-admin.js';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'create-order':
        return await createOrder(req, res);
      case 'verify-payment':
        return await verifyPayment(req, res);
      case 'webhook':
        return await handleWebhook(req, res);
      case 'create-linked-account':
        return await createLinkedAccount(req, res);
      case 'club-account-status':
        return await getClubAccountStatus(req, res);
      default:
        return res.status(404).json({ error: 'Action not found' });
    }
  } catch (error) {
    console.error('Razorpay API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Create Order
async function createOrder(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, currency = 'INR', receipt, notes } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  if (!receipt) {
    return res.status(400).json({ error: 'Receipt is required' });
  }

  const options = {
    amount: parseInt(amount),
    currency: currency,
    receipt: receipt,
    payment_capture: 1,
    notes: notes || {}
  };

  if (req.body.transfers && Array.isArray(req.body.transfers)) {
    options.transfers = req.body.transfers;
  }

  const order = await razorpay.orders.create(options);
  return res.status(200).json(order);
}

// Verify Payment
async function verifyPayment(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    event_id,
    registration_data
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing required payment parameters' });
  }

  // Verify signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  // Fetch payment details
  const payment = await razorpay.payments.fetch(razorpay_payment_id);

  if (payment.status !== 'captured') {
    return res.status(400).json({ error: 'Payment not captured' });
  }

  // Save registration to Firebase
  const registrationsRef = ref(database, 'registrations');
  const newRegistrationRef = push(registrationsRef);
  const registrationId = newRegistrationRef.key;

  const registrationRecord = {
    ...registration_data,
    event_id: event_id,
    registration_date: new Date().toISOString(),
    status: 'registered',
    attendance_status: 'not_attended',
    payment_method: 'razorpay',
    payment_status: 'captured',
    payment_id: razorpay_payment_id,
    payment_order_id: razorpay_order_id,
    payment_amount: payment.amount / 100,
    payment_captured_at: new Date().toISOString(),
    qr_code_data: `${registrationId}_${Date.now()}`,
    qr_code_generated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await set(newRegistrationRef, registrationRecord);

  return res.status(200).json({
    success: true,
    registration_id: registrationId,
    payment_id: razorpay_payment_id,
    amount: payment.amount / 100
  });
}

// Handle Webhook
async function handleWebhook(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSignature = req.headers['x-razorpay-signature'];
  const webhookBody = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(webhookBody)
    .digest('hex');

  if (webhookSignature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const { event, payload } = req.body;

  console.log('Webhook received:', event, payload);

  // Handle different webhook events
  switch (event) {
    case 'payment.captured':
      // Payment successful
      break;
    case 'payment.failed':
      // Payment failed
      break;
    case 'transfer.processed':
      // Transfer to linked account processed
      break;
    default:
      console.log('Unhandled webhook event:', event);
  }

  return res.status(200).json({ status: 'ok' });
}

// Create Linked Account
async function createLinkedAccount(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { club_id, bank_details } = req.body;

  if (!club_id || !bank_details) {
    return res.status(400).json({ error: 'Club ID and bank details are required' });
  }

  // Create linked account
  const accountData = {
    email: bank_details.contact_email,
    phone: bank_details.contact_phone,
    type: 'route',
    reference_id: club_id,
    legal_business_name: bank_details.account_holder_name,
    business_type: bank_details.business_type || 'educational',
    contact_name: bank_details.contact_name,
    profile: {
      category: 'education',
      subcategory: 'college',
      addresses: {
        registered: {
          street1: bank_details.address_line1,
          street2: bank_details.address_line2 || '',
          city: bank_details.city,
          state: bank_details.state,
          postal_code: bank_details.pincode,
          country: 'IN'
        }
      }
    }
  };

  const account = await razorpay.accounts.create(accountData);

  // Add bank account
  const bankAccountData = {
    account_number: bank_details.account_number,
    ifsc_code: bank_details.ifsc_code,
    beneficiary_name: bank_details.account_holder_name,
    account_type: bank_details.account_type
  };

  const bankAccount = await razorpay.accounts.addBankAccount(account.id, bankAccountData);

  // Update Firebase
  const bankDetailsRef = ref(database, `club_bank_details/${club_id}`);
  const updateData = {
    razorpay_account_id: account.id,
    razorpay_bank_account_id: bankAccount.id,
    verification_status: 'under_review',
    razorpay_status: account.status,
    razorpay_created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await set(bankDetailsRef, updateData);

  return res.status(200).json({
    success: true,
    account_id: account.id,
    bank_account_id: bankAccount.id,
    status: account.status
  });
}

// Get Club Account Status
async function getClubAccountStatus(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { club_id } = req.query;

  if (!club_id) {
    return res.status(400).json({ error: 'Club ID is required' });
  }

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

  if (!bankDetails.razorpay_account_id) {
    return res.status(200).json({
      has_bank_details: true,
      has_razorpay_account: false,
      razorpay_account_status: null,
      verification_status: bankDetails.verification_status || 'pending'
    });
  }

  try {
    const account = await razorpay.accounts.fetch(bankDetails.razorpay_account_id);

    return res.status(200).json({
      has_bank_details: true,
      has_razorpay_account: true,
      razorpay_account_status: account.status,
      verification_status: bankDetails.verification_status || 'pending',
      account_details: {
        id: account.id,
        status: account.status,
        reference_id: account.reference_id
      }
    });
  } catch (error) {
    console.error('Error fetching Razorpay account:', error);
    return res.status(200).json({
      has_bank_details: true,
      has_razorpay_account: true,
      razorpay_account_status: 'error',
      verification_status: bankDetails.verification_status || 'pending',
      error: 'Could not fetch account status'
    });
  }
}
