// Simple Cloudinary Test Script
// Run with: node cloudinary-test.js

import { config } from 'dotenv';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config();

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cloudinary configuration
const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Validate configuration
if (!cloudName || !uploadPreset) {
  console.error('Error: Cloudinary configuration is missing.');
  console.error('Please make sure your .env file contains:');
  console.error('VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name');
  console.error('VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset');
  process.exit(1);
}

console.log('Cloudinary Configuration:');
console.log(`Cloud Name: ${cloudName}`);
console.log(`Upload Preset: ${uploadPreset}`);

// Test image path (using a sample image in the public directory)
// You can replace this with any image path
const testImagePath = path.join(__dirname, 'public', 'sample-image.jpg');

// Function to test Cloudinary upload
async function testCloudinaryUpload() {
  try {
    console.log(`\nTesting upload with image: ${testImagePath}`);
    
    // Check if the test image exists
    if (!fs.existsSync(testImagePath)) {
      console.error(`Error: Test image not found at ${testImagePath}`);
      console.log('Please place a sample image at this location or update the script with a valid image path.');
      return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath));
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'test-uploads');
    
    console.log('Uploading to Cloudinary...');
    
    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    // Get response as text first for debugging
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('Upload failed with status:', response.status);
      console.error('Response:', responseText);
      return;
    }
    
    // Parse the response
    const data = JSON.parse(responseText);
    
    console.log('\nUpload successful!');
    console.log('Image URL:', data.secure_url);
    console.log('Public ID:', data.public_id);
    console.log('Format:', data.format);
    console.log('Size:', `${data.width}x${data.height}`);
    
  } catch (error) {
    console.error('Error during Cloudinary test:', error);
  }
}

// Run the test
testCloudinaryUpload();
