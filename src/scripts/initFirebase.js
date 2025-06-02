import { initializeDatabase, createAdminUser } from '../utils/initializeDatabase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

import logger from '../utils/logger';
/**
 * This script initializes the Firebase database and creates an admin user
 * Run this script once when setting up the application
 */
const initFirebase = async () => {
  try {
    logger.log('Starting Firebase initialization...');
    
    // Initialize database
    const dbResult = await initializeDatabase();
    logger.log('Database initialization result:', dbResult);
    
    // Create admin user if needed
    const adminEmail = prompt('Enter admin email:');
    const adminPassword = prompt('Enter admin password:');
    const adminName = prompt('Enter admin name:');
    
    if (adminEmail && adminPassword && adminName) {
      try {
        // Create auth user
        const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        const userId = userCredential.user.uid;
        
        // Create admin record in database
        const adminResult = await createAdminUser(userId, adminName);
        logger.log('Admin user creation result:', adminResult);
      } catch (error) {
        logger.error('Error creating admin user:', error);
        
        // If the error is because the user already exists, we can still try to create the admin record
        if (error.code === 'auth/email-already-in-use') {
          const userId = prompt('User already exists. Enter the Firebase user ID to make them an admin:');
          if (userId) {
            const adminResult = await createAdminUser(userId, adminName);
            logger.log('Admin user creation result:', adminResult);
          }
        }
      }
    }
    
    logger.log('Firebase initialization complete!');
  } catch (error) {
    logger.error('Error during Firebase initialization:', error);
  }
};

// Run the initialization
initFirebase();
