import logger from '../utils/logger';

/**
 * Image Compression Service
 * Compresses images before uploading to Cloudinary to save bandwidth and storage
 */
class ImageCompressionService {
  /**
   * Compress an image file
   * @param {File} file - The image file to compress
   * @param {Object} options - Compression options
   * @returns {Promise<Object>} - Compressed file and metadata
   */
  async compressImage(file, options = {}) {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.85,
      format = 'jpeg',
      onProgress = null
    } = options;

    try {
      logger.log(`Starting image compression for: ${file.name}`);
      logger.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

      if (onProgress) onProgress(10);

      // Create image element
      const img = await this.createImageFromFile(file);
      
      if (onProgress) onProgress(30);

      // Calculate new dimensions
      const { width, height } = this.calculateDimensions(
        img.naturalWidth, 
        img.naturalHeight, 
        maxWidth, 
        maxHeight
      );

      if (onProgress) onProgress(50);

      // Create canvas and compress
      const compressedBlob = await this.compressToCanvas(img, width, height, quality, format);
      
      if (onProgress) onProgress(80);

      // Create new file from compressed blob
      const compressedFile = new File(
        [compressedBlob], 
        this.generateFileName(file.name, format),
        { type: compressedBlob.type }
      );

      if (onProgress) onProgress(100);

      const compressionRatio = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
      
      logger.log(`Compression complete:`);
      logger.log(`- Original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      logger.log(`- Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
      logger.log(`- Reduction: ${compressionRatio}%`);
      logger.log(`- New dimensions: ${width}x${height}`);

      return {
        originalFile: file,
        compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: parseFloat(compressionRatio),
        originalDimensions: { width: img.naturalWidth, height: img.naturalHeight },
        newDimensions: { width, height },
        format
      };

    } catch (error) {
      logger.error('Error compressing image:', error);
      throw new Error(`Image compression failed: ${error.message}`);
    }
  }

  /**
   * Create image element from file
   * @param {File} file - Image file
   * @returns {Promise<HTMLImageElement>} - Image element
   */
  createImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Calculate new dimensions maintaining aspect ratio
   * @param {number} originalWidth - Original width
   * @param {number} originalHeight - Original height
   * @param {number} maxWidth - Maximum width
   * @param {number} maxHeight - Maximum height
   * @returns {Object} - New dimensions
   */
  calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // If image is smaller than max dimensions, don't upscale
    if (width <= maxWidth && height <= maxHeight) {
      return { width, height };
    }

    // Calculate aspect ratio
    const aspectRatio = width / height;

    // Resize based on the limiting dimension
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * Compress image using canvas
   * @param {HTMLImageElement} img - Image element
   * @param {number} width - Target width
   * @param {number} height - Target height
   * @param {number} quality - Compression quality (0-1)
   * @param {string} format - Output format
   * @returns {Promise<Blob>} - Compressed image blob
   */
  compressToCanvas(img, width, height, quality, format) {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = width;
        canvas.height = height;

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate new filename with format
   * @param {string} originalName - Original filename
   * @param {string} format - New format
   * @returns {string} - New filename
   */
  generateFileName(originalName, format) {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const timestamp = Date.now();
    return `${nameWithoutExt}_compressed_${timestamp}.${format}`;
  }

  /**
   * Get optimal compression settings based on image type
   * @param {string} imageType - Image type (banner, profile, gallery, etc.)
   * @returns {Object} - Compression settings
   */
  getOptimalSettings(imageType) {
    const settings = {
      banner: {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        format: 'jpeg'
      },
      profile: {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.85,
        format: 'jpeg'
      },
      gallery: {
        maxWidth: 1200,
        maxHeight: 900,
        quality: 0.80,
        format: 'jpeg'
      },
      payment: {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.75,
        format: 'jpeg'
      },
      default: {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        format: 'jpeg'
      }
    };

    return settings[imageType] || settings.default;
  }

  /**
   * Check if image needs compression
   * @param {File} file - Image file
   * @param {number} maxSizeMB - Maximum size in MB
   * @returns {boolean} - Whether compression is needed
   */
  needsCompression(file, maxSizeMB = 2) {
    const fileSizeMB = file.size / 1024 / 1024;
    return fileSizeMB > maxSizeMB;
  }

  /**
   * Validate image file
   * @param {File} file - Image file
   * @returns {Object} - Validation result
   */
  validateImage(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSizeMB = 50; // 50MB max for original file
    
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (!validTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Invalid file type. Please select a JPEG, PNG, or WebP image.' 
      };
    }

    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > maxSizeMB) {
      return { 
        valid: false, 
        error: `File size (${fileSizeMB.toFixed(2)} MB) exceeds the ${maxSizeMB} MB limit.` 
      };
    }

    return { valid: true };
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default new ImageCompressionService();
