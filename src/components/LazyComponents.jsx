import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';

// Loading component
const LoadingSpinner = ({ message = 'Loading...' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
      color: 'var(--text-secondary)'
    }}
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(255, 255, 255, 0.1)',
        borderTop: '3px solid var(--primary)',
        borderRadius: '50%',
        marginBottom: '1rem'
      }}
    />
    <div style={{ fontSize: '0.9rem' }}>{message}</div>
  </motion.div>
);

// Lazy load heavy components
export const LazyAdminDashboard = lazy(() =>
  import('./AdminDashboard').then(module => ({ default: module.default }))
);

export const LazyClubDashboard = lazy(() =>
  import('./ClubDashboard').then(module => ({ default: module.default }))
);

export const LazyQRScanner = lazy(() =>
  import('./QRScanner').then(module => ({ default: module.default }))
);

export const LazyAttendanceManagement = lazy(() =>
  import('./AttendanceManagement').then(module => ({ default: module.default }))
);

export const LazyDataPipelineDashboard = lazy(() =>
  import('./DataPipelineDashboard').then(module => ({ default: module.default }))
);

export const LazyEventAutomationDashboard = lazy(() =>
  import('./EventAutomationDashboard').then(module => ({ default: module.default }))
);

export const LazyAutoCreatedSheetsViewer = lazy(() =>
  import('./AutoCreatedSheetsViewer').then(module => ({ default: module.default }))
);

export const LazyGalleryManager = lazy(() =>
  import('./GalleryManager').then(module => ({ default: module.default }))
);

export const LazyAnalyticsCharts = lazy(() =>
  import('./AnalyticsCharts').then(module => ({ default: module.default }))
);

export const LazyEventCreationForm = lazy(() =>
  import('./EventCreationForm').then(module => ({ default: module.default }))
);

export const LazyAdminEventEditor = lazy(() =>
  import('./AdminEventEditor').then(module => ({ default: module.default }))
);

export const LazyAdminClubEditor = lazy(() =>
  import('./AdminClubEditor').then(module => ({ default: module.default }))
);

export const LazyClubProfileEditor = lazy(() =>
  import('./ClubProfileEditor').then(module => ({ default: module.default }))
);

export const LazyEventEditor = lazy(() =>
  import('./EventEditor').then(module => ({ default: module.default }))
);

// Wrapper components with Suspense
export const AdminDashboard = (props) => (
  <Suspense fallback={<LoadingSpinner message="Loading Admin Dashboard..." />}>
    <LazyAdminDashboard {...props} />
  </Suspense>
);

export const ClubDashboard = (props) => (
  <Suspense fallback={<LoadingSpinner message="Loading Club Dashboard..." />}>
    <LazyClubDashboard {...props} />
  </Suspense>
);

export const QRScanner = (props) => (
  <Suspense fallback={<LoadingSpinner message="Loading QR Scanner..." />}>
    <LazyQRScanner {...props} />
  </Suspense>
);

export const AttendanceManagement = (props) => (
  <Suspense fallback={<LoadingSpinner message="Loading Attendance Management..." />}>
    <LazyAttendanceManagement {...props} />
  </Suspense>
);

export const DataPipelineDashboard = (props) => (
  <Suspense fallback={<LoadingSpinner message="Loading Data Pipeline..." />}>
    <LazyDataPipelineDashboard {...props} />
  </Suspense>
);

export const EventAutomationDashboard = (props) => (
  <Suspense fallback={<LoadingSpinner message="Loading Automation Dashboard..." />}>
    <LazyEventAutomationDashboard {...props} />
  </Suspense>
);

export const AutoCreatedSheetsViewer = (props) => (
  <Suspense fallback={<LoadingSpinner message="Loading Sheets Viewer..." />}>
    <LazyAutoCreatedSheetsViewer {...props} />
  </Suspense>
);

export const GalleryManager = (props) => (
  <Suspense fallback={<LoadingSpinner message="Loading Gallery Manager..." />}>
    <LazyGalleryManager {...props} />
  </Suspense>
);

export const AnalyticsCharts = (props) => (
  <Suspense fallback={<LoadingSpinner message="Loading Analytics..." />}>
    <LazyAnalyticsCharts {...props} />
  </Suspense>
);

export const EventCreationForm = (props) => (
  <Suspense fallback={<LoadingSpinner message="Loading Event Creation Form..." />}>
    <LazyEventCreationForm {...props} />
  </Suspense>
);

export const AdminEventEditor = (props) => (
  <Suspense fallback={<LoadingSpinner message="Loading Event Editor..." />}>
    <LazyAdminEventEditor {...props} />
  </Suspense>
);

export const AdminClubEditor = (props) => (
  <Suspense fallback={<LoadingSpinner message="Loading Club Editor..." />}>
    <LazyAdminClubEditor {...props} />
  </Suspense>
);

export const ClubProfileEditor = (props) => (
  <Suspense fallback={<LoadingSpinner message="Loading Profile Editor..." />}>
    <LazyClubProfileEditor {...props} />
  </Suspense>
);

export const EventEditor = (props) => (
  <Suspense fallback={<LoadingSpinner message="Loading Event Editor..." />}>
    <LazyEventEditor {...props} />
  </Suspense>
);

// Performance monitoring wrapper
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return function PerformanceMonitoredComponent(props) {
    const startTime = performance.now();

    const handleLoad = () => {
      const endTime = performance.now();
      console.log(`${componentName} render time: ${(endTime - startTime).toFixed(2)}ms`);
    };

    return (
      <div onLoad={handleLoad}>
        <WrappedComponent {...props} />
      </div>
    );
  };
};

// Memoized components for better performance
export const MemoizedLoadingSpinner = React.memo(LoadingSpinner);

export default {
  AdminDashboard,
  ClubDashboard,
  QRScanner,
  AttendanceManagement,
  DataPipelineDashboard,
  EventAutomationDashboard,
  AutoCreatedSheetsViewer,
  GalleryManager,
  AnalyticsCharts,
  EventCreationForm,
  AdminEventEditor,
  AdminClubEditor,
  ClubProfileEditor,
  EventEditor,
  LoadingSpinner: MemoizedLoadingSpinner,
  withPerformanceMonitoring
};
