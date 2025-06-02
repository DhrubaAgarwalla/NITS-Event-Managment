import { ref, set, get } from 'firebase/database';
import { database } from '../lib/firebase';
import logger from './logger';
/**
 * Initialize the Firebase database with the required structure and initial data
 * This function should be run once when setting up the application
 */
export const initializeDatabase = async () => {
  try {
    logger.log('Initializing Firebase database...');

    // Check if database is already initialized
    const dbRef = ref(database, 'initialized');
    const snapshot = await get(dbRef);

    if (snapshot.exists() && snapshot.val() === true) {
      logger.log('Database already initialized');
      return { success: true, message: 'Database already initialized' };
    }

    // Create categories
    const categories = [
      { id: 'technical', name: 'Technical', color: '#3498db' },
      { id: 'cultural', name: 'Cultural', color: '#e74c3c' },
      { id: 'sports', name: 'Sports', color: '#2ecc71' },
      { id: 'academic', name: 'Academic', color: '#f39c12' },
      { id: 'workshop', name: 'Workshop', color: '#9b59b6' }
    ];

    for (const category of categories) {
      const categoryRef = ref(database, `categories/${category.id}`);
      await set(categoryRef, {
        name: category.name,
        color: category.color,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    logger.log('Categories created successfully');

    // Mark database as initialized
    await set(dbRef, true);

    logger.log('Database initialized successfully');
    return { success: true, message: 'Database initialized successfully' };
  } catch (error) {
    logger.error('Error initializing database:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create an admin user in the database
 * @param {string} userId - The Firebase Auth user ID
 * @param {string} name - The admin name
 */
export const createAdminUser = async (userId, name) => {
  try {
    logger.log(`Creating admin user with ID: ${userId}`);

    const adminRef = ref(database, `admins/${userId}`);
    await set(adminRef, {
      name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    logger.log('Admin user created successfully');
    return { success: true };
  } catch (error) {
    logger.error('Error creating admin user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a demo club in the database
 * @param {string} userId - The Firebase Auth user ID
 * @param {object} clubData - The club data
 */
export const createDemoClub = async (userId, clubData) => {
  try {
    logger.log(`Creating demo club with ID: ${userId}`);

    const clubRef = ref(database, `clubs/${userId}`);
    await set(clubRef, {
      ...clubData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    logger.log('Demo club created successfully');
    return { success: true };
  } catch (error) {
    logger.error('Error creating demo club:', error);
    return { success: false, error: error.message };
  }
};
