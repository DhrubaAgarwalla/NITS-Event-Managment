export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check if credentials are properly set
    const credentialsCheck = {
      type: process.env.GOOGLE_CREDENTIALS_TYPE ? 'Set' : 'Missing',
      project_id: process.env.GOOGLE_CREDENTIALS_PROJECT_ID ? 'Set' : 'Missing',
      private_key_id: process.env.GOOGLE_CREDENTIALS_PRIVATE_KEY_ID ? 'Set' : 'Missing',
      private_key: process.env.GOOGLE_CREDENTIALS_PRIVATE_KEY ? 'Set (length: ' + (process.env.GOOGLE_CREDENTIALS_PRIVATE_KEY?.length || 0) + ')' : 'Missing',
      client_email: process.env.GOOGLE_CREDENTIALS_CLIENT_EMAIL ? 'Set' : 'Missing',
      client_id: process.env.GOOGLE_CREDENTIALS_CLIENT_ID ? 'Set' : 'Missing',
      auth_uri: process.env.GOOGLE_CREDENTIALS_AUTH_URI ? 'Set' : 'Missing',
      token_uri: process.env.GOOGLE_CREDENTIALS_TOKEN_URI ? 'Set' : 'Missing',
      auth_provider_cert_url: process.env.GOOGLE_CREDENTIALS_AUTH_PROVIDER_CERT_URL ? 'Set' : 'Missing',
      client_cert_url: process.env.GOOGLE_CREDENTIALS_CLIENT_CERT_URL ? 'Set' : 'Missing'
    };

    // Return environment variable status
    return res.status(200).json({
      success: true,
      message: 'Environment variables check',
      credentialsCheck,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    });
  } catch (error) {
    console.error('Error checking environment variables:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking environment variables',
      error: error.message
    });
  }
}
