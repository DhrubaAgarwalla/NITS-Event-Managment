import { ref, get, set } from 'firebase/database';
import { database } from '../lib/firebase';
import logger from './logger';

/**
 * Ensure that categories exist in the database
 * If no categories exist, create default ones
 */
export const ensureCategories = async () => {
  try {
    logger.log('Checking if categories exist in database...');
    
    // Check if categories exist
    const categoriesRef = ref(database, 'categories');
    const snapshot = await get(categoriesRef);
    
    if (snapshot.exists()) {
      const categories = [];
      snapshot.forEach((childSnapshot) => {
        categories.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      
      logger.log(`Found ${categories.length} existing categories:`, categories.map(c => c.name));
      return categories;
    }
    
    // No categories exist, create default ones
    logger.log('No categories found, creating default categories...');
    
    const defaultCategories = [
      { id: 'technical', name: 'Technical', color: '#3498db' },
      { id: 'cultural', name: 'Cultural', color: '#e74c3c' },
      { id: 'sports', name: 'Sports', color: '#2ecc71' },
      { id: 'academic', name: 'Academic', color: '#f39c12' },
      { id: 'workshop', name: 'Workshop', color: '#9b59b6' }
    ];
    
    // Create each category
    for (const category of defaultCategories) {
      const categoryRef = ref(database, `categories/${category.id}`);
      await set(categoryRef, {
        name: category.name,
        color: category.color,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      logger.log(`Created category: ${category.name}`);
    }
    
    logger.log('Default categories created successfully');
    return defaultCategories;
    
  } catch (error) {
    logger.error('Error ensuring categories exist:', error);
    
    // Return fallback categories if database operation fails
    return [
      { id: 'technical', name: 'Technical', color: '#3498db' },
      { id: 'cultural', name: 'Cultural', color: '#e74c3c' },
      { id: 'sports', name: 'Sports', color: '#2ecc71' },
      { id: 'academic', name: 'Academic', color: '#f39c12' },
      { id: 'workshop', name: 'Workshop', color: '#9b59b6' }
    ];
  }
};

/**
 * Get category by ID with fallback
 */
export const getCategoryById = async (categoryId) => {
  try {
    if (!categoryId) return null;
    
    const categoryRef = ref(database, `categories/${categoryId}`);
    const snapshot = await get(categoryRef);
    
    if (snapshot.exists()) {
      return {
        id: snapshot.key,
        ...snapshot.val()
      };
    }
    
    logger.warn(`Category not found for ID: ${categoryId}`);
    return null;
    
  } catch (error) {
    logger.error('Error getting category by ID:', error);
    return null;
  }
};

/**
 * Verify category data integrity for events
 */
export const verifyCategoryIntegrity = async () => {
  try {
    logger.log('Verifying category data integrity...');
    
    // Get all events
    const eventsRef = ref(database, 'events');
    const eventsSnapshot = await get(eventsRef);
    
    if (!eventsSnapshot.exists()) {
      logger.log('No events found, skipping category integrity check');
      return;
    }
    
    // Get all categories
    const categories = await ensureCategories();
    const categoryIds = categories.map(c => c.id);
    
    let issuesFound = 0;
    
    eventsSnapshot.forEach((childSnapshot) => {
      const eventId = childSnapshot.key;
      const eventData = childSnapshot.val();
      
      if (eventData.category_id && !categoryIds.includes(eventData.category_id)) {
        logger.warn(`Event ${eventId} (${eventData.title}) has invalid category_id: ${eventData.category_id}`);
        issuesFound++;
      }
    });
    
    if (issuesFound === 0) {
      logger.log('Category integrity check passed - all events have valid categories');
    } else {
      logger.warn(`Category integrity check found ${issuesFound} issues`);
    }
    
  } catch (error) {
    logger.error('Error verifying category integrity:', error);
  }
};
