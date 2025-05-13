import { useEffect } from 'react';

/**
 * Mobile3DEffects component adds advanced 3D effects to event cards on mobile devices
 * Combines tilt effects based on device orientation, touch interaction, and scroll parallax
 */
const Mobile3DEffects = () => {
  useEffect(() => {
    // Only apply on mobile devices
    if (window.innerWidth < 768) {
      const cards = document.querySelectorAll('.event-card');
      
      // Apply initial 3D styles to cards
      cards.forEach(card => {
        // Add 3D perspective to cards
        card.style.perspective = '1000px';
        card.style.transformStyle = 'preserve-3d';
        
        // Create shadow element for 3D effect
        const shadow = document.createElement('div');
        shadow.className = 'card-shadow';
        shadow.style.position = 'absolute';
        shadow.style.top = '0';
        shadow.style.left = '0';
        shadow.style.width = '100%';
        shadow.style.height = '100%';
        shadow.style.borderRadius = '10px';
        shadow.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
        shadow.style.opacity = '0';
        shadow.style.transition = 'opacity 0.3s ease';
        shadow.style.zIndex = '-1';
        
        // Add shadow as first child
        if (card.firstChild) {
          card.insertBefore(shadow, card.firstChild);
        } else {
          card.appendChild(shadow);
        }
        
        // Create highlight element for 3D effect
        const highlight = document.createElement('div');
        highlight.className = 'card-highlight';
        highlight.style.position = 'absolute';
        highlight.style.top = '0';
        highlight.style.left = '0';
        highlight.style.width = '100%';
        highlight.style.height = '100%';
        highlight.style.borderRadius = '10px';
        highlight.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)';
        highlight.style.opacity = '0';
        highlight.style.transition = 'opacity 0.3s ease';
        highlight.style.pointerEvents = 'none';
        
        // Add highlight as first child
        if (card.firstChild) {
          card.insertBefore(highlight, card.firstChild);
        } else {
          card.appendChild(highlight);
        }
        
        // Make card image pop out in 3D space
        const image = card.querySelector('.event-image');
        if (image) {
          image.style.transition = 'transform 0.3s ease';
          image.style.transformStyle = 'preserve-3d';
          image.style.transform = 'translateZ(0)';
        }
      });
      
      // 1. DEVICE ORIENTATION EFFECT
      const handleDeviceOrientation = (event) => {
        // Get device orientation data
        const tiltX = event.beta; // -90 to 90 (tilting forward/backward)
        const tiltY = event.gamma; // -90 to 90 (tilting left/right)
        
        // Apply tilt to all cards with different intensities
        cards.forEach((card, index) => {
          // Skip if card is not in viewport
          if (!isElementInViewport(card)) return;
          
          const intensity = 0.15; // Adjust for more/less tilt
          const rotateX = Math.min(Math.max(tiltX * intensity, -8), 8); // Limit to ±8 degrees
          const rotateY = Math.min(Math.max(tiltY * intensity, -8), 8); // Limit to ±8 degrees
          
          // Apply 3D transform
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1.02)`;
          
          // Make image pop out
          const image = card.querySelector('.event-image');
          if (image) {
            image.style.transform = `translateZ(20px) scale(1.05)`;
          }
          
          // Adjust shadow based on tilt
          const shadow = card.querySelector('.card-shadow');
          if (shadow) {
            shadow.style.opacity = '0.7';
            shadow.style.transform = `translateZ(-20px) scale(0.95)`;
          }
          
          // Adjust highlight based on tilt
          const highlight = card.querySelector('.card-highlight');
          if (highlight) {
            highlight.style.opacity = '0.7';
            highlight.style.transform = `translateZ(10px) rotateX(${-rotateX}deg) rotateY(${-rotateY}deg)`;
          }
        });
      };
      
      // 2. TOUCH-BASED EFFECT
      cards.forEach(card => {
        card.addEventListener('touchstart', (e) => {
          // Prevent default behavior only if needed
          // e.preventDefault(); // Be careful with this as it can prevent scrolling
          
          // Add active class for styling
          card.classList.add('touch-active');
        });
        
        card.addEventListener('touchmove', (e) => {
          // Don't prevent default to allow scrolling
          
          const touch = e.touches[0];
          const rect = card.getBoundingClientRect();
          
          // Calculate touch position relative to card center
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const touchX = touch.clientX;
          const touchY = touch.clientY;
          
          // Calculate rotation based on touch position (limited to ±10 degrees)
          const rotateY = Math.min(Math.max(((touchX - centerX) / (rect.width / 2)) * 10, -10), 10);
          const rotateX = Math.min(Math.max(((centerY - touchY) / (rect.height / 2)) * 10, -10), 10);
          
          // Apply 3D transform
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1.05)`;
          card.style.transition = 'none'; // Remove transition for smooth movement
          
          // Make image pop out more on touch
          const image = card.querySelector('.event-image');
          if (image) {
            image.style.transform = `translateZ(30px) scale(1.08)`;
            image.style.transition = 'none';
          }
          
          // Enhance shadow on touch
          const shadow = card.querySelector('.card-shadow');
          if (shadow) {
            shadow.style.opacity = '0.8';
            shadow.style.transform = `translateZ(-30px) scale(0.92)`;
            shadow.style.transition = 'none';
          }
          
          // Adjust highlight based on touch position
          const highlight = card.querySelector('.card-highlight');
          if (highlight) {
            highlight.style.opacity = '1';
            highlight.style.background = `radial-gradient(circle at ${touchX - rect.left}px ${touchY - rect.top}px, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%)`;
            highlight.style.transition = 'none';
          }
        });
        
        // Reset transform when touch ends
        card.addEventListener('touchend', () => {
          card.classList.remove('touch-active');
          card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
          card.style.transition = 'transform 0.5s ease-out';
          
          // Reset image
          const image = card.querySelector('.event-image');
          if (image) {
            image.style.transform = 'translateZ(0) scale(1)';
            image.style.transition = 'transform 0.5s ease-out';
          }
          
          // Reset shadow
          const shadow = card.querySelector('.card-shadow');
          if (shadow) {
            shadow.style.opacity = '0';
            shadow.style.transform = 'translateZ(0) scale(1)';
            shadow.style.transition = 'all 0.5s ease-out';
          }
          
          // Reset highlight
          const highlight = card.querySelector('.card-highlight');
          if (highlight) {
            highlight.style.opacity = '0';
            highlight.style.transition = 'opacity 0.5s ease-out';
          }
        });
      });
      
      // 3. SCROLL-BASED PARALLAX
      const handleScroll = () => {
        cards.forEach((card) => {
          // Skip if card is not in viewport
          if (!isElementInViewport(card)) return;
          
          const rect = card.getBoundingClientRect();
          const centerY = rect.top + rect.height / 2;
          const viewportCenterY = window.innerHeight / 2;
          
          // Calculate distance from center of viewport (normalized from -1 to 1)
          const distanceFromCenter = (centerY - viewportCenterY) / (window.innerHeight / 2);
          
          // Only apply effect when card is near viewport center
          if (Math.abs(distanceFromCenter) < 1.2) {
            // Apply 3D transform based on scroll position
            const rotateX = distanceFromCenter * 5; // Max 5 degrees
            const translateZ = Math.abs(distanceFromCenter) * -20; // Push in/out of screen
            const scale = 1 - Math.abs(distanceFromCenter) * 0.05; // Subtle scale effect
            
            // Don't override touch or orientation effects if they're active
            if (!card.classList.contains('touch-active')) {
              card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) translateZ(${translateZ}px) scale(${scale})`;
              
              // Adjust image based on scroll position
              const image = card.querySelector('.event-image');
              if (image) {
                const imageTranslateZ = Math.max(20 - Math.abs(distanceFromCenter) * 30, 0);
                image.style.transform = `translateZ(${imageTranslateZ}px)`;
              }
              
              // Adjust shadow based on scroll position
              const shadow = card.querySelector('.card-shadow');
              if (shadow) {
                shadow.style.opacity = 0.3 + Math.abs(distanceFromCenter) * 0.3;
              }
            }
          }
        });
      };
      
      // Helper function to check if element is in viewport
      function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
          rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.bottom >= 0
        );
      }
      
      // Set up event listeners
      
      // For device orientation
      if (typeof DeviceOrientationEvent !== 'undefined' && 
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ requires permission
        document.addEventListener('click', () => {
          DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
              if (permissionState === 'granted') {
                window.addEventListener('deviceorientation', handleDeviceOrientation);
              }
            })
            .catch(console.error);
        }, { once: true });
      } else {
        // Non-iOS devices
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }
      
      // For scroll effect
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      // Initial call to set up scroll effects
      handleScroll();
      
      // Clean up event listeners on component unmount
      return () => {
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
        window.removeEventListener('scroll', handleScroll);
        
        // Remove added elements
        cards.forEach(card => {
          const shadow = card.querySelector('.card-shadow');
          if (shadow) shadow.remove();
          
          const highlight = card.querySelector('.card-highlight');
          if (highlight) highlight.remove();
          
          // Reset styles
          card.style = '';
          const image = card.querySelector('.event-image');
          if (image) image.style = '';
        });
      };
    }
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default Mobile3DEffects;
