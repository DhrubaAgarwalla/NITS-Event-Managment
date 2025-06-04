# 📊 Event Manager Data Pipeline

A production-ready data pipeline system for real-time data processing, analytics, and machine learning feature engineering.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Data Sources  │───▶│  Ingestion Layer │───▶│   Processing    │
│                 │    │                  │    │                 │
│ • Firebase      │    │ • Real-time      │    │ • Validation    │
│ • Google Sheets │    │ • Batch Jobs     │    │ • Transformation│
│ • QR Scans      │    │ • Event Streams  │    │ • Feature Eng.  │
│ • Email Logs    │    │ • Webhooks       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
┌─────────────────┐    ┌──────────────────┐             │
│  Data Products  │◀───│  Storage Layer   │◀────────────┘
│                 │    │                  │
│ • Dashboards    │    │ • Data Warehouse │
│ • ML APIs       │    │ • Feature Store  │
│ • Reports       │    │ • Data Lake      │
│ • Alerts        │    │ • Model Registry │
└─────────────────┘    └──────────────────┘
```

## 🚀 Features

### Data Ingestion
- **Real-time Firebase listeners** for live data streaming
- **Batch processing** for historical data and external sources
- **Event-driven architecture** with automatic scaling
- **Error handling and retry logic** for reliability

### Data Processing
- **Schema validation** with configurable rules
- **Data transformation** and normalization
- **Feature engineering** for ML models
- **Data quality monitoring** and alerting

### Storage & Analytics
- **Data warehouse** with optimized schema for analytics
- **Feature store** for ML model training and serving
- **Query interface** for custom analytics
- **Performance monitoring** and optimization

### Monitoring & Operations
- **Real-time dashboard** for pipeline monitoring
- **Health checks** and alerting
- **Performance metrics** and analytics
- **API endpoints** for management and control

## 📁 Project Structure

```
src/data-pipeline/
├── config/
│   └── pipeline-config.js          # Configuration management
├── ingestion/
│   └── data-ingestion-service.js   # Data ingestion from sources
├── processing/
│   └── data-processor.js           # Data validation & transformation
├── storage/
│   └── data-warehouse.js           # Data warehouse management
├── api/
│   └── pipeline-api.js             # REST API endpoints
├── integration/
│   └── pipeline-integration.js     # Integration with existing services
├── pipeline-orchestrator.js        # Main pipeline coordinator
└── README.md                       # This file
```

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
npm install sqlite3 sqlite express
```

### 2. Configure Pipeline

Edit `config/pipeline-config.js` to match your environment:

```javascript
export const PIPELINE_CONFIG = {
  storage: {
    dataWarehouse: {
      path: './data/warehouse.db'  // Adjust path as needed
    }
  },
  // ... other configurations
};
```

### 3. Initialize Pipeline

```javascript
import pipelineIntegration from './data-pipeline/integration/pipeline-integration.js';

// Initialize the pipeline
await pipelineIntegration.initialize();
```

### 4. Add API Routes

In your main server file:

```javascript
import pipelineAPI from './data-pipeline/api/pipeline-api.js';

app.use('/api/pipeline', pipelineAPI);
```

### 5. Add Dashboard Component

```jsx
import DataPipelineDashboard from './components/DataPipelineDashboard.jsx';

// Add to your admin dashboard
<DataPipelineDashboard />
```

## 📊 Usage Examples

### Starting the Pipeline

```javascript
// Via API
POST /api/pipeline/start

// Via Integration
await pipelineIntegration.initialize();
```

### Monitoring Pipeline Status

```javascript
// Get status
GET /api/pipeline/status

// Get health check
GET /api/pipeline/health

// Get analytics
GET /api/pipeline/analytics
```

### Custom Queries

```javascript
// Query the data warehouse
POST /api/pipeline/query
{
  "sql": "SELECT COUNT(*) as total_registrations FROM fact_registrations WHERE created_at >= date('now', '-7 days')",
  "params": []
}
```

