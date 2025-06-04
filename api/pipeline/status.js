/**
 * Pipeline Status API Endpoint
 * GET /api/pipeline/status
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Mock pipeline status for now
    // In a real implementation, this would check actual pipeline status
    const status = {
      isRunning: true,
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      totalRecordsProcessed: 1247,
      totalBatchesProcessed: 23,
      errors: 2,
      lastProcessedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      components: {
        ingestion: {
          status: 'healthy',
          errorRate: 0.001
        },
        processing: {
          status: 'healthy',
          errorRate: 0.002
        },
        warehouse: {
          status: 'healthy',
          initialized: true
        }
      }
    };

    res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error getting pipeline status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
