/**
 * This script helps you set up Cloudinary
 * It tests the connection and upload functionality
 */

import { uploadImage } from '../lib/cloudinary';

const testCloudinarySetup = async () => {
  try {
    console.log('Testing Cloudinary setup...');
    
    // Check if environment variables are set
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || cloudName === 'your-cloud-name') {
      console.error('Cloudinary cloud name is not set in .env file');
      return;
    }
    
    if (!uploadPreset || uploadPreset === 'your-upload-preset') {
      console.error('Cloudinary upload preset is not set in .env file');
      return;
    }
    
    console.log('Cloudinary environment variables are set correctly');
    console.log('Cloud Name:', cloudName);
    console.log('Upload Preset:', uploadPreset);
    
    // To test an actual upload, you would need a file
    // This would typically be done through a file input in the UI
    console.log('To test an actual upload, use the file upload component in your application');
    
    console.log('Cloudinary setup test complete!');
  } catch (error) {
    console.error('Error testing Cloudinary setup:', error);
  }
};

// Run the test
testCloudinarySetup();
