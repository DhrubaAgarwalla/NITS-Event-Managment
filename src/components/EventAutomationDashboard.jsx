import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import eventService from '../services/eventService';
import eventAutomationService from '../services/eventAutomationService';
import { getEventAttentionItems } from '../utils/eventUtils';
import logger from '../utils/logger';

const EventAutomationDashboard = () => {
  const [events, setEvents] = useState([]);
  const [automationSummary, setAutomationSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [lastAutomationRun, setLastAutomationRun] = useState(null);

  // Fetch events and generate automation summary
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const eventsData = await eventService.getAllEvents();
        setEvents(eventsData || []);
        
        const summary = eventAutomationService.getAutomationSummary(eventsData || []);
        setAutomationSummary(summary);
        
        logger.log('Automation dashboard data loaded');
      } catch (error) {
        logger.error('Error loading automation dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Run all automation tasks
  const runAutomation = async () => {
    try {
      setRunningAutomation(true);
      logger.log('Running all automation tasks...');
      
      const results = await eventAutomationService.runAllAutomations(events);
      setLastAutomationRun({
        timestamp: new Date().toISOString(),
        results
      });
      
      // Refresh data after automation
      const updatedEvents = await eventService.getAllEvents();
      setEvents(updatedEvents || []);
      
      const summary = eventAutomationService.getAutomationSummary(updatedEvents || []);
      setAutomationSummary(summary);
      
      logger.log('Automation completed successfully', results);
    } catch (error) {
      logger.error('Error running automation:', error);
    } finally {
      setRunningAutomation(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading automation dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>
          Event Automation Dashboard
        </h2>

        {/* Automation Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {/* Total Events */}
          <div style={{
            backgroundColor: 'var(--dark-surface)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Total Events</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {automationSummary?.totalEvents || 0}
            </p>
          </div>

          {/* Registration Closures Needed */}
          <div style={{
            backgroundColor: 'var(--dark-surface)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Registration Closures</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {automationSummary?.needsRegistrationClosure || 0}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Events needing auto-closure
            </p>
          </div>

          {/* Status Updates Needed */}
          <div style={{
            backgroundColor: 'var(--dark-surface)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>Status Updates</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {automationSummary?.needsStatusUpdate || 0}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Events with outdated status
            </p>
          </div>

          {/* Upcoming Events */}
          <div style={{
            backgroundColor: 'var(--dark-surface)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>Upcoming (24h)</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {automationSummary?.upcomingIn24Hours || 0}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Events starting soon
            </p>
          </div>

          {/* Currently Running */}
          <div style={{
            backgroundColor: 'var(--dark-surface)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Currently Running</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {automationSummary?.currentlyRunning || 0}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Live events
            </p>
          </div>

          {/* Ready for Archival */}
          <div style={{
            backgroundColor: 'var(--dark-surface)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: '#6b7280', marginBottom: '0.5rem' }}>Ready for Archive</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {automationSummary?.readyForArchival || 0}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Old completed events
            </p>
          </div>
        </div>

        {/* Automation Controls */}
        <div style={{
          backgroundColor: 'var(--dark-surface)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Automation Controls</h3>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={runAutomation}
              disabled={runningAutomation}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: runningAutomation ? '#6b7280' : 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: runningAutomation ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
            >
              {runningAutomation ? '🔄 Running...' : '🚀 Run All Automations'}
            </button>
            
            {lastAutomationRun && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Last run: {new Date(lastAutomationRun.timestamp).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Last Automation Results */}
        {lastAutomationRun && (
          <div style={{
            backgroundColor: 'var(--dark-surface)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Last Automation Results</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Registrations Closed</p>
                <p style={{ color: '#ef4444', fontWeight: 'bold' }}>
                  {lastAutomationRun.results.registrationsClosed.length}
                </p>
              </div>
              
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Statuses Updated</p>
                <p style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                  {lastAutomationRun.results.statusesUpdated.length}
                </p>
              </div>
              
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Notifications Sent</p>
                <p style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                  {lastAutomationRun.results.notifications.length}
                </p>
              </div>
              
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Events Archived</p>
                <p style={{ color: '#6b7280', fontWeight: 'bold' }}>
                  {lastAutomationRun.results.eventsArchived.length}
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EventAutomationDashboard;
