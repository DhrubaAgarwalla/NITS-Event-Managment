// Cloudinary service for image uploads
// This service handles uploading images to Cloudinary cloud storage

import logger from '../utils/logger';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Upload an image to Cloudinary
 * @param {File} file - The image file to upload
 * @param {string} folder - The folder name in Cloudinary (optional)
 * @param {function} onProgress - Progress callback function (optional)
 * @returns {Promise<Object>} - Upload result with URL and other metadata
 */
export const uploadImage = async (file, folder = 'event-images', onProgress = null) => {
  try {
    logger.log(`Starting upload to Cloudinary for file: ${file.name}`);

    // Create FormData for the upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    if (folder) {
      formData.append('folder', folder);
    }

    // Add timestamp for unique naming
    formData.append('public_id', `${folder}/${Date.now()}_${file.name.split('.')[0]}`);

    // Create XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress && typeof onProgress === 'function') {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        });
      }

      // Handle successful upload
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            logger.log('Cloudinary upload successful:', response);

            resolve({
              url: response.secure_url,
              public_id: response.public_id,
              width: response.width,
              height: response.height,
              format: response.format,
              bytes: response.bytes,
              created_at: response.created_at
            });
          } catch (parseError) {
            logger.error('Error parsing Cloudinary response:', parseError);
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          logger.error('Cloudinary upload failed with status:', xhr.status);
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      });

      // Handle upload errors
      xhr.addEventListener('error', () => {
        logger.error('Cloudinary upload error');
        reject(new Error('Network error during upload'));
      });

      // Handle upload timeout
      xhr.addEventListener('timeout', () => {
        logger.error('Cloudinary upload timeout');
        reject(new Error('Upload timeout'));
      });

      // Configure and send request
      xhr.open('POST', CLOUDINARY_UPLOAD_URL);
      xhr.timeout = 60000; // 60 second timeout
      xhr.send(formData);
    });

  } catch (error) {
    logger.error('Error in uploadImage:', error);
    throw error;
  }
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteImage = async (publicId) => {
  try {
    logger.log(`Deleting image from Cloudinary: ${publicId}`);

    // Note: Deletion requires server-side implementation with API secret
    // This is a placeholder for client-side reference
    logger.warn('Image deletion should be implemented on the server side for security');

    return {
      success: false,
      message: 'Image deletion requires server-side implementation'
    };

  } catch (error) {
    logger.error('Error in deleteImage:', error);
    throw error;
  }
};

/**
 * Get optimized image URL with transformations
 * @param {string} imageUrl - Original Cloudinary image URL
 * @param {Object} transformations - Transformation options
 * @returns {string} - Optimized image URL
 */
export const getOptimizedImageUrl = (imageUrl, transformations = {}) => {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return imageUrl;
    }

    const {
      width = null,
      height = null,
      quality = 'auto',
      format = 'auto',
      crop = 'fill'
    } = transformations;

    // Build transformation string
    let transformString = `q_${quality},f_${format}`;

    if (width) transformString += `,w_${width}`;
    if (height) transformString += `,h_${height}`;
    if (width || height) transformString += `,c_${crop}`;

    // Insert transformation into URL
    const urlParts = imageUrl.split('/upload/');
    if (urlParts.length === 2) {
      return `${urlParts[0]}/upload/${transformString}/${urlParts[1]}`;
    }

    return imageUrl;

  } catch (error) {
    logger.error('Error in getOptimizedImageUrl:', error);
    return imageUrl;
  }
};

/**
 * Validate image file before upload
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
export const validateImageFile = (file, options = {}) => {
  const {
    maxSizeInMB = 5,
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    minWidth = 0,
    minHeight = 0
  } = options;

  const errors = [];

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Check file size
  const fileSizeInMB = file.size / (1024 * 1024);
  if (fileSizeInMB > maxSizeInMB) {
    errors.push(`File size (${fileSizeInMB.toFixed(2)}MB) exceeds maximum allowed size (${maxSizeInMB}MB)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    fileSize: fileSizeInMB
  };
};

// Export default object with all functions
export default {
  uploadImage,
  deleteImage,
  getOptimizedImageUrl,
  validateImageFile
};
