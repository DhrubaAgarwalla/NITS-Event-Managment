import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import imageCompressionService from '../services/imageCompressionService';
import { uploadImage } from '../services/cloudinaryService';
import logger from '../utils/logger';

const CompressedImageUpload = ({
  onUploadComplete,
  onUploadError,
  imageType = 'default',
  folder = 'compressed-images',
  accept = 'image/*',
  placeholder = 'Click to upload image',
  showPreview = true,
  className = '',
  style = {}
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const [compressionStats, setCompressionStats] = useState(null);
  const [error, setError] = useState('');

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError('');
    setIsProcessing(true);
    setCompressionProgress(0);
    setUploadProgress(0);
    setCompressionStats(null);

    try {
      // Validate image
      const validation = imageCompressionService.validateImage(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Create preview
      if (showPreview) {
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
      }

      // Get optimal settings for image type
      const settings = imageCompressionService.getOptimalSettings(imageType);
      
      // Check if compression is needed
      const needsCompression = imageCompressionService.needsCompression(file, 2);
      
      let fileToUpload = file;
      let stats = null;

      if (needsCompression) {
        logger.log('Image needs compression, starting compression process...');
        
        // Compress image
        const compressionResult = await imageCompressionService.compressImage(
          file, 
          {
            ...settings,
            onProgress: setCompressionProgress
          }
        );

        fileToUpload = compressionResult.compressedFile;
        stats = compressionResult;
        setCompressionStats(stats);

        logger.log('Compression completed:', stats);
      } else {
        logger.log('Image is already optimized, skipping compression');
        setCompressionProgress(100);
      }

      // Upload to Cloudinary
      logger.log('Starting upload to Cloudinary...');
      const uploadResult = await uploadImage(
        fileToUpload, 
        folder, 
        setUploadProgress
      );

      // Success callback
      if (onUploadComplete) {
        onUploadComplete({
          ...uploadResult,
          compressionStats: stats,
          originalFile: file,
          finalFile: fileToUpload
        });
      }

      logger.log('Upload completed successfully');

    } catch (err) {
      logger.error('Error in compressed image upload:', err);
      setError(err.message);
      
      if (onUploadError) {
        onUploadError(err);
      }
    } finally {
      setIsProcessing(false);
      // Reset progress after a delay
      setTimeout(() => {
        setCompressionProgress(0);
        setUploadProgress(0);
      }, 2000);
    }
  };

  const clearPreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setCompressionStats(null);
    setError('');
  };

  return (
    <div className={`compressed-image-upload ${className}`} style={style}>
      {/* File Input */}
      <input
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={isProcessing}
        style={{ display: 'none' }}
        id="compressed-image-input"
      />

      {/* Upload Area */}
      <label
        htmlFor="compressed-image-input"
        style={{
          display: 'block',
          padding: '2rem',
          border: '2px dashed rgba(255, 255, 255, 0.3)',
          borderRadius: '8px',
          textAlign: 'center',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          backgroundColor: isProcessing ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          transition: 'all 0.3s ease',
          opacity: isProcessing ? 0.7 : 1
        }}
        onMouseOver={(e) => {
          if (!isProcessing) {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.target.style.borderColor = 'var(--primary)';
          }
        }}
        onMouseOut={(e) => {
          if (!isProcessing) {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }
        }}
      >
        {!isProcessing ? (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
              📷
            </div>
            <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              {placeholder}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Images will be automatically compressed for optimal performance
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
              ⚙️ Processing...
            </div>
            
            {/* Compression Progress */}
            {compressionProgress > 0 && compressionProgress < 100 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  Compressing image: {compressionProgress}%
                </div>
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <motion.div
                    style={{
                      height: '100%',
                      backgroundColor: 'var(--primary)',
                      borderRadius: '2px'
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${compressionProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploadProgress > 0 && (
              <div>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  Uploading: {uploadProgress}%
                </div>
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <motion.div
                    style={{
                      height: '100%',
                      backgroundColor: '#00ff33',
                      borderRadius: '2px'
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </label>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              borderRadius: '4px',
              color: '#ff6b6b',
              fontSize: '0.9rem'
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview and Stats */}
      <AnimatePresence>
        {(preview || compressionStats) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Image Preview */}
            {preview && showPreview && (
              <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '150px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                />
              </div>
            )}

            {/* Compression Stats */}
            {compressionStats && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Original:</strong><br />
                    {imageCompressionService.formatFileSize(compressionStats.originalSize)}<br />
                    {compressionStats.originalDimensions.width}×{compressionStats.originalDimensions.height}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--primary)' }}>Compressed:</strong><br />
                    {imageCompressionService.formatFileSize(compressionStats.compressedSize)}<br />
                    {compressionStats.newDimensions.width}×{compressionStats.newDimensions.height}
                  </div>
                </div>
                <div style={{ 
                  marginTop: '0.5rem', 
                  textAlign: 'center',
                  color: 'var(--primary)',
                  fontWeight: 'bold'
                }}>
                  {compressionStats.compressionRatio}% size reduction
                </div>
              </div>
            )}

            {/* Clear Button */}
            <button
              onClick={clearPreview}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                width: '100%'
              }}
            >
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompressedImageUpload;
