export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  switch (action) {
    case 'env':
      return res.status(200).json({
        message: 'Environment test',
        hasRazorpayKey: !!process.env.RAZORPAY_KEY_ID,
        hasRazorpaySecret: !!process.env.RAZORPAY_KEY_SECRET,
        hasWebhookSecret: !!process.env.RAZORPAY_WEBHOOK_SECRET,
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });

    case 'pipeline':
      return res.status(200).json({
        message: 'Pipeline test successful',
        status: 'healthy',
        timestamp: new Date().toISOString()
      });

    default:
      return res.status(200).json({
        success: true,
        message: 'API is working correctly',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        availableActions: ['env', 'pipeline']
      });
  }
}
