/**
 * Data Pipeline Dashboard Component
 * Provides monitoring and control interface for the data pipeline
 */

import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';
import styles from './DataPipelineDashboard.module.css';
import AnalyticsCharts from './AnalyticsCharts';
import pipelineDataService from '../services/pipelineDataService';

const DataPipelineDashboard = () => {
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch pipeline status from real data
  const fetchPipelineStatus = async () => {
    try {
      logger.log('Fetching pipeline status from real data...');
      const result = await pipelineDataService.getPipelineStatus();

      if (result.success) {
        setPipelineStatus(result.data);
        logger.log('Pipeline status loaded successfully');
      } else {
        setError(result.error);
        logger.error('Failed to load pipeline status:', result.error);
      }
    } catch (err) {
      logger.error('Error fetching pipeline status:', err.message || err);
      setError('Failed to load pipeline status');
    }
  };

  // Fetch analytics from real data
  const fetchAnalytics = async () => {
    try {
      logger.log('Fetching analytics from real data...');
      const result = await pipelineDataService.getAnalytics();

      if (result.success) {
        setAnalytics(result.data);
        logger.log('Analytics loaded successfully');
      } else {
        setError(result.error);
        logger.error('Failed to load analytics:', result.error);
      }
    } catch (err) {
      logger.error('Error fetching analytics:', err.message || err);
      setError('Failed to load analytics');
    }
  };

  // Start pipeline
  const startPipeline = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await pipelineDataService.simulateOperation('start');

      if (result.success) {
        // Refresh data to get updated status
        await fetchPipelineStatus();
        logger.log('Pipeline started successfully');
      } else {
        setError(result.error);
      }
    } catch (err) {
      logger.error('Error starting pipeline:', err.message || err);
      setError('Failed to start pipeline');
    } finally {
      setLoading(false);
    }
  };

  // Stop pipeline
  const stopPipeline = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await pipelineDataService.simulateOperation('stop');

      if (result.success) {
        // Refresh data to get updated status
        await fetchPipelineStatus();
        logger.log('Pipeline stopped successfully');
      } else {
        setError(result.error);
      }
    } catch (err) {
      logger.error('Error stopping pipeline:', err.message || err);
      setError('Failed to stop pipeline');
    } finally {
      setLoading(false);
    }
  };

  // Trigger manual run
  const triggerManualRun = async () => {
    try {
      setError(null);

      const result = await pipelineDataService.simulateOperation('manual_run');

      if (result.success) {
        // Refresh all data to show updated counts
        await Promise.all([fetchPipelineStatus(), fetchAnalytics()]);
        logger.log('Manual pipeline run completed successfully');
      } else {
        setError(result.error);
      }
    } catch (err) {
      logger.error('Error triggering manual run:', err.message || err);
      setError('Failed to trigger manual run');
    }
  };



  // Initial load and polling
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPipelineStatus(), fetchAnalytics()]);
      setLoading(false);
    };

    loadData();

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchPipelineStatus();
      fetchAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading && !pipelineStatus) {
    return (
      <div className={`${styles['pipeline-dashboard']} ${styles.loading}`}>
        <div className={styles['loading-spinner']}></div>
        <p>Loading pipeline dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles['pipeline-dashboard']}>
      <div className={styles['dashboard-header']}>
        <h2>📊 Data Pipeline Dashboard - Live Data</h2>
        <div className={styles['pipeline-controls']}>
          {pipelineStatus?.isRunning ? (
            <button
              onClick={stopPipeline}
              className={`${styles.btn} ${styles['btn-danger']}`}
              disabled={loading}
            >
              🛑 Stop Pipeline
            </button>
          ) : (
            <button
              onClick={startPipeline}
              className={`${styles.btn} ${styles['btn-success']}`}
              disabled={loading}
            >
              ▶️ Start Pipeline
            </button>
          )}
          <button
            onClick={triggerManualRun}
            className={`${styles.btn} ${styles['btn-secondary']}`}
            disabled={loading || !pipelineStatus?.isRunning}
          >
            🔄 Manual Run
          </button>
        </div>
      </div>

      {error && (
        <div className={styles['error-message']}>
          <p>❌ {error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Pipeline Status */}
      <div className={styles['status-section']}>
        <h3>Pipeline Status</h3>
        <div className={styles['status-grid']}>
          <div className={styles['status-card']}>
            <div className={styles['status-indicator']}>
              <span className={`${styles['status-dot']} ${pipelineStatus?.isRunning ? styles.running : styles.stopped}`}></span>
              <span className={styles['status-text']}>
                {pipelineStatus?.isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
            <div className={styles['status-details']}>
              {pipelineStatus?.startTime && (
                <p>Started: {new Date(pipelineStatus.startTime).toLocaleString()}</p>
              )}
              {pipelineStatus?.lastProcessedAt && (
                <p>Last Processed: {new Date(pipelineStatus.lastProcessedAt).toLocaleString()}</p>
              )}
            </div>
          </div>

          <div className={styles['metrics-card']}>
            <h4>Processing Metrics</h4>
            <div className={styles['metrics-grid']}>
              <div className={styles.metric}>
                <span className={styles['metric-value']}>{pipelineStatus?.totalRecordsProcessed || 0}</span>
                <span className={styles['metric-label']}>Records Processed</span>
              </div>
              <div className={styles.metric}>
                <span className={styles['metric-value']}>{pipelineStatus?.totalBatchesProcessed || 0}</span>
                <span className={styles['metric-label']}>Batches Processed</span>
              </div>
              <div className={styles.metric}>
                <span className={styles['metric-value']}>{pipelineStatus?.errors || 0}</span>
                <span className={styles['metric-label']}>Errors</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Component Health */}
      <div className={styles['health-section']}>
        <h3>Component Health</h3>
        <div className={styles['health-grid']}>
          {pipelineStatus?.components && Object.entries(pipelineStatus.components).map(([component, health]) => (
            <div key={component} className={styles['health-card']}>
              <div className={styles['health-header']}>
                <span className={styles['component-name']}>{component}</span>
                <span className={`${styles['health-status']} ${styles[health.status]}`}>
                  {health.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className={styles['analytics-section']}>
          <h3>📊 Analytics & Insights</h3>
          <AnalyticsCharts analytics={analytics} />
        </div>
      )}


    </div>
  );
};

export default DataPipelineDashboard;
