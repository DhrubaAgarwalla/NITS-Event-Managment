import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import performanceService from '../services/performanceService';

const PerformanceMonitor = ({ isVisible = false, onClose }) => {
  const [metrics, setMetrics] = useState({});
  const [grades, setGrades] = useState({});
  const [memoryUsage, setMemoryUsage] = useState(null);
  const [bundleAnalysis, setBundleAnalysis] = useState(null);

  useEffect(() => {
    if (isVisible) {
      updateMetrics();
      const interval = setInterval(updateMetrics, 2000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const updateMetrics = () => {
    const currentMetrics = performanceService.getMetrics();
    const currentGrades = performanceService.getPerformanceGrades(currentMetrics);
    const memory = performanceService.monitorMemoryUsage();
    const bundle = performanceService.getBundleAnalysis();

    setMetrics(currentMetrics);
    setGrades(currentGrades);
    setMemoryUsage(memory);
    setBundleAnalysis(bundle);
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'Good': return '#00ff33';
      case 'Needs Improvement': return '#ffaa00';
      case 'Poor': return '#ff3333';
      default: return '#888';
    }
  };

  const formatTime = (time) => {
    return time ? `${time.toFixed(2)}ms` : 'N/A';
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          zIndex: 10000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          style={{
            backgroundColor: 'var(--dark-surface)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              color: 'var(--text-primary)',
              margin: 0,
              fontSize: '1.5rem'
            }}>
              ⚡ Performance Monitor
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              ✕
            </button>
          </div>

          {/* Core Web Vitals */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
              Core Web Vitals
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{
                backgroundColor: 'var(--dark-bg)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Largest Contentful Paint
                </div>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  {formatTime(metrics.largestContentfulPaint)}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: getGradeColor(grades.lcp),
                  fontWeight: 'bold'
                }}>
                  {grades.lcp}
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--dark-bg)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  First Input Delay
                </div>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  {formatTime(metrics.firstInputDelay)}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: getGradeColor(grades.fid),
                  fontWeight: 'bold'
                }}>
                  {grades.fid}
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--dark-bg)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Cumulative Layout Shift
                </div>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  {metrics.cumulativeLayoutShift?.toFixed(4) || 'N/A'}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: getGradeColor(grades.cls),
                  fontWeight: 'bold'
                }}>
                  {grades.cls}
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--dark-bg)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  First Contentful Paint
                </div>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  {formatTime(metrics.firstContentfulPaint)}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: getGradeColor(grades.fcp),
                  fontWeight: 'bold'
                }}>
                  {grades.fcp}
                </div>
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          {memoryUsage && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
                Memory Usage
              </h3>
              <div style={{
                backgroundColor: 'var(--dark-bg)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Used Heap
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {memoryUsage.usedJSHeapSize}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Total Heap
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {memoryUsage.totalJSHeapSize}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Heap Limit
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {memoryUsage.jsHeapSizeLimit}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bundle Analysis */}
          {bundleAnalysis && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
                Bundle Analysis
              </h3>
              <div style={{
                backgroundColor: 'var(--dark-bg)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Scripts Loaded
                    </div>
                    <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                      {bundleAnalysis.totalScripts}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Stylesheets Loaded
                    </div>
                    <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                      {bundleAnalysis.totalStylesheets}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => performanceService.logPerformanceSummary()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Log to Console
            </button>
            <button
              onClick={updateMetrics}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Refresh
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PerformanceMonitor;