### Event Analytics

```javascript
// Get analytics for specific event
GET /api/pipeline/events/{eventId}/analytics
```

## 🔧 Configuration Options

### Data Sources
- **Firebase Collections**: Configure which collections to monitor
- **Batch Intervals**: Set frequency for batch processing
- **Buffer Sizes**: Control memory usage and performance

### Processing Rules
- **Validation Rules**: Define data quality requirements
- **Transformation Logic**: Configure data normalization
- **Feature Engineering**: Enable/disable ML feature generation

### Storage Settings
- **Database Provider**: SQLite, PostgreSQL, BigQuery
- **Partitioning Strategy**: Date-based, size-based
- **Retention Policies**: Data lifecycle management

## 📈 Analytics & Insights

### Built-in Analytics
- **Registration Trends**: Daily/weekly registration patterns
- **Attendance Rates**: Event performance metrics
- **Revenue Analytics**: Payment and financial insights
- **User Engagement**: Participant behavior analysis

### Custom Analytics
- **SQL Interface**: Write custom queries
- **Data Export**: CSV, JSON, Excel formats
- **API Access**: Programmatic data access
- **Real-time Dashboards**: Live metric updates

## 🤖 Machine Learning Integration

### Feature Engineering
- **Time-based Features**: Registration timing, event scheduling
- **User Features**: Engagement scores, behavior patterns
- **Event Features**: Popularity metrics, success indicators
- **Payment Features**: Transaction patterns, revenue metrics

### Model Support
- **Attendance Prediction**: Forecast event attendance
- **Fraud Detection**: Identify suspicious registrations
- **Recommendation Engine**: Suggest relevant events
- **Revenue Optimization**: Pricing and capacity planning

## 🔍 Monitoring & Alerting

### Health Monitoring
- **Component Health**: Individual service status
- **Performance Metrics**: Latency, throughput, errors
- **Data Quality**: Completeness, accuracy, consistency
- **Resource Usage**: Memory, CPU, storage

### Alerting
- **Error Alerts**: Pipeline failures and exceptions
- **Performance Alerts**: SLA violations and degradation
- **Data Quality Alerts**: Schema violations and anomalies
- **Business Alerts**: High-value events and trends

## 🚀 Deployment

### Development
```bash
npm run dev
# Pipeline starts automatically in development mode
```

### Production
```bash
npm run build
npm start
# Configure environment variables for production settings
```

### Environment Variables
```bash
NODE_ENV=production
PIPELINE_DB_PATH=/data/warehouse.db
PIPELINE_LOG_LEVEL=info
PIPELINE_BATCH_SIZE=1000
```

## 🔧 Troubleshooting

### Common Issues

1. **Pipeline Won't Start**
   - Check database permissions
   - Verify Firebase configuration
   - Review log files for errors

2. **Data Not Processing**
   - Check ingestion service status
   - Verify data source connections
   - Review validation rules

3. **Performance Issues**
   - Adjust batch sizes
   - Check database indexes
   - Monitor resource usage

### Debug Mode
```javascript
// Enable debug logging
process.env.PIPELINE_LOG_LEVEL = 'debug';
```

## 📚 API Reference

### Pipeline Management
- `GET /api/pipeline/status` - Get pipeline status
- `POST /api/pipeline/start` - Start pipeline
- `POST /api/pipeline/stop` - Stop pipeline
- `POST /api/pipeline/trigger` - Trigger manual run

### Analytics
- `GET /api/pipeline/analytics` - Get pipeline analytics
- `GET /api/pipeline/metrics` - Get detailed metrics
- `POST /api/pipeline/query` - Execute custom queries

### Health & Monitoring
- `GET /api/pipeline/health` - Health check
- `POST /api/pipeline/reset-stats` - Reset statistics

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Follow error handling patterns
5. Use structured logging

## 📄 License

This data pipeline is part of the Event Manager project and follows the same license terms.
