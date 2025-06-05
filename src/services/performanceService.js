import logger from '../utils/logger';

/**
 * Performance Optimization Service
 * Provides utilities for monitoring and optimizing app performance
 */
class PerformanceService {
  constructor() {
    this.metrics = {
      pageLoadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0
    };
    
    this.observers = new Map();
    this.initializePerformanceMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  initializePerformanceMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor page load performance
    this.observePageLoad();
    
    // Monitor resource loading
    this.observeResourceTiming();
  }

  /**
   * Observe Core Web Vitals
   */
  observeWebVitals() {
    try {
      // Largest Contentful Paint (LCP)
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.largestContentfulPaint = lastEntry.startTime;
          logger.log(`LCP: ${lastEntry.startTime.toFixed(2)}ms`);
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
            logger.log(`FID: ${this.metrics.firstInputDelay.toFixed(2)}ms`);
          });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);

        // Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              this.metrics.cumulativeLayoutShift += entry.value;
            }
          });
          logger.log(`CLS: ${this.metrics.cumulativeLayoutShift.toFixed(4)}`);
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      }
    } catch (error) {
      logger.warn('Error setting up Web Vitals monitoring:', error);
    }
  }

  /**
   * Observe page load performance
   */
  observePageLoad() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
          logger.log(`Page Load Time: ${this.metrics.pageLoadTime.toFixed(2)}ms`);
        }

        // First Contentful Paint
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.metrics.firstContentfulPaint = fcpEntry.startTime;
          logger.log(`FCP: ${fcpEntry.startTime.toFixed(2)}ms`);
        }
      }, 0);
    });
  }

  /**
   * Observe resource timing
   */
  observeResourceTiming() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    const resourceObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        // Log slow resources (>1s)
        if (entry.duration > 1000) {
          logger.warn(`Slow resource: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
        }
      });
    });

    resourceObserver.observe({ entryTypes: ['resource'] });
    this.observers.set('resource', resourceObserver);
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Log performance summary
   */
  logPerformanceSummary() {
    const metrics = this.getMetrics();
    
    logger.log('=== Performance Summary ===');
    logger.log(`Page Load Time: ${metrics.pageLoadTime.toFixed(2)}ms`);
    logger.log(`First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms`);
    logger.log(`Largest Contentful Paint: ${metrics.largestContentfulPaint.toFixed(2)}ms`);
    logger.log(`First Input Delay: ${metrics.firstInputDelay.toFixed(2)}ms`);
    logger.log(`Cumulative Layout Shift: ${metrics.cumulativeLayoutShift.toFixed(4)}`);
    
    // Performance grades
    const grades = this.getPerformanceGrades(metrics);
    logger.log('Performance Grades:', grades);
  }

  /**
   * Get performance grades based on Core Web Vitals thresholds
   */
  getPerformanceGrades(metrics = this.metrics) {
    return {
      lcp: metrics.largestContentfulPaint <= 2500 ? 'Good' : 
           metrics.largestContentfulPaint <= 4000 ? 'Needs Improvement' : 'Poor',
      fid: metrics.firstInputDelay <= 100 ? 'Good' : 
           metrics.firstInputDelay <= 300 ? 'Needs Improvement' : 'Poor',
      cls: metrics.cumulativeLayoutShift <= 0.1 ? 'Good' : 
           metrics.cumulativeLayoutShift <= 0.25 ? 'Needs Improvement' : 'Poor',
      fcp: metrics.firstContentfulPaint <= 1800 ? 'Good' : 
           metrics.firstContentfulPaint <= 3000 ? 'Needs Improvement' : 'Poor'
    };
  }

  /**
   * Measure function execution time
   */
  measureFunction(fn, name = 'Function') {
    return async (...args) => {
      const start = performance.now();
      const result = await fn(...args);
      const end = performance.now();
      
      logger.log(`${name} execution time: ${(end - start).toFixed(2)}ms`);
      return result;
    };
  }

  /**
   * Debounce function for performance optimization
   */
  debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  /**
   * Throttle function for performance optimization
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Lazy load images with intersection observer
   */
  lazyLoadImages(selector = 'img[data-src]') {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const images = document.querySelectorAll(selector);
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  /**
   * Preload critical resources
   */
  preloadCriticalResources(resources = []) {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as || 'script';
      if (resource.type) link.type = resource.type;
      document.head.appendChild(link);
    });
  }

  /**
   * Monitor memory usage
   */
  monitorMemoryUsage() {
    if (typeof window === 'undefined' || !performance.memory) return null;

    const memory = performance.memory;
    return {
      usedJSHeapSize: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      totalJSHeapSize: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      jsHeapSizeLimit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
    };
  }

  /**
   * Clean up observers
   */
  cleanup() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
  }

  /**
   * Get bundle analysis data
   */
  getBundleAnalysis() {
    if (typeof window === 'undefined') return null;

    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    return {
      scripts: scripts.map(script => ({
        src: script.src,
        async: script.async,
        defer: script.defer
      })),
      stylesheets: stylesheets.map(link => ({
        href: link.href,
        media: link.media
      })),
      totalScripts: scripts.length,
      totalStylesheets: stylesheets.length
    };
  }
}

export default new PerformanceService();
