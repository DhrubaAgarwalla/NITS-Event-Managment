/**
 * Analytics Charts Component
 * Professional charts using Recharts library
 */

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import styles from './AnalyticsCharts.module.css';
import pipelineDataService from '../services/pipelineDataService';

const AnalyticsCharts = ({ analytics }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [trendsData, setTrendsData] = useState(analytics?.trends || []);
  const [dataQualityStats, setDataQualityStats] = useState(analytics?.processing || {});
  const [loading, setLoading] = useState(false);

  if (!analytics) return null;

  // Handle period change for all data
  const handlePeriodChange = async (period) => {
    setLoading(true);
    setSelectedPeriod(period);
    try {
      // Fetch trends data for the selected period
      const newTrends = await pipelineDataService.getRegistrationTrendsForPeriod(period);
      setTrendsData(newTrends);

      // Fetch data quality stats for the selected period
      const newDataQuality = await pipelineDataService.getProcessingStatsForPeriod(period);
      setDataQualityStats(newDataQuality);
    } catch (error) {
      console.error('Error fetching data for period:', error);
    } finally {
      setLoading(false);
    }
  };

  // Colors for charts
  const colors = {
    primary: '#6c5ce7',
    success: '#00b894',
    warning: '#fdcb6e',
    danger: '#e17055',
    info: '#74b9ff'
  };

  // Custom tooltip for registration trends
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{`Date: ${label}`}</p>
          <p className={styles.tooltipValue}>
            {`Registrations: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pipeline health overview
  const PipelineHealthTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{`${label}`}</p>
          <p className={styles.tooltipValue}>
            {`Value: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Processing statistics pie chart data
  const processingData = analytics.processing ? [
    { name: 'Processed', value: analytics.processing.recordsProcessed, color: colors.success },
    { name: 'Validation Errors', value: analytics.processing.validationErrors, color: colors.warning },
    { name: 'Transform Errors', value: analytics.processing.transformationErrors || 0, color: colors.danger }
  ] : [];

  // Component health data
  const healthData = analytics.pipeline ? [
    { name: 'Total Records', value: analytics.pipeline.totalRecordsProcessed, color: colors.primary },
    { name: 'Batches', value: analytics.pipeline.totalBatchesProcessed, color: colors.info },
    { name: 'Errors', value: analytics.pipeline.errors, color: colors.danger }
  ] : [];

  return (
    <div className={styles.analyticsCharts}>
      {/* Universal Time Period Selector */}
      <div className={styles.universalHeader}>
        <h3>📊 Analytics Dashboard</h3>
        <div className={styles.universalPeriodSelector}>
          <span className={styles.selectorLabel}>Time Period:</span>
          {['today', 'week', 'month', 'year', 'allTime'].map((period) => (
            <button
              key={period}
              className={`${styles.periodBtn} ${selectedPeriod === period ? styles.active : ''}`}
              onClick={() => handlePeriodChange(period)}
              disabled={loading}
            >
              {period === 'allTime' ? 'All Time' :
               period === 'today' ? 'Today' :
               period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Top Events by Registration */}
      {analytics.topEvents && (
        <div className={styles.chartContainer}>
          <div className={styles.chartHeader}>
            <h4>🏆 Top Events by Registration</h4>
          </div>

          {analytics.topEvents[selectedPeriod]?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={analytics.topEvents[selectedPeriod]}
                margin={{ top: 15, right: 15, left: 15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="event.title"
                  stroke="#666"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  interval={0}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => {
                    // Truncate long event titles for mobile
                    return value.length > 15 ? value.substring(0, 15) + '...' : value;
                  }}
                />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className={styles.tooltip}>
                          <p className={styles.tooltipLabel}>{data.event.title}</p>
                          <p className={styles.tooltipValue}>Registrations: {data.registrations}</p>
                          {data.event.start_date && (
                            <p className={styles.tooltipDate}>Date: {new Date(data.event.start_date).toLocaleDateString()}</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="registrations"
                  fill={colors.success}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.noData}>
              <p>No events found for {selectedPeriod === 'allTime' ? 'all time' :
                                     selectedPeriod === 'today' ? 'today' :
                                     `this ${selectedPeriod}`}</p>
            </div>
          )}
        </div>
      )}

      {/* Registration Trends Line Chart */}
      {trendsData && trendsData.length > 0 && (
        <div className={styles.chartContainer}>
          <div className={styles.chartHeader}>
            <h4>📈 Registration Trends</h4>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendsData} margin={{ top: 15, right: 15, left: 15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                stroke="#666"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={50}
                tick={{ fontSize: 10 }}
              />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="registrations"
                stroke={colors.primary}
                strokeWidth={3}
                dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors.primary, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data Quality Overview */}
      {dataQualityStats && (
        <div className={styles.chartContainer}>
          <div className={styles.chartHeader}>
            <h4>🔄 Data Quality Overview</h4>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{dataQualityStats.recordsProcessed || 0}</div>
              <div className={styles.statLabel}>Total Records</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{dataQualityStats.featuresGenerated || 0}</div>
              <div className={styles.statLabel}>Successfully Processed</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{dataQualityStats.validationErrors || 0}</div>
              <div className={styles.statLabel}>Validation Issues</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {dataQualityStats.recordsProcessed > 0
                  ? ((dataQualityStats.featuresGenerated / dataQualityStats.recordsProcessed) * 100).toFixed(1)
                  : 0}%
              </div>
              <div className={styles.statLabel}>Success Rate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCharts;
