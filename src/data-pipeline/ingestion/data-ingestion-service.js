/**
 * Data Ingestion Service
 * Handles real-time and batch data ingestion from multiple sources
 */

import { EventEmitter } from 'events';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../../lib/firebase.js';
import logger from '../../utils/logger.js';
import { PIPELINE_CONFIG } from '../config/pipeline-config.js';

class DataIngestionService extends EventEmitter {
  constructor(config = PIPELINE_CONFIG) {
    super();
    this.config = config;
    this.activeListeners = new Map();
    this.batchBuffer = new Map();
    this.isRunning = false;
    this.stats = {
      recordsIngested: 0,
      errorsCount: 0,
      lastIngestTime: null,
      sourcesActive: 0
    };
  }

  /**
   * Start the data ingestion service
   */
  async start() {
    try {
      logger.info('Starting Data Ingestion Service');
      this.isRunning = true;

      // Start real-time listeners
      await this.startFirebaseListeners();

      // Start batch ingestion jobs
      await this.startBatchJobs();

      // Start QR scan stream processing
      await this.startQRScanStream();

      this.stats.sourcesActive = this.activeListeners.size;
      logger.info('Data Ingestion Service started successfully', {
        activeSources: this.stats.sourcesActive
      });

      this.emit('started');
    } catch (error) {
      logger.error('Failed to start Data Ingestion Service', error);
      throw error;
    }
  }

  /**
   * Stop the data ingestion service
   */
  async stop() {
    try {
      logger.info('Stopping Data Ingestion Service');
      this.isRunning = false;

      // Stop all Firebase listeners
      for (const [path, unsubscribe] of this.activeListeners) {
        unsubscribe();
        logger.debug(`Stopped listener for: ${path}`);
      }
      this.activeListeners.clear();

      // Flush remaining batches
      await this.flushAllBatches();

      this.stats.sourcesActive = 0;
      logger.info('Data Ingestion Service stopped');
      this.emit('stopped');
    } catch (error) {
      logger.error('Error stopping Data Ingestion Service', error);
      throw error;
    }
  }

  /**
   * Start Firebase real-time listeners
   */
  async startFirebaseListeners() {
    const collections = this.config.sources.firebase.collections;

    for (const collection of collections) {
      await this.setupFirebaseListener(collection);
    }
  }

  /**
   * Setup listener for a specific Firebase collection
   */
  async setupFirebaseListener(collection) {
    try {
      const dbRef = ref(database, collection);

      const unsubscribe = onValue(dbRef, (snapshot) => {
        this.handleFirebaseData(collection, snapshot);
      }, (error) => {
        logger.error(`Firebase listener error for ${collection}`, error);
      });

      this.activeListeners.set(collection, unsubscribe);
      logger.log(`Firebase listener started for: ${collection}`);
    } catch (error) {
      logger.error(`Failed to setup Firebase listener for ${collection}`, error);
      throw error;
    }
  }

  /**
   * Handle incoming Firebase data
   */
  handleFirebaseData(collection, snapshot) {
    try {
      if (!snapshot.exists()) {
        return;
      }

      const data = snapshot.val();
      const records = this.normalizeFirebaseData(collection, data);

      // Process records
      for (const record of records) {
        this.ingestRecord(collection, record);
      }

      metrics.gauge(`ingestion.firebase.${collection}.records`, records.length);
      logger.debug(`Processed ${records.length} records from ${collection}`);

    } catch (error) {
      logger.error(`Error processing Firebase data for ${collection}`, error);
      metrics.increment('ingestion.firebase.processing_errors', { collection });
    }
  }

  /**
   * Normalize Firebase data structure
   */
  normalizeFirebaseData(collection, data) {
    const records = [];

    if (typeof data === 'object' && data !== null) {
      for (const [id, record] of Object.entries(data)) {
        records.push({
          id,
          ...record,
          _source: 'firebase',
          _collection: collection,
          _ingested_at: new Date().toISOString()
        });
      }
    }

    return records;
  }

