/**
 * Data Pipeline Orchestrator
 * Coordinates all pipeline components and manages data flow
 */

import { EventEmitter } from 'events';
import DataIngestionService from './ingestion/data-ingestion-service.js';
import DataProcessor from './processing/data-processor.js';
import DataWarehouse from './storage/data-warehouse.js';
import logger from '../utils/logger.js';
import { PIPELINE_CONFIG } from './config/pipeline-config.js';

class PipelineOrchestrator extends EventEmitter {
  constructor(config = PIPELINE_CONFIG) {
    super();
    this.config = config;
    this.isRunning = false;
    
    // Initialize components
    this.ingestionService = new DataIngestionService(config);
    this.dataProcessor = new DataProcessor(config);
    this.dataWarehouse = new DataWarehouse(config);
    
    this.stats = {
      startTime: null,
      totalRecordsProcessed: 0,
      totalBatchesProcessed: 0,
      errors: 0,
      lastProcessedAt: null
    };

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers between components
   */
  setupEventHandlers() {
    // Handle ingested batches
    this.ingestionService.on('batch', async (batch) => {
      try {
        await this.processBatch(batch);
      } catch (error) {
        logger.error('Error processing batch from ingestion', error);
        this.stats.errors++;
        this.emit('error', error);
      }
    });

    // Handle processed batches
    this.dataProcessor.on('batch_processed', async (processedBatch) => {
      try {
        await this.storeBatch(processedBatch);
      } catch (error) {
        logger.error('Error storing processed batch', error);
        this.stats.errors++;
        this.emit('error', error);
      }
    });

    // Handle individual records for real-time processing
    this.ingestionService.on('record', async (record) => {
      try {
        await this.processRealTimeRecord(record);
      } catch (error) {
        logger.error('Error processing real-time record', error);
        this.emit('error', error);
      }
    });

    // Forward component events
    this.ingestionService.on('started', () => this.emit('ingestion_started'));
    this.ingestionService.on('stopped', () => this.emit('ingestion_stopped'));
  }

  /**
   * Start the entire pipeline
   */
  async start() {
    try {
      logger.log('Starting Data Pipeline Orchestrator');
      
      // Initialize data warehouse
      await this.dataWarehouse.initialize();
      
      // Start ingestion service
      await this.ingestionService.start();
      
      this.isRunning = true;
      this.stats.startTime = new Date().toISOString();
      
      logger.log('Data Pipeline Orchestrator started successfully');
      this.emit('started');
      
    } catch (error) {
      logger.error('Failed to start Data Pipeline Orchestrator', error);
      throw error;
    }
  }

  /**
   * Stop the entire pipeline
   */
  async stop() {
    try {
      logger.log('Stopping Data Pipeline Orchestrator');
      
      this.isRunning = false;
      
      // Stop ingestion service
      await this.ingestionService.stop();
      
      // Close data warehouse connection
      await this.dataWarehouse.close();
      
      logger.log('Data Pipeline Orchestrator stopped');
      this.emit('stopped');
      
    } catch (error) {
      logger.error('Error stopping Data Pipeline Orchestrator', error);
      throw error;
    }
  }

  /**
   * Process a batch of records
   */
  async processBatch(batch) {
    try {
      logger.log(`Processing batch from ${batch.source} with ${batch.records.length} records`);
      
      // Process the batch
      const processedRecords = await this.dataProcessor.processBatch(batch);
      
      this.stats.totalBatchesProcessed++;
      this.stats.totalRecordsProcessed += processedRecords.length;
      this.stats.lastProcessedAt = new Date().toISOString();
      
      logger.log(`Successfully processed batch: ${processedRecords.length} records`);
      
    } catch (error) {
      logger.error('Error in batch processing', error);
      throw error;
    }
  }

  /**
   * Store processed batch in data warehouse
   */
  async storeBatch(processedBatch) {
    try {
      logger.log(`Storing batch from ${processedBatch.source} with ${processedBatch.processedCount} records`);
      
      // Group records by table type
      const recordsByTable = this.groupRecordsByTable(processedBatch.records);
      
      // Store in appropriate tables
      for (const [tableName, records] of Object.entries(recordsByTable)) {
        if (records.length > 0) {
          await this.dataWarehouse.storeRecords(records, tableName);
          logger.log(`Stored ${records.length} records in ${tableName}`);
        }
      }
      
      // Emit storage completion event
      this.emit('batch_stored', {
        source: processedBatch.source,
        recordCount: processedBatch.processedCount,
        tables: Object.keys(recordsByTable)
      });
      
    } catch (error) {
      logger.error('Error storing batch', error);
      throw error;
    }
  }

  /**
   * Group records by target table
   */
  groupRecordsByTable(records) {
    const grouped = {
      dim_events: [],
      dim_users: [],
      fact_registrations: [],
      fact_attendance: []
    };

    for (const record of records) {
      // Events go to dim_events
      if (record._collection === 'events') {
        grouped.dim_events.push(record);
      }
      
      // Registrations go to multiple tables
      if (record._collection === 'registrations') {
        grouped.fact_registrations.push(record);
        grouped.dim_users.push(record); // Also create/update user dimension
      }
      
      // Attendance records
      if (record.attendance_status && record.attendance_marked_at) {
        grouped.fact_attendance.push(record);
      }
    }

    return grouped;
  }

  /**
   * Process real-time record (for immediate actions)
   */
  async processRealTimeRecord(record) {
    try {
      // For real-time processing, we might want to:
      // 1. Update live dashboards
      // 2. Trigger alerts
      // 3. Update ML model features
      
      logger.log(`Processing real-time record: ${record.id} from ${record._source}`);
      
      // Emit for real-time consumers
      this.emit('real_time_record', record);
      
      // Example: Trigger alert for high-value registrations
      if (record.payment_amount && record.payment_amount > 1000) {
        this.emit('high_value_registration', record);
      }
      
      // Example: Update live metrics
      if (record._collection === 'registrations') {
        this.emit('registration_created', record);
      }
      
    } catch (error) {
      logger.error('Error processing real-time record', error);
      throw error;
    }
  }

  /**
   * Trigger manual pipeline run
   */
  async triggerManualRun(source = 'manual') {
    try {
      logger.log(`Triggering manual pipeline run from ${source}`);
      
      // Force flush all pending batches
      await this.ingestionService.flushAllBatches();
      
      this.emit('manual_run_completed', { source, timestamp: new Date().toISOString() });
      
    } catch (error) {
      logger.error('Error in manual pipeline run', error);
      throw error;
    }
  }

  /**
   * Get pipeline analytics
   */
  async getAnalytics() {
    try {
      const [
        registrationTrends,
        ingestionStats,
        processingStats,
        warehouseHealth
      ] = await Promise.all([
        this.dataWarehouse.getRegistrationTrends(30),
        this.ingestionService.getStats(),
        this.dataProcessor.getStats(),
        this.dataWarehouse.healthCheck()
      ]);

      return {
        pipeline: this.stats,
        ingestion: ingestionStats,
        processing: processingStats,
        warehouse: warehouseHealth,
        trends: registrationTrends
      };
      
    } catch (error) {
      logger.error('Error getting pipeline analytics', error);
      throw error;
    }
  }

  /**
   * Get pipeline status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      startTime: this.stats.startTime,
      totalRecordsProcessed: this.stats.totalRecordsProcessed,
      totalBatchesProcessed: this.stats.totalBatchesProcessed,
      errors: this.stats.errors,
      lastProcessedAt: this.stats.lastProcessedAt,
      components: {
        ingestion: this.ingestionService.healthCheck(),
        processing: this.dataProcessor.healthCheck(),
        warehouse: this.dataWarehouse.healthCheck()
      }
    };
  }

  /**
   * Health check for the entire pipeline
   */
  async healthCheck() {
    try {
      const componentHealth = await Promise.all([
        this.ingestionService.healthCheck(),
        this.dataProcessor.healthCheck(),
        this.dataWarehouse.healthCheck()
      ]);

      const allHealthy = componentHealth.every(health => 
        health.status === 'healthy' || health.status === 'not_initialized'
      );

      return {
        status: allHealthy ? 'healthy' : 'degraded',
        isRunning: this.isRunning,
        components: {
          ingestion: componentHealth[0],
          processing: componentHealth[1],
          warehouse: componentHealth[2]
        },
        uptime: this.stats.startTime ? 
          Date.now() - new Date(this.stats.startTime).getTime() : 0
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Reset pipeline statistics
   */
  resetStats() {
    this.stats = {
      startTime: this.stats.startTime,
      totalRecordsProcessed: 0,
      totalBatchesProcessed: 0,
      errors: 0,
      lastProcessedAt: null
    };
    
    this.dataProcessor.resetStats();
  }
}

export default PipelineOrchestrator;
