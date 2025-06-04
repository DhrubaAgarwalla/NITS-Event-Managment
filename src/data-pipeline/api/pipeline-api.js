/**
 * Data Pipeline API
 * REST API endpoints for managing and monitoring the data pipeline
 */

import express from 'express';
import PipelineOrchestrator from '../pipeline-orchestrator.js';
import logger from '../../utils/logger.js';

const router = express.Router();
let pipelineOrchestrator = null;

/**
 * Initialize pipeline orchestrator
 */
const initializePipeline = async () => {
  if (!pipelineOrchestrator) {
    pipelineOrchestrator = new PipelineOrchestrator();
    
    // Setup event listeners for logging
    pipelineOrchestrator.on('started', () => {
      logger.log('Pipeline started via API');
    });
    
    pipelineOrchestrator.on('stopped', () => {
      logger.log('Pipeline stopped via API');
    });
    
    pipelineOrchestrator.on('error', (error) => {
      logger.error('Pipeline error', error);
    });
    
    pipelineOrchestrator.on('batch_stored', (info) => {
      logger.log(`Batch stored: ${info.recordCount} records from ${info.source}`);
    });
  }
  return pipelineOrchestrator;
};

/**
 * GET /api/pipeline/status
 * Get current pipeline status
 */
router.get('/status', async (req, res) => {
  try {
    const pipeline = await initializePipeline();
    const status = pipeline.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting pipeline status', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/pipeline/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const pipeline = await initializePipeline();
    const health = await pipeline.healthCheck();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
  } catch (error) {
    logger.error('Error checking pipeline health', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/pipeline/start
 * Start the data pipeline
 */
router.post('/start', async (req, res) => {
  try {
    const pipeline = await initializePipeline();
    
    if (pipeline.isRunning) {
      return res.status(400).json({
        success: false,
        error: 'Pipeline is already running'
      });
    }
    
    await pipeline.start();
    
    res.json({
      success: true,
      message: 'Pipeline started successfully',
      data: pipeline.getStatus()
    });
  } catch (error) {
    logger.error('Error starting pipeline', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/pipeline/stop
 * Stop the data pipeline
 */
router.post('/stop', async (req, res) => {
  try {
    const pipeline = await initializePipeline();
    
    if (!pipeline.isRunning) {
      return res.status(400).json({
        success: false,
        error: 'Pipeline is not running'
      });
    }
    
    await pipeline.stop();
    
    res.json({
      success: true,
      message: 'Pipeline stopped successfully',
      data: pipeline.getStatus()
    });
  } catch (error) {
    logger.error('Error stopping pipeline', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/pipeline/trigger
 * Trigger manual pipeline run
 */
router.post('/trigger', async (req, res) => {
  try {
    const pipeline = await initializePipeline();
    const { source = 'api' } = req.body;
    
    await pipeline.triggerManualRun(source);
    
    res.json({
      success: true,
      message: 'Manual pipeline run triggered',
      data: {
        source,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error triggering manual pipeline run', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/pipeline/analytics
 * Get pipeline analytics and metrics
 */
router.get('/analytics', async (req, res) => {
  try {
    const pipeline = await initializePipeline();
    const analytics = await pipeline.getAnalytics();
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting pipeline analytics', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/pipeline/metrics
 * Get detailed pipeline metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const pipeline = await initializePipeline();
    const status = pipeline.getStatus();
    
    // Calculate additional metrics
    const uptime = status.startTime ? 
      Date.now() - new Date(status.startTime).getTime() : 0;
    
    const errorRate = status.totalRecordsProcessed > 0 ? 
      status.errors / status.totalRecordsProcessed : 0;
    
    const metrics = {
      uptime,
      errorRate,
      recordsPerSecond: uptime > 0 ? 
        (status.totalRecordsProcessed / (uptime / 1000)) : 0,
      batchesPerHour: uptime > 0 ? 
        (status.totalBatchesProcessed / (uptime / 3600000)) : 0,
      ...status
    };
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error getting pipeline metrics', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/pipeline/reset-stats
 * Reset pipeline statistics
 */
router.post('/reset-stats', async (req, res) => {
  try {
    const pipeline = await initializePipeline();
    pipeline.resetStats();
    
    res.json({
      success: true,
      message: 'Pipeline statistics reset',
      data: pipeline.getStatus()
    });
  } catch (error) {
    logger.error('Error resetting pipeline stats', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/pipeline/query
 * Execute custom queries on the data warehouse
 */
router.post('/query', async (req, res) => {
  try {
    const pipeline = await initializePipeline();
    const { sql, params = [] } = req.body;
    
    if (!sql) {
      return res.status(400).json({
        success: false,
        error: 'SQL query is required'
      });
    }
    
    // Basic SQL injection protection (in production, use proper query builder)
    const allowedKeywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT'];
    const upperSQL = sql.toUpperCase();
    
    if (!allowedKeywords.some(keyword => upperSQL.includes(keyword))) {
      return res.status(400).json({
        success: false,
        error: 'Only SELECT queries are allowed'
      });
    }
    
    if (upperSQL.includes('DROP') || upperSQL.includes('DELETE') || upperSQL.includes('UPDATE')) {
      return res.status(400).json({
        success: false,
        error: 'Destructive operations are not allowed'
      });
    }
    
    const result = await pipeline.dataWarehouse.query(sql, params);
    
    res.json({
      success: true,
      data: result,
      rowCount: result.length
    });
  } catch (error) {
    logger.error('Error executing query', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/pipeline/events/:eventId/analytics
 * Get analytics for a specific event
 */
router.get('/events/:eventId/analytics', async (req, res) => {
  try {
    const pipeline = await initializePipeline();
    const { eventId } = req.params;
    
    const analytics = await pipeline.dataWarehouse.getEventAnalytics(eventId);
    
    if (!analytics) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting event analytics', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Error handling middleware
 */
router.use((error, req, res, next) => {
  logger.error('Pipeline API error', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

export default router;
