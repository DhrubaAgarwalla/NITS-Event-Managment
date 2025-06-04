/**
 * Pipeline Integration
 * Integrates the data pipeline with existing event manager services
 */

import PipelineOrchestrator from '../pipeline-orchestrator.js';
import logger from '../../utils/logger.js';

class PipelineIntegration {
  constructor() {
    this.pipeline = null;
    this.isInitialized = false;
  }

  /**
   * Initialize and start the pipeline
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return;
      }

      logger.log('Initializing Data Pipeline Integration');

      // Create pipeline orchestrator
      this.pipeline = new PipelineOrchestrator();

      // Setup event handlers for integration with existing services
      this.setupIntegrationHandlers();

      // Start the pipeline
      await this.pipeline.start();

      this.isInitialized = true;
      logger.log('Data Pipeline Integration initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize Data Pipeline Integration', error);
      throw error;
    }
  }

  /**
   * Setup handlers to integrate with existing services
   */
  setupIntegrationHandlers() {
    // Handle real-time registration events
    this.pipeline.on('registration_created', (record) => {
      this.handleNewRegistration(record);
    });

    // Handle high-value registrations
    this.pipeline.on('high_value_registration', (record) => {
      this.handleHighValueRegistration(record);
    });

    // Handle batch processing completion
    this.pipeline.on('batch_stored', (info) => {
      this.handleBatchStored(info);
    });

    // Handle pipeline errors
    this.pipeline.on('error', (error) => {
      this.handlePipelineError(error);
    });
  }

  /**
   * Handle new registration for real-time updates
   */
  async handleNewRegistration(record) {
    try {
      logger.log(`Processing new registration: ${record.id}`);

      // Update live dashboard metrics
      // This could trigger WebSocket updates to connected clients
      
      // Trigger Google Sheets auto-sync if needed
      if (record.event_id) {
        // You could integrate with your existing autoSyncService here
        logger.log(`Triggering auto-sync for event: ${record.event_id}`);
      }

      // Update ML model features in real-time
      await this.updateMLFeatures(record);

    } catch (error) {
      logger.error('Error handling new registration', error);
    }
  }

  /**
   * Handle high-value registrations (for alerts)
   */
  async handleHighValueRegistration(record) {
    try {
      logger.log(`High-value registration detected: ${record.id} - ₹${record.payment_amount}`);

      // Send notification to admins
      // This could integrate with your email service
      
      // Log for analytics
      logger.log('High-value registration logged for analytics');

    } catch (error) {
      logger.error('Error handling high-value registration', error);
    }
  }

  /**
   * Handle batch storage completion
   */
  async handleBatchStored(info) {
    try {
      logger.log(`Batch stored: ${info.recordCount} records from ${info.source}`);

      // Update analytics dashboards
      // Trigger any dependent processes
      
    } catch (error) {
      logger.error('Error handling batch stored event', error);
    }
  }

  /**
   * Handle pipeline errors
   */
  async handlePipelineError(error) {
    try {
      logger.error('Pipeline error detected', error);

      // Send alert to administrators
      // Log to error tracking service
      // Attempt recovery if possible

    } catch (err) {
      logger.error('Error handling pipeline error', err);
    }
  }

  /**
   * Update ML model features
   */
  async updateMLFeatures(record) {
    try {
      // This would update your ML model's feature store
      // For now, just log the action
      logger.log(`Updating ML features for record: ${record.id}`);

      // Example: Update user engagement score
      if (record.participant_email) {
        // Calculate and store updated engagement metrics
      }

    } catch (error) {
      logger.error('Error updating ML features', error);
    }
  }

  /**
   * Get pipeline analytics for dashboard
   */
  async getAnalytics() {
    if (!this.isInitialized) {
      throw new Error('Pipeline not initialized');
    }

    return await this.pipeline.getAnalytics();
  }

  /**
   * Get pipeline status
   */
  getStatus() {
    if (!this.isInitialized) {
      return { initialized: false };
    }

    return {
      initialized: true,
      ...this.pipeline.getStatus()
    };
  }

  /**
   * Trigger manual pipeline run
   */
  async triggerManualRun(source = 'integration') {
    if (!this.isInitialized) {
      throw new Error('Pipeline not initialized');
    }

    return await this.pipeline.triggerManualRun(source);
  }

  /**
   * Query data warehouse
   */
  async queryData(sql, params = []) {
    if (!this.isInitialized) {
      throw new Error('Pipeline not initialized');
    }

    return await this.pipeline.dataWarehouse.query(sql, params);
  }

  /**
   * Get event analytics
   */
  async getEventAnalytics(eventId) {
    if (!this.isInitialized) {
      throw new Error('Pipeline not initialized');
    }

    return await this.pipeline.dataWarehouse.getEventAnalytics(eventId);
  }

  /**
   * Shutdown the pipeline
   */
  async shutdown() {
    try {
      if (this.pipeline && this.isInitialized) {
        await this.pipeline.stop();
        this.isInitialized = false;
        logger.log('Data Pipeline Integration shutdown complete');
      }
    } catch (error) {
      logger.error('Error during pipeline shutdown', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.isInitialized) {
      return { status: 'not_initialized' };
    }

    return await this.pipeline.healthCheck();
  }
}

// Create singleton instance
const pipelineIntegration = new PipelineIntegration();

// Auto-initialize if in production
if (process.env.NODE_ENV === 'production') {
  pipelineIntegration.initialize().catch(error => {
    logger.error('Failed to auto-initialize pipeline in production', error);
  });
}

export default pipelineIntegration;
