import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ClubGallery = ({ gallery = [] }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);

  // Simple grid layout without forcing specific spans
  const getGridSpan = (index) => {
    return { gridColumn: 'span 1' };
  };

  // Update current index when selected image changes
  useEffect(() => {
    if (selectedImage) {
      const index = gallery.findIndex(img => img === selectedImage);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [selectedImage, gallery]);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Navigate through images in lightbox
  const navigateImage = (direction) => {
    const newIndex = (currentIndex + direction + gallery.length) % gallery.length;
    setCurrentIndex(newIndex);
    setSelectedImage(gallery[newIndex]);
  };

  // Handle keyboard navigation and zoom
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedImage) return;

      if (e.key === 'ArrowRight') {
        navigateImage(1);
      } else if (e.key === 'ArrowLeft') {
        navigateImage(-1);
      } else if (e.key === 'Escape') {
        if (isZoomed) {
          setIsZoomed(false);
        } else {
          setSelectedImage(null);
        }
      } else if (e.key === 'z' || e.key === 'Z') {
        setIsZoomed(!isZoomed);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, currentIndex, gallery, isZoomed]);

  // If no gallery images, show a placeholder with animation
  if (!gallery || gallery.length === 0) {
    return (
      <motion.div
        className="club-gallery-empty"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          padding: '3rem',
          textAlign: 'center',
          backgroundColor: 'var(--dark-surface)',
          borderRadius: '15px',
          marginBottom: '2rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div style={{ marginBottom: '1.5rem', fontSize: '3rem', opacity: 0.6 }}>
          📷
        </div>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.5rem' }}>Gallery</h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
          This club hasn't added any gallery images yet. Check back later to see photos from their events and activities.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="club-gallery" style={{ marginBottom: '2rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          backgroundColor: 'var(--dark-surface)',
          borderRadius: '15px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          overflow: 'hidden'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            marginTop: 0,
            marginBottom: 0,
            fontSize: '1.5rem',
            background: 'linear-gradient(90deg, var(--primary), var(--accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            Photo Gallery
          </h3>
          <div style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '0.4rem 0.8rem',
            borderRadius: '20px'
          }}>
            {gallery.length} {gallery.length === 1 ? 'photo' : 'photos'}
          </div>
        </div>

        {isLoading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '300px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(var(--primary-rgb), 0.3)',
              borderTop: '3px solid var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1rem'
          }}>
            {gallery.map((imageUrl, index) => {
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    cursor: 'pointer',
                    boxShadow: hoveredIndex === index ? '0 10px 25px rgba(0, 0, 0, 0.3)' : '0 5px 15px rgba(0, 0, 0, 0.1)',
                    transition: 'box-shadow 0.3s ease',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onClick={() => setSelectedImage(imageUrl)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  whileHover={{ y: -5 }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: hoveredIndex === index ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0)',
                    transition: 'background-color 0.3s ease',
                    zIndex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {hoveredIndex === index && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(var(--primary-rgb), 0.8)',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          color: 'white',
                          fontSize: '1.2rem'
                        }}
                      >
                        🔍
                      </motion.div>
                    )}
                  </div>
                  <img
                    src={imageUrl}
                    alt={`Gallery image ${index + 1}`}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      transition: 'transform 0.5s ease',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      backgroundColor: 'rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Enhanced Lightbox for viewing images */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.92)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(5px)',
              overflow: 'hidden'
            }}
            onClick={() => setSelectedImage(null)}
          >
            {/* Close button */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                color: 'white',
                fontSize: '2rem',
                cursor: 'pointer',
                zIndex: 1001,
                width: '40px',
                height: '40px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transition: 'background-color 0.3s ease'
              }}
              onClick={() => setSelectedImage(null)}
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              ✕
            </motion.div>

            {/* Navigation buttons */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                position: 'absolute',
                left: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1001
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigateImage(-1);
              }}
              whileHover={{ scale: 1.1 }}
            >
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '1.5rem',
                color: 'white'
              }}>
                ←
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                position: 'absolute',
                right: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1001
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigateImage(1);
              }}
              whileHover={{ scale: 1.1 }}
            >
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '1.5rem',
                color: 'white'
              }}>
                →
              </div>
            </motion.div>

            {/* Image counter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.9rem'
              }}
            >
              {currentIndex + 1} / {gallery.length}
            </motion.div>

            {/* Main image */}
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                width: '90%',
                height: '90%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: isZoomed ? 'auto' : 'hidden'
                }}
              >
                <img
                  src={selectedImage}
                  alt="Gallery image full view"
                  style={{
                    maxWidth: isZoomed ? 'none' : '100%',
                    maxHeight: isZoomed ? 'none' : '100%',
                    width: isZoomed ? 'auto' : null,
                    height: isZoomed ? 'auto' : null,
                    objectFit: 'contain',
                    display: 'block',
                    borderRadius: '4px',
                    cursor: isZoomed ? 'zoom-out' : 'zoom-in',
                    transition: 'transform 0.2s ease'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsZoomed(!isZoomed);
                  }}
                />
              </div>

              {/* Zoom button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  zIndex: 1002,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomed(!isZoomed);
                }}
              >
                {isZoomed ? '🔍 Zoom Out' : '🔍 Zoom In'}
                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>(Press Z)</span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClubGallery;
