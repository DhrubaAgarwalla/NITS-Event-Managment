import Razorpay from 'razorpay';

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
    const { amount, currency = 'INR', receipt, notes } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!receipt) {
      return res.status(400).json({ error: 'Receipt is required' });
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create order options
    const options = {
      amount: parseInt(amount), // Amount in paise
      currency: currency,
      receipt: receipt,
      payment_capture: 1, // Auto capture payment
      notes: notes || {}
    };

    // Add transfers if provided (for direct club payments via Route)
    if (req.body.transfers && Array.isArray(req.body.transfers)) {
      options.transfers = req.body.transfers;
      console.log('Creating order with Route transfers:', {
        transferCount: options.transfers.length,
        transfers: options.transfers.map(t => ({
          account: t.account,
          amount: t.amount,
          currency: t.currency
        }))
      });
    }

    console.log('Creating Razorpay order with options:', {
      ...options,
      amount: `${options.amount} paise (₹${options.amount / 100})`,
      hasTransfers: !!options.transfers
    });

    // Create order
    const order = await razorpay.orders.create(options);

    console.log('Razorpay order created successfully:', {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status
    });

    // Return order details
    res.status(200).json({
      success: true,
      id: order.id,
      entity: order.entity,
      amount: order.amount,
      amount_paid: order.amount_paid,
      amount_due: order.amount_due,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      attempts: order.attempts,
      notes: order.notes,
      created_at: order.created_at
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);

    // Handle specific Razorpay errors
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: error.error?.description || 'Razorpay API error',
        code: error.error?.code
      });
    }

    // Handle general errors
    res.status(500).json({
      error: 'Failed to create order',
      message: error.message
    });
  }
}
