import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImage } from '../lib/cloudinary';
import clubService from '../services/clubService';
import { useAuth } from '../contexts/AuthContext';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import logger from '../utils/logger';
import 'react-lazy-load-image-component/src/effects/blur.css';

const GalleryManager = () => {
  const { club } = useAuth();
  const [gallery, setGallery] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [loadedImageCount, setLoadedImageCount] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageLoadErrors, setImageLoadErrors] = useState({});

  // Load gallery images when component mounts
  useEffect(() => {
    if (club) {
      setLoadingImages(true);
      setLoadedImageCount(0);
      setImageLoadErrors({});

      // If gallery exists, set it; otherwise, set empty array
      const galleryImages = club.gallery || [];
      setGallery(galleryImages);

      // If there are no images, we're not loading
      if (galleryImages.length === 0) {
        setLoadingImages(false);
      }
    }
  }, [club]);

  // Handle image load completion
  const handleImageLoad = useCallback(() => {
    setLoadedImageCount(prev => {
      const newCount = prev + 1;
      // If all images are loaded, set loading to false
      if (newCount >= gallery.length) {
        setLoadingImages(false);
      }
      return newCount;
    });
  }, [gallery.length]);

  // Handle image load error
  const handleImageError = useCallback((index, imageUrl) => {
    setImageLoadErrors(prev => ({
      ...prev,
      [index]: true
    }));

    // Still count this as "loaded" for the loading state
    handleImageLoad(index);

    logger.error(`Failed to load image at index ${index}: ${imageUrl}`);
  }, [handleImageLoad]);

  // Handle image file selection
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be less than 10MB');
        e.target.value = ''; // Reset the input
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(''); // Clear any previous errors
    }
  };

  // Upload image to Cloudinary
  const uploadImageToCloudinary = async (file) => {
    try {
      setUploadProgress(0);

      // Update progress callback function
      const updateProgress = (progress) => {
        logger.log(`Upload progress: ${progress}%`);
        setUploadProgress(progress);
      };

      // Upload to Cloudinary with progress tracking
      const result = await uploadImage(file, 'club-gallery', updateProgress);

      if (!result || !result.url) {
        throw new Error('Image upload failed: No URL returned from Cloudinary');
      }

      setUploadProgress(100);
      return result.url;
    } catch (err) {
      logger.error('Error uploading image to Cloudinary:', err);
      throw err;
    }
  };

  // Handle image upload
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      setError('Please select an image to upload');
      return;
    }

    if (gallery.length >= 15) {
      setError('Gallery limit reached (maximum 15 images)');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      // Upload image to Cloudinary
      const imageUrl = await uploadImageToCloudinary(imageFile);

      // Add image to gallery in database
      const updatedGallery = await clubService.addGalleryImage(club.id, imageUrl);

      // Update local state
      setGallery(updatedGallery);

      // Reset form
      setImageFile(null);
      setImagePreview('');

      // Show success message
      setSuccess('Image uploaded successfully');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle image removal
  const handleRemoveImage = async (imageUrl) => {
    if (!window.confirm('Are you sure you want to remove this image?')) {
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Remove image from gallery in database
      const updatedGallery = await clubService.removeGalleryImage(club.id, imageUrl);

      // Update local state
      setGallery(updatedGallery);

      // Show success message
      setSuccess('Image removed successfully');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to remove image');
    } finally {
      setIsUploading(false);
    }
  };

  // Common styles
  const cardStyle = {
    backgroundColor: 'var(--dark-surface)',
    borderRadius: '10px',
    padding: '1.5rem',
    marginBottom: '2rem'
  };

  const headingStyle = {
    fontSize: '1.2rem',
    marginTop: 0,
    marginBottom: '1rem'
  };

  return (
    <div className="gallery-manager">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={cardStyle}
      >
        <h3 style={headingStyle}>Club Gallery</h3>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
          Upload images to showcase your club's activities and events. Maximum 15 images allowed, each under 10MB.
        </p>

        {/* Error and success messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{
                padding: '1rem',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                border: '1px solid rgba(255, 0, 0, 0.2)',
                borderRadius: '8px',
                marginBottom: '1rem',
                color: '#ff4444',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>⚠️</div>
              <div>{error}</div>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{
                padding: '1rem',
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                border: '1px solid rgba(0, 255, 0, 0.2)',
                borderRadius: '8px',
                marginBottom: '1rem',
                color: '#44cc44',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>✅</div>
              <div>{success}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload form */}
        <form onSubmit={handleUpload} style={{ marginBottom: '2rem' }}>
          <motion.div
            style={{
              border: '2px dashed rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center',
              marginBottom: '1rem',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.05)'
            }}
            whileHover={{ borderColor: 'rgba(var(--primary-rgb), 0.5)' }}
            onClick={() => document.getElementById('gallery-image-upload').click()}
          >
            <AnimatePresence>
              {imagePreview ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <div style={{
                    width: '100%',
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={imagePreview}
                      alt="Gallery Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '200px',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    Click to change image
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: '100%',
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: '2.5rem',
                      marginBottom: '0.5rem',
                      color: 'var(--primary)',
                      opacity: 0.7
                    }}>
                      ➕
                    </div>
                    <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                      Click to upload image
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '250px', margin: '0 auto' }}>
                      Drag and drop or click to select an image file
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <input
              type="file"
              id="gallery-image-upload"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />

            <div style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              padding: '0.5rem',
              borderRadius: '4px',
              marginTop: '0.5rem'
            }}>
              Recommended: High quality images, max 10MB
            </div>
          </motion.div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '1rem',
                backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid rgba(var(--primary-rgb), 0.2)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.9rem',
                marginBottom: '0.5rem',
                color: 'var(--primary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="upload-spinner" style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(var(--primary-rgb), 0.3)',
                    borderTop: '2px solid var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Uploading image...
                </div>
                <div style={{ fontWeight: 'bold' }}>{uploadProgress}%</div>
              </div>
              <div style={{
                width: '100%',
                height: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '5px',
                overflow: 'hidden',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)'
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{
                    height: '100%',
                    backgroundColor: 'var(--primary)',
                    borderRadius: '5px',
                    boxShadow: '0 1px 3px rgba(var(--primary-rgb), 0.5)'
                  }}
                />
              </div>
            </motion.div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={isUploading || !imageFile}
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: 'var(--primary)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: isUploading || !imageFile ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
                opacity: isUploading || !imageFile ? 0.7 : 1
              }}
            >
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
        </form>

        {/* Gallery images */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4>Gallery Images ({gallery.length}/15)</h4>
            {loadingImages && gallery.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <div className="loading-spinner" style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(var(--primary-rgb), 0.3)',
                  borderTop: '2px solid var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Loading images ({loadedImageCount}/{gallery.length})
                <style jsx>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}
          </div>

          {gallery.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                color: 'var(--text-secondary)',
                textAlign: 'center',
                padding: '3rem 1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: '1px dashed rgba(255, 255, 255, 0.1)'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🖼️</div>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>No images in gallery yet.</p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', opacity: 0.7 }}>
                Upload some images to showcase your club's activities!
              </p>
            </motion.div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '1rem',
              marginTop: '1.5rem'
            }}>
              <AnimatePresence>
                {gallery.map((imageUrl, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    style={{
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      aspectRatio: '1',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    {/* Placeholder while image is loading */}
                    {!imageLoadErrors[index] && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          zIndex: 1,
                          opacity: loadedImageCount > index ? 0 : 1,
                          transition: 'opacity 0.3s ease'
                        }}
                      >
                        <div className="image-loading-spinner" style={{
                          width: '30px',
                          height: '30px',
                          border: '3px solid rgba(255, 255, 255, 0.1)',
                          borderTop: '3px solid rgba(255, 255, 255, 0.8)',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                      </div>
                    )}

                    {/* Error placeholder if image failed to load */}
                    {imageLoadErrors[index] && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                        zIndex: 1
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                        <div style={{ fontSize: '0.8rem', textAlign: 'center', padding: '0 1rem' }}>
                          Failed to load image
                        </div>
                      </div>
                    )}

                    {/* Actual image with lazy loading */}
                    <LazyLoadImage
                      src={imageUrl}
                      alt={`Gallery image ${index + 1}`}
                      effect="blur"
                      threshold={200}
                      onLoad={handleImageLoad}
                      onError={() => handleImageError(index, imageUrl)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: imageLoadErrors[index] ? 0.3 : 1
                      }}
                    />

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveImage(imageUrl)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        zIndex: 2
                      }}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default GalleryManager;