  /**
   * Ingest a single record
   */
  async ingestRecord(source, record) {
    try {
      // Add metadata
      const enrichedRecord = {
        ...record,
        _pipeline_id: this.generatePipelineId(),
        _ingested_at: new Date().toISOString(),
        _source: source
      };

      // Emit for real-time processing
      this.emit('record', enrichedRecord);

      // Add to batch buffer
      this.addToBatch(source, enrichedRecord);

      this.stats.recordsIngested++;
      this.stats.lastIngestTime = new Date().toISOString();

      metrics.increment('ingestion.records.total', { source });

    } catch (error) {
      logger.error('Error ingesting record', error, { source, recordId: record.id });
      this.stats.errorsCount++;
      metrics.increment('ingestion.records.errors', { source });
    }
  }

  /**
   * Add record to batch buffer
   */
  addToBatch(source, record) {
    if (!this.batchBuffer.has(source)) {
      this.batchBuffer.set(source, []);
    }

    const batch = this.batchBuffer.get(source);
    batch.push(record);

    // Check if batch is full
    const batchSize = this.config.sources.firebase.batchSize;
    if (batch.length >= batchSize) {
      this.flushBatch(source);
    }
  }

  /**
   * Flush batch for a specific source
   */
  async flushBatch(source) {
    const batch = this.batchBuffer.get(source);
    if (!batch || batch.length === 0) {
      return;
    }

    try {
      logger.debug(`Flushing batch for ${source}`, { recordCount: batch.length });

      // Emit batch for processing
      this.emit('batch', {
        source,
        records: [...batch],
        timestamp: new Date().toISOString()
      });

      // Clear batch
      this.batchBuffer.set(source, []);

      metrics.increment('ingestion.batches.flushed', { source });
      metrics.gauge(`ingestion.batch.${source}.size`, batch.length);

    } catch (error) {
      logger.error(`Error flushing batch for ${source}`, error);
      metrics.increment('ingestion.batches.errors', { source });
    }
  }

  /**
   * Flush all pending batches
   */
  async flushAllBatches() {
    const sources = Array.from(this.batchBuffer.keys());

    for (const source of sources) {
      await this.flushBatch(source);
    }
  }

  /**
   * Start batch ingestion jobs
   */
  async startBatchJobs() {
    // Google Sheets sync job
    setInterval(async () => {
      if (this.isRunning) {
        await this.ingestGoogleSheetsData();
      }
    }, 15 * 60 * 1000); // Every 15 minutes

    // Email logs ingestion
    setInterval(async () => {
      if (this.isRunning) {
        await this.ingestEmailLogs();
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Ingest Google Sheets data
   */
  async ingestGoogleSheetsData() {
    return await instrument('ingestion.google_sheets', async () => {
      try {
        logger.info('Starting Google Sheets data ingestion');

        // This would integrate with your existing Google Sheets service
        // For now, we'll emit a placeholder event
        this.emit('sheets_sync_requested');

        metrics.increment('ingestion.google_sheets.syncs');
      } catch (error) {
        logger.error('Error ingesting Google Sheets data', error);
        metrics.increment('ingestion.google_sheets.errors');
      }
    });
  }

  /**
   * Ingest email service logs
   */
  async ingestEmailLogs() {
    return await instrument('ingestion.email_logs', async () => {
      try {
        logger.info('Starting email logs ingestion');

        // This would read from your email service logs
        // For now, we'll emit a placeholder event
        this.emit('email_logs_requested');

        metrics.increment('ingestion.email_logs.syncs');
      } catch (error) {
        logger.error('Error ingesting email logs', error);
        metrics.increment('ingestion.email_logs.errors');
      }
    });
  }

  /**
   * Start QR scan stream processing
   */
  async startQRScanStream() {
    // This would process real-time QR scan events
    logger.info('QR scan stream processing started');
  }

  /**
   * Generate unique pipeline ID
   */
  generatePipelineId() {
    return `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get ingestion statistics
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      activeListeners: this.activeListeners.size,
      batchBufferSizes: Object.fromEntries(
        Array.from(this.batchBuffer.entries()).map(([source, batch]) => [source, batch.length])
      )
    };
  }

  /**
   * Health check
   */
  healthCheck() {
    return {
      status: this.isRunning ? 'healthy' : 'stopped',
      uptime: this.stats.lastIngestTime,
      activeSources: this.stats.sourcesActive,
      totalRecords: this.stats.recordsIngested,
      errorRate: this.stats.errorsCount / Math.max(this.stats.recordsIngested, 1)
    };
  }
}

export default DataIngestionService;
