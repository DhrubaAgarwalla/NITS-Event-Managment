import { useState, useEffect } from 'react';
import eventService from '../services/eventService';
import { ensureCategories, verifyCategoryIntegrity } from '../utils/ensureCategories';
import logger from '../utils/logger';

const CategoryTest = () => {
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    const runTests = async () => {
      const results = [];
      
      try {
        // Test 1: Ensure categories exist
        results.push('🔍 Testing category existence...');
        const categoriesData = await ensureCategories();
        results.push(`✅ Found ${categoriesData.length} categories: ${categoriesData.map(c => c.name).join(', ')}`);
        setCategories(categoriesData);
        
        // Test 2: Get categories through service
        results.push('🔍 Testing eventService.getCategories()...');
        const serviceCategories = await eventService.getCategories();
        results.push(`✅ Service returned ${serviceCategories.length} categories: ${serviceCategories.map(c => c.name).join(', ')}`);
        
        // Test 3: Get all events
        results.push('🔍 Testing event retrieval...');
        const allEvents = await eventService.getAllEvents();
        results.push(`✅ Found ${allEvents.length} events`);
        setEvents(allEvents);
        
        // Test 4: Check event-category relationships
        results.push('🔍 Testing event-category relationships...');
        allEvents.forEach(event => {
          const categoryInfo = event.category ? 
            `${event.category.name} (${event.category.id})` : 
            event.categories ? 
              `${event.categories.name} (${event.categories.id})` : 
              `No category (category_id: ${event.category_id})`;
          results.push(`  - ${event.title}: ${categoryInfo}`);
        });
        
        // Test 5: Verify category integrity
        results.push('🔍 Running category integrity check...');
        await verifyCategoryIntegrity();
        results.push('✅ Category integrity check completed');
        
        // Test 6: Test filtering logic
        results.push('🔍 Testing filtering logic...');
        const technicalEvents = allEvents.filter(event => {
          const passesCategory = 
            (event.category && event.category.name && event.category.name.toLowerCase() === 'technical') ||
            (event.categories && event.categories.name && event.categories.name.toLowerCase() === 'technical');
          return passesCategory;
        });
        results.push(`✅ Found ${technicalEvents.length} technical events: ${technicalEvents.map(e => e.title).join(', ')}`);
        
      } catch (error) {
        results.push(`❌ Error during testing: ${error.message}`);
        logger.error('Category test error:', error);
      }
      
      setTestResults(results);
      setLoading(false);
    };
    
    runTests();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Running Category Tests...</h2>
        <p>Please wait while we test the category functionality.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Category Functionality Test Results</h1>
      
      <div style={{ 
        backgroundColor: 'var(--dark-surface)', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        lineHeight: '1.5'
      }}>
        {testResults.map((result, index) => (
          <div key={index} style={{ marginBottom: '0.5rem' }}>
            {result}
          </div>
        ))}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <h3>Categories ({categories.length})</h3>
          <div style={{ backgroundColor: 'var(--dark-surface)', padding: '1rem', borderRadius: '8px' }}>
            {categories.map(category => (
              <div key={category.id} style={{ 
                marginBottom: '0.5rem',
                padding: '0.5rem',
                backgroundColor: `${category.color}20`,
                borderRadius: '4px',
                color: category.color
              }}>
                <strong>{category.name}</strong> (ID: {category.id})
                <br />
                <small>Color: {category.color}</small>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3>Events ({events.length})</h3>
          <div style={{ backgroundColor: 'var(--dark-surface)', padding: '1rem', borderRadius: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            {events.map(event => (
              <div key={event.id} style={{ 
                marginBottom: '1rem',
                padding: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px'
              }}>
                <strong>{event.title}</strong>
                <br />
                <small>
                  Category ID: {event.category_id || 'None'}
                  <br />
                  Category Object: {event.category ? `${event.category.name} (${event.category.id})` : 'None'}
                  <br />
                  Categories Object: {event.categories ? `${event.categories.name} (${event.categories.id})` : 'None'}
                </small>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Run Tests Again
        </button>
      </div>
    </div>
  );
};

export default CategoryTest;
