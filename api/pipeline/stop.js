/**
 * Pipeline Stop API Endpoint
 * POST /api/pipeline/stop
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
    // Mock pipeline stop
    // In a real implementation, this would stop the actual pipeline
    console.log('Pipeline stop requested');

    // Simulate pipeline stopping
    const status = {
      isRunning: false,
      startTime: null,
      totalRecordsProcessed: 1247,
      totalBatchesProcessed: 23,
      errors: 2,
      lastProcessedAt: new Date().toISOString(),
      components: {
        ingestion: {
          status: 'stopped',
          errorRate: 0.001
        },
        processing: {
          status: 'stopped',
          errorRate: 0.002
        },
        warehouse: {
          status: 'stopped',
          initialized: true
        }
      }
    };

    res.status(200).json({
      success: true,
      message: 'Pipeline stopped successfully',
      data: status
    });

  } catch (error) {
    console.error('Error stopping pipeline:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
