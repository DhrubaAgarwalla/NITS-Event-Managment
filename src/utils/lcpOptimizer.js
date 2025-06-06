/**
 * LCP (Largest Contentful Paint) Optimizer
 * Helps improve Core Web Vitals performance
 */

import logger from './logger';

class LCPOptimizer {
  constructor() {
    this.lcpElement = null;
    this.lcpTime = 0;
    this.observer = null;
  }

  /**
   * Initialize LCP monitoring and optimization
   */
  init() {
    if (typeof window === 'undefined') return;

    this.observeLCP();
    this.optimizeCriticalResources();
    this.preloadCriticalFonts();
  }

  /**
   * Observe LCP metrics
   */
  observeLCP() {
    if (!('PerformanceObserver' in window)) return;

    try {
      this.observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.lcpTime = lastEntry.startTime;
        this.lcpElement = lastEntry.element;
        
        logger.log(`LCP: ${this.lcpTime.toFixed(2)}ms`);
        logger.log('LCP Element:', this.lcpElement);
        
        // Provide optimization suggestions
        this.provideLCPSuggestions();
      });

      this.observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      logger.warn('Error setting up LCP monitoring:', error);
    }
  }

  /**
   * Provide LCP optimization suggestions
   */
  provideLCPSuggestions() {
    const suggestions = [];

    if (this.lcpTime > 4000) {
      suggestions.push('LCP is very poor (>4s). Consider optimizing critical resources.');
    } else if (this.lcpTime > 2500) {
      suggestions.push('LCP needs improvement (>2.5s). Consider preloading critical resources.');
    } else {
      suggestions.push('LCP is good (<2.5s).');
    }

    if (this.lcpElement) {
      const tagName = this.lcpElement.tagName.toLowerCase();
      
      if (tagName === 'img') {
        suggestions.push('LCP element is an image. Consider using WebP format and proper sizing.');
      } else if (tagName === 'p' || tagName === 'h1' || tagName === 'h2') {
        suggestions.push('LCP element is text. Consider preloading fonts and reducing render-blocking resources.');
      }
    }

    logger.log('LCP Optimization Suggestions:', suggestions);
  }

  /**
   * Optimize critical resources
   */
  optimizeCriticalResources() {
    // Preload critical CSS
    this.preloadResource('/src/index.css', 'style');
    this.preloadResource('/src/App.css', 'style');
    
    // Preload critical JavaScript
    this.preloadResource('/src/main.jsx', 'script');
  }

  /**
   * Preload critical fonts
   */
  preloadCriticalFonts() {
    const criticalFonts = [
      'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQQfforQhXiVMrUZcR-9kFn2kX.woff2',
      'https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrJJfecg.woff2'
    ];

    criticalFonts.forEach(fontUrl => {
      this.preloadResource(fontUrl, 'font', 'font/woff2');
    });
  }

  /**
   * Preload a resource
   */
  preloadResource(href, as, type = null) {
    if (document.querySelector(`link[href="${href}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    
    if (type) link.type = type;
    if (as === 'font') link.crossOrigin = 'anonymous';
    
    document.head.appendChild(link);
    logger.log(`Preloaded ${as}: ${href}`);
  }

  /**
   * Optimize images for LCP
   */
  optimizeImages() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      // Add loading="eager" to above-the-fold images
      if (this.isAboveTheFold(img)) {
        img.loading = 'eager';
        img.fetchPriority = 'high';
      } else {
        img.loading = 'lazy';
      }
    });
  }

  /**
   * Check if element is above the fold
   */
  isAboveTheFold(element) {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  /**
   * Force layout recalculation to improve LCP
   */
  optimizeLayout() {
    // Remove layout-shifting elements
    const elements = document.querySelectorAll('[style*="transform"]');
    elements.forEach(el => {
      if (this.isAboveTheFold(el)) {
        el.style.willChange = 'transform';
      }
    });
  }

  /**
   * Get current LCP metrics
   */
  getMetrics() {
    return {
      lcpTime: this.lcpTime,
      lcpElement: this.lcpElement,
      isGood: this.lcpTime < 2500,
      needsImprovement: this.lcpTime >= 2500 && this.lcpTime < 4000,
      isPoor: this.lcpTime >= 4000
    };
  }

  /**
   * Clean up observers
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Create singleton instance
const lcpOptimizer = new LCPOptimizer();

export default lcpOptimizer;
