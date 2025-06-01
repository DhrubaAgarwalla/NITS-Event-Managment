/**
 * Cloudinary configuration and utility functions
 * This file handles image uploads to Cloudinary
 */

// Cloudinary configuration from environment variables
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Function to upload an image to Cloudinary
export const uploadImage = async (file, folder = 'event-images', onProgress = null) => {
  try {
    // Show progress in console
    console.log(`Starting upload to Cloudinary (folder: ${folder})...`);
    console.log(`Using cloud name: ${CLOUDINARY_CLOUD_NAME}`);
    console.log(`Using upload preset: ${CLOUDINARY_UPLOAD_PRESET}`);

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    // Only add folder if it's provided and not empty
    if (folder && folder.trim() !== '') {
      formData.append('folder', folder);
    }

    // Log file details for debugging
    console.log(`File type: ${file.type}`);
    console.log(`File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    // Create XMLHttpRequest to track progress
    if (onProgress && typeof onProgress === 'function') {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`);

        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            console.log('Upload to Cloudinary successful:', data.secure_url);
            resolve({
              url: data.secure_url,
              publicId: data.public_id,
              width: data.width,
              height: data.height,
              format: data.format
            });
          } else {
            console.error('Upload failed with response:', xhr.responseText);
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };

        xhr.onerror = (e) => {
          console.error('XHR error during upload:', e);
          reject(new Error('Network error during upload'));
        };

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        };

        xhr.send(formData);
      });
    } else {
      // Standard fetch without progress tracking
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      // Log the full response for debugging
      const responseText = await response.text();
      console.log('Cloudinary response:', responseText);

      if (!response.ok) {
        let errorMessage = 'Unknown error';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error?.message || 'Unknown error';
        } catch (e) {
          errorMessage = `Failed to parse error response: ${responseText}`;
        }
        throw new Error(`Failed to upload image to Cloudinary: ${errorMessage}`);
      }

      const data = JSON.parse(responseText);
      console.log('Upload to Cloudinary successful:', data.secure_url);

      return {
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
        format: data.format
      };
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Function to generate a Cloudinary URL with transformations
export const getOptimizedImageUrl = (publicId, { width, height, quality = 'auto' } = {}) => {
  if (!publicId) return null;

  // Use the hardcoded cloud name
  let transformations = 'f_auto,q_auto';

  if (width) transformations += `,w_${width}`;
  if (height) transformations += `,h_${height}`;

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
};

// Function to extract public ID from Cloudinary URL
export const getPublicIdFromUrl = (url) => {
  if (!url) return null;

  try {
    // Extract the public ID from the URL
    // Example URL: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/image.jpg
    const regex = /\/v\d+\/(.+)$/;
    const match = url.match(regex);

    if (match && match[1]) {
      return match[1];
    }

    // Alternative format without version
    // Example URL: https://res.cloudinary.com/cloud-name/image/upload/folder/image.jpg
    const altRegex = /\/upload\/(.+)$/;
    const altMatch = url.match(altRegex);

    if (altMatch && altMatch[1]) {
      return altMatch[1];
    }

    return null;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
};
