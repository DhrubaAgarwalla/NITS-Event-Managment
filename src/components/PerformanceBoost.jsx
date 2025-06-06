import { useEffect } from 'react';
import logger from '../utils/logger';

/**
 * Performance Boost Component
 * Applies aggressive optimizations to achieve LCP < 2.5s
 */
const PerformanceBoost = () => {
  useEffect(() => {
    // Apply performance optimizations immediately
    const optimizePerformance = () => {
      try {
        // 1. Force immediate text rendering
        const heroSubtitle = document.querySelector('.hero-subtitle');
        if (heroSubtitle) {
          heroSubtitle.style.visibility = 'visible';
          heroSubtitle.style.opacity = '1';
          heroSubtitle.style.transform = 'none';
          heroSubtitle.style.transition = 'none';
        }

        // 2. Optimize hero content rendering
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
          heroContent.style.visibility = 'visible';
          heroContent.style.opacity = '1';
          heroContent.style.transform = 'none';
          heroContent.style.transition = 'none';
        }

        // 3. Force layout optimization
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
          heroTitle.style.visibility = 'visible';
          heroTitle.style.opacity = '1';
          heroTitle.style.transform = 'none';
          heroTitle.style.transition = 'none';
          heroTitle.style.willChange = 'auto';
        }

        // 4. Optimize collage background
        const collageContainer = document.querySelector('.collage-container');
        if (collageContainer) {
          collageContainer.style.opacity = '0.45';
          collageContainer.style.visibility = 'visible';
        }

        // 5. Remove any blocking animations
        const motionElements = document.querySelectorAll('[style*="transform"], [style*="opacity"]');
        motionElements.forEach(el => {
          if (el.closest('.hero')) {
            el.style.transform = 'none';
            el.style.opacity = '1';
            el.style.transition = 'none';
          }
        });

        // 6. Force font display
        document.documentElement.style.fontDisplay = 'swap';

        logger.log('Performance boost applied - LCP optimizations active');
      } catch (error) {
        logger.warn('Performance boost error (non-critical):', error);
      }
    };

    // Apply optimizations immediately
    optimizePerformance();

    // Also apply after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', optimizePerformance);
    }

    // Apply after a short delay to catch any dynamic content
    setTimeout(optimizePerformance, 50);
    setTimeout(optimizePerformance, 100);

    return () => {
      document.removeEventListener('DOMContentLoaded', optimizePerformance);
    };
  }, []);

  // Monitor LCP and provide feedback
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      const lcpTime = lastEntry.startTime;

      // Log LCP with color coding
      const isGood = lcpTime < 2500;
      const needsImprovement = lcpTime >= 2500 && lcpTime < 4000;
      
      if (isGood) {
        console.log(
          `%c🎉 LCP: ${lcpTime.toFixed(0)}ms (GOOD!)`,
          'color: #00ff00; font-weight: bold; font-size: 16px; background: #001100; padding: 4px 8px; border-radius: 4px;'
        );
      } else if (needsImprovement) {
        console.log(
          `%c⚠️ LCP: ${lcpTime.toFixed(0)}ms (Needs Improvement)`,
          'color: #ffaa00; font-weight: bold; font-size: 16px; background: #221100; padding: 4px 8px; border-radius: 4px;'
        );
      } else {
        console.log(
          `%c❌ LCP: ${lcpTime.toFixed(0)}ms (Poor)`,
          'color: #ff0000; font-weight: bold; font-size: 16px; background: #220000; padding: 4px 8px; border-radius: 4px;'
        );
      }

      // Log LCP element
      if (lastEntry.element) {
        console.log('LCP Element:', lastEntry.element);
        console.log('Element text:', lastEntry.element.textContent?.substring(0, 100) + '...');
      }
    });

    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    return () => {
      lcpObserver.disconnect();
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default PerformanceBoost;
