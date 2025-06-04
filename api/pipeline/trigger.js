/**
 * Pipeline Manual Trigger API Endpoint
 * POST /api/pipeline/trigger
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { source = 'api' } = req.body || {};

    // Mock manual pipeline trigger
    // In a real implementation, this would trigger actual pipeline processing
    console.log(`Manual pipeline run triggered from: ${source}`);

    // Simulate processing
    const result = {
      source,
      timestamp: new Date().toISOString(),
      recordsProcessed: Math.floor(Math.random() * 100) + 50,
      batchesProcessed: Math.floor(Math.random() * 5) + 1,
      processingTime: Math.floor(Math.random() * 5000) + 1000 // 1-6 seconds
    };

    res.status(200).json({
      success: true,
      message: 'Manual pipeline run triggered successfully',
      data: result
    });

  } catch (error) {
    console.error('Error triggering manual pipeline run:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
