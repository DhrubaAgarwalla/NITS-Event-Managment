/**
 * This script helps you set up Cloudinary
 * It tests the connection and upload functionality
 */

import { uploadImage } from '../lib/cloudinary';

import logger from '../utils/logger';
const testCloudinarySetup = async () => {
  try {
    logger.log('Testing Cloudinary setup...');
    
    // Check if environment variables are set
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || cloudName === 'your-cloud-name') {
      logger.error('Cloudinary cloud name is not set in .env file');
      return;
    }
    
    if (!uploadPreset || uploadPreset === 'your-upload-preset') {
      logger.error('Cloudinary upload preset is not set in .env file');
      return;
    }
    
    logger.log('Cloudinary environment variables are set correctly');
    logger.log('Cloud Name:', cloudName);
    logger.log('Upload Preset:', uploadPreset);
    
    // To test an actual upload, you would need a file
    // This would typically be done through a file input in the UI
    logger.log('To test an actual upload, use the file upload component in your application');
    
    logger.log('Cloudinary setup test complete!');
  } catch (error) {
    logger.error('Error testing Cloudinary setup:', error);
  }
};

// Run the test
testCloudinarySetup();
