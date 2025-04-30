import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { uploadImage } from '../lib/cloudinary';
import clubService from '../services/clubService';
import { useAuth } from '../contexts/AuthContext';

const GalleryManager = () => {
  const { club } = useAuth();
  const [gallery, setGallery] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load gallery images when component mounts
  useEffect(() => {
    if (club && club.gallery) {
      setGallery(club.gallery);
    }
  }, [club]);

  // Handle image file selection
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
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
        console.log(`Upload progress: ${progress}%`);
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
      console.error('Error uploading image to Cloudinary:', err);
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
          Upload images to showcase your club's activities and events. Maximum 15 images allowed, each under 5MB.
        </p>

        {/* Error and success messages */}
        {error && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              borderLeft: '4px solid #ff0033',
              marginBottom: '1rem',
              color: '#ff0033',
              fontSize: '0.9rem'
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(0, 255, 0, 0.1)',
              borderLeft: '4px solid #00cc00',
              marginBottom: '1rem',
              color: '#00cc00',
              fontSize: '0.9rem'
            }}
          >
            {success}
          </div>
        )}

        {/* Upload form */}
        <form onSubmit={handleUpload} style={{ marginBottom: '2rem' }}>
          <div style={{ 
            border: '2px dashed rgba(255, 255, 255, 0.2)', 
            borderRadius: '8px', 
            padding: '1rem', 
            textAlign: 'center',
            marginBottom: '1rem',
            cursor: 'pointer',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }}
          onClick={() => document.getElementById('gallery-image-upload').click()}
          >
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Gallery Preview" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '250px', 
                  borderRadius: '8px',
                  marginBottom: '0.5rem'
                }} 
              />
            ) : (
              <div style={{ 
                width: '100%', 
                height: '200px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}>
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>➕</div>
                  <div>Click to upload image</div>
                </div>
              </div>
            )}
            <input
              type="file"
              id="gallery-image-upload"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Recommended: High quality images, max 5MB
            </div>
          </div>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Uploading image... {uploadProgress}%
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${uploadProgress}%`, 
                  height: '100%', 
                  backgroundColor: 'var(--primary)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
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
          <h4 style={{ marginBottom: '1rem' }}>Gallery Images ({gallery.length}/15)</h4>
          
          {gallery.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
              No images in gallery yet. Upload some images to showcase your club!
            </p>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: '1rem' 
            }}>
              {gallery.map((imageUrl, index) => (
                <div 
                  key={index}
                  style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    aspectRatio: '1',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <img 
                    src={imageUrl} 
                    alt={`Gallery image ${index + 1}`} 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
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
                      fontSize: '1rem'
                    }}
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default GalleryManager;
