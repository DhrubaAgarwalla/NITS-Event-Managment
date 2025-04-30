import { useState } from 'react';
import { motion } from 'framer-motion';

const ClubGallery = ({ gallery = [] }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  // If no gallery images, show a placeholder
  if (!gallery || gallery.length === 0) {
    return (
      <div className="club-gallery-empty" style={{ 
        padding: '2rem', 
        textAlign: 'center',
        backgroundColor: 'var(--dark-surface)',
        borderRadius: '10px',
        marginBottom: '2rem'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Gallery</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          This club hasn't added any gallery images yet.
        </p>
      </div>
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
          borderRadius: '10px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Gallery</h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          {gallery.map((imageUrl, index) => (
            <div 
              key={index}
              style={{
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                aspectRatio: '1',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedImage(imageUrl)}
            >
              <img 
                src={imageUrl} 
                alt={`Gallery image ${index + 1}`} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Lightbox for viewing images */}
      {selectedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            cursor: 'pointer'
          }}
          onClick={() => setSelectedImage(null)}
        >
          <div 
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              color: 'white',
              fontSize: '2rem',
              cursor: 'pointer',
              zIndex: 1001
            }}
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </div>
          <img 
            src={selectedImage} 
            alt="Gallery image full view" 
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: '4px'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ClubGallery;
