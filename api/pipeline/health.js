/**
 * Pipeline Health Check API Endpoint
 * GET /api/pipeline/health
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
    // Mock health check
    // In a real implementation, this would check actual component health
    const health = {
      status: 'healthy',
      isRunning: true,
      components: {
        ingestion: {
          status: 'healthy',
          errorRate: 0.001,
          lastCheck: new Date().toISOString()
        },
        processing: {
          status: 'healthy',
          errorRate: 0.002,
          totalProcessed: 1245,
          featuresGenerated: 1245
        },
        warehouse: {
          status: 'healthy',
          initialized: true,
          lastQuery: new Date(Date.now() - 30 * 1000).toISOString()
        }
      },
      uptime: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
      lastHealthCheck: new Date().toISOString()
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });

  } catch (error) {
    console.error('Error checking pipeline health:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: {
        status: 'unhealthy',
        error: error.message
      }
    });
  }
}
