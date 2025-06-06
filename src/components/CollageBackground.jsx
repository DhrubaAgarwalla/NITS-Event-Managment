import { useEffect, useState } from 'react';
import '../styles/collage.css';
import { getOptimizedImageUrl } from '../lib/cloudinary';
import logger from '../utils/logger';

// Cloudinary optimized collage images
const COLLAGE_IMAGES = [
  'collage-background/collage-1', // Screenshot 2025-04-24 130606.png
  'collage-background/collage-2', // Screenshot 2025-04-24 130628.png
  'collage-background/collage-3', // Screenshot 2025-04-24 130654.png
  'collage-background/collage-4', // Screenshot 2025-04-24 130721.png
  'collage-background/collage-5', // Screenshot 2025-04-24 130759.png
  'collage-background/collage-6', // Screenshot 2025-04-24 130831.png
  'collage-background/collage-7', // Screenshot 2025-04-24 130848.png
  'collage-background/collage-8', // Screenshot 2025-04-24 130937.png
  'collage-background/collage-9', // Screenshot 2025-04-24 131005.png
];

const CollageBackground = () => {
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Generate optimized image URLs
  const getOptimizedCollageUrl = (publicId, size = 'medium') => {
    const transformations = {
      small: 'q_auto:low,f_auto,w_400,h_300,c_fill',
      medium: 'q_auto,f_auto,w_800,h_600,c_fill',
      large: 'q_auto:good,f_auto,w_1200,h_900,c_fill'
    };

    const transformation = transformations[size] || transformations.medium;
    const cloudName = 'dmsvblrzv'; // Use the same cloud name as in the upload script

    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
  };

  // Preload critical images
  useEffect(() => {
    const preloadImages = async () => {
      logger.log('Starting collage images preload...');

      // Preload first 3 images (most visible) in medium quality
      const criticalImages = COLLAGE_IMAGES.slice(0, 3);
      const preloadPromises = criticalImages.map(publicId => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            setImagesLoaded(prev => prev + 1);
            resolve();
          };
          img.onerror = reject;
          img.src = getOptimizedCollageUrl(publicId, 'medium');
        });
      });

      try {
        await Promise.all(preloadPromises);
        logger.log('Critical collage images preloaded');
        setIsVisible(true);
      } catch (error) {
        logger.error('Error preloading collage images:', error);
        setIsVisible(true); // Show anyway
      }
    };

    preloadImages();
  }, []);

  useEffect(() => {
    // Only apply on desktop
    if (window.innerWidth >= 768) {
      const collageItems = document.querySelectorAll('.collage-item');

      const handleMouseMove = (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;

        collageItems.forEach((item, index) => {
          // Create different movement amounts for each item
          const offsetX = (mouseX - 0.5) * (index % 3 + 1) * 15;
          const offsetY = (mouseY - 0.5) * (index % 2 + 1) * 15;

          // Apply the transform with a slight delay for a more natural feel
          setTimeout(() => {
            const rotation = item.dataset.rotation || '0deg';
            item.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotation})`;
          }, index * 50);
        });
      };

      document.addEventListener('mousemove', handleMouseMove);

      // Store original rotation values
      collageItems.forEach((item) => {
        // Extract the rotation value from the transform style
        const style = window.getComputedStyle(item);
        const transform = style.getPropertyValue('transform');

        if (transform && transform !== 'none') {
          const matrix = transform.match(/^matrix\((.+)\)$/);
          if (matrix) {
            const values = matrix[1].split(', ');
            const a = values[0];
            const b = values[1];
            const angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
            item.dataset.rotation = `${angle}deg`;
          }
        }
      });

      // Add a subtle fade-in effect for the collage
      const collageContainer = document.querySelector('.collage-container');
      if (collageContainer && isVisible) {
        collageContainer.style.opacity = '0';

        setTimeout(() => {
          collageContainer.style.transition = 'opacity 1.5s ease';
          collageContainer.style.opacity = '0.45'; // Match the CSS opacity value
        }, 100); // Faster fade-in since images are preloaded
      }

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, []);

  return (
    <div className="collage-background">
      <div className="collage-overlay"></div>
      <div className="collage-container" style={{ opacity: isVisible ? undefined : 0 }}>
        {COLLAGE_IMAGES.map((publicId, index) => (
          <div
            key={publicId}
            className="collage-item"
            style={{
              backgroundImage: `url('${getOptimizedCollageUrl(publicId, 'medium')}')`,
              opacity: index < 3 ? 1 : 0.8 // Prioritize first 3 images
            }}
            onLoad={() => {
              logger.log(`Collage image ${index + 1} loaded`);
            }}
          />
        ))}
      </div>

      {/* Loading indicator for development */}
      {!isVisible && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.9rem',
          zIndex: 1,
          display: process.env.NODE_ENV === 'development' ? 'block' : 'none'
        }}>
          Loading collage... ({imagesLoaded}/3)
        </div>
      )}
    </div>
  );
};

export default CollageBackground;