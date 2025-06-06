/**
 * Data Pipeline Configuration
 * Centralized configuration for all data pipeline components
 */

export const PIPELINE_CONFIG = {
  // Data Sources
  sources: {
    firebase: {
      collections: ['events', 'registrations', 'clubs', 'categories'],
      realTimeEnabled: true,
      batchSize: 1000
    },
    googleSheets: {
      syncInterval: '*/15 * * * *', // Every 15 minutes
      maxRetries: 3
    },
    emailLogs: {
      logLevel: 'info',
      retention: '30d'
    },
    qrScans: {
      bufferSize: 100,
      flushInterval: 5000 // 5 seconds
    }
  },

  // Processing Configuration
  processing: {
    validation: {
      strictMode: true,
      skipInvalidRecords: false,
      validationRules: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^\+?[\d\s-()]+$/,
        required: ['participant_name', 'participant_email', 'event_id']
      }
    },
    transformation: {
      dateFormat: 'ISO',
      timezone: 'Asia/Kolkata',
      normalizeText: true,
      extractFeatures: true
    },
    featureEngineering: {
      enabled: true,
      features: [
        'registration_velocity',
        'user_engagement_score',
        'event_popularity_index',
        'attendance_probability'
      ]
    }
  },

  // Storage Configuration
  storage: {
    dataLake: {
      provider: 'local', // Can be 'aws-s3', 'gcp-storage', etc.
      path: './data/raw',
      partitioning: 'date',
      compression: 'gzip'
    },
    dataWarehouse: {
      provider: 'sqlite', // Can be 'postgresql', 'bigquery', etc.
      path: './data/warehouse.db',
      tables: {
        events: 'dim_events',
        registrations: 'fact_registrations',
        attendance: 'fact_attendance',
        analytics: 'agg_analytics'
      }
    },
    featureStore: {
      provider: 'local',
      path: './data/features',
      format: 'parquet'
    }
  },

  // ML Pipeline Configuration
  ml: {
    models: {
      attendancePrediction: {
        algorithm: 'random_forest',
        features: ['event_type', 'day_of_week', 'hour', 'weather', 'historical_avg'],
        target: 'attendance_rate',
        retrainInterval: '0 2 * * 0' // Weekly at 2 AM Sunday
      },
      fraudDetection: {
        algorithm: 'isolation_forest',
        features: ['registration_speed', 'email_pattern', 'payment_behavior'],
        threshold: 0.1,
        retrainInterval: '0 3 * * *' // Daily at 3 AM
      },
      recommendation: {
        algorithm: 'collaborative_filtering',
        features: ['user_history', 'event_similarity', 'category_preference'],
        updateInterval: '0 1 * * *' // Daily at 1 AM
      }
    },
    deployment: {
      environment: 'production',
      apiEndpoint: '/api/ml',
      monitoring: true,
      logging: true
    }
  },

  // Monitoring and Alerting
  monitoring: {
    metrics: {
      dataQuality: ['completeness', 'accuracy', 'consistency', 'timeliness'],
      performance: ['latency', 'throughput', 'error_rate'],
      business: ['registration_rate', 'attendance_rate', 'revenue']
    },
    alerts: {
      dataQualityThreshold: 0.95,
      performanceThreshold: {
        latency: 5000, // 5 seconds
        errorRate: 0.01 // 1%
      },
      channels: ['email', 'slack', 'dashboard']
    },
    retention: {
      metrics: '90d',
      logs: '30d',
      alerts: '7d'
    }
  },

  // Scheduling
  scheduling: {
    timezone: 'Asia/Kolkata',
    jobs: {
      dataIngestion: '0 8 * * *', // Daily at 8 AM
      dataProcessing: '*/10 * * * *', // Every 10 minutes
      featureEngineering: '0 */1 * * *', // Every hour
      modelTraining: '0 2 * * 0', // Weekly
      reportGeneration: '0 8 * * 1', // Monday 8 AM
      dataCleanup: '0 0 * * 0' // Sunday midnight
    }
  },

  // API Configuration
  api: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // requests per window
    },
    authentication: {
      required: true,
      methods: ['jwt', 'api_key']
    },
    endpoints: {
      '/pipeline/status': { method: 'GET', auth: false },
      '/pipeline/trigger': { method: 'POST', auth: true },
      '/pipeline/metrics': { method: 'GET', auth: true },
      '/ml/predict': { method: 'POST', auth: true },
      '/ml/retrain': { method: 'POST', auth: true }
    }
  }
};

// Environment-specific overrides
export const getConfig = (environment = 'development') => {
  const config = { ...PIPELINE_CONFIG };

  switch (environment) {
    case 'production':
      config.storage.dataLake.provider = 'aws-s3';
      config.storage.dataWarehouse.provider = 'postgresql';
      config.monitoring.alerts.channels = ['email', 'slack', 'pagerduty'];
      break;

    case 'staging':
      config.processing.validation.strictMode = false;
      config.ml.deployment.environment = 'staging';
      break;

    case 'development':
      config.sources.firebase.batchSize = 100;
      config.monitoring.alerts.channels = ['console'];
      break;
  }

  return config;
};

// Validation function
export const validateConfig = (config) => {
  const required = [
    'sources',
    'processing',
    'storage',
    'ml',
    'monitoring',
    'scheduling'
  ];

  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required configuration: ${key}`);
    }
  }

  return true;
};

export default PIPELINE_CONFIG;
