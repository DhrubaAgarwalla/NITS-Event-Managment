import { useEffect } from 'react';
import '../styles/collage.css';

const CollageBackground = () => {
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
      if (collageContainer) {
        collageContainer.style.opacity = '0';
        
        setTimeout(() => {
          collageContainer.style.transition = 'opacity 1.5s ease';
          collageContainer.style.opacity = '0.45'; // Match the CSS opacity value
        }, 300);
      }
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, []);

  return (
    <div className="collage-background">
      <div className="collage-overlay"></div>
      <div className="collage-container">
        <div className="collage-item" style={{ backgroundImage: "url('/collage photo/Screenshot 2025-04-24 130606.png')" }}></div>
        <div className="collage-item" style={{ backgroundImage: "url('/collage photo/Screenshot 2025-04-24 130628.png')" }}></div>
        <div className="collage-item" style={{ backgroundImage: "url('/collage photo/Screenshot 2025-04-24 130654.png')" }}></div>
        <div className="collage-item" style={{ backgroundImage: "url('/collage photo/Screenshot 2025-04-24 130721.png')" }}></div>
        <div className="collage-item" style={{ backgroundImage: "url('/collage photo/Screenshot 2025-04-24 130759.png')" }}></div>
        <div className="collage-item" style={{ backgroundImage: "url('/collage photo/Screenshot 2025-04-24 130831.png')" }}></div>
        <div className="collage-item" style={{ backgroundImage: "url('/collage photo/Screenshot 2025-04-24 130848.png')" }}></div>
        <div className="collage-item" style={{ backgroundImage: "url('/collage photo/Screenshot 2025-04-24 130937.png')" }}></div>
        <div className="collage-item" style={{ backgroundImage: "url('/collage photo/Screenshot 2025-04-24 131005.png')" }}></div>
      </div>
    </div>
  );
};

export default CollageBackground;