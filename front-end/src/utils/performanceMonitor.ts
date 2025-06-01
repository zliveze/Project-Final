/**
 * Performance monitoring utilities for product pages
 */

// Define proper types for performance entries
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Observe Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.set('lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // Observe First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.metrics.set('fid', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // Observe Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const layoutShiftEntry = entry as LayoutShiftEntry;
            if (!layoutShiftEntry.hadRecentInput) {
              clsValue += layoutShiftEntry.value;
            }
          });
          this.metrics.set('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Performance Observer not supported:', error);
        }
      }
    }
  }

  // Mark the start of a performance measurement
  markStart(name: string): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-start`);
    }
  }

  // Mark the end of a performance measurement and calculate duration
  markEnd(name: string): number {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-end`);
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        const duration = measure.duration;
        this.metrics.set(name, duration);
        return duration;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Performance measurement failed for ${name}:`, error);
        }
        return 0;
      }
    }
    return 0;
  }

  // Get a specific metric
  getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }

  // Get all metrics
  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Log performance metrics (only in development)
  logMetrics(): void {
    if (process.env.NODE_ENV === 'development') {
      console.group('🚀 Performance Metrics');
      console.table(this.getAllMetrics());
      console.groupEnd();
    }
  }

  // Send metrics to analytics (placeholder for future implementation)
  sendMetrics(): void {
    if (process.env.NODE_ENV === 'production') {
      const metrics = this.getAllMetrics();
      // TODO: Send to analytics service
      // Example: analytics.track('page_performance', metrics);
      console.log('Performance metrics ready for analytics:', metrics);
    }
  }

  // Cleanup observers
  cleanup(): void {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch {
        // Ignore cleanup errors
        console.warn('Error disconnecting performance observer');
      }
    });
    this.observers = [];
    this.metrics.clear();
  }

  // Measure component render time
  measureComponentRender<T>(componentName: string, renderFn: () => T): T {
    this.markStart(`component-${componentName}`);
    const result = renderFn();
    this.markEnd(`component-${componentName}`);
    return result;
  }

  // Measure API call time
  async measureApiCall<T>(apiName: string, apiCall: () => Promise<T>): Promise<T> {
    this.markStart(`api-${apiName}`);
    try {
      const result = await apiCall();
      this.markEnd(`api-${apiName}`);
      return result;
    } catch (error) {
      this.markEnd(`api-${apiName}`);
      throw error;
    }
  }

  // Measure image load time
  measureImageLoad(imageUrl: string): Promise<number> {
    return new Promise((resolve) => {
      const img = new Image();
      const startTime = performance.now();
      
      img.onload = () => {
        const loadTime = performance.now() - startTime;
        this.metrics.set(`image-${imageUrl}`, loadTime);
        resolve(loadTime);
      };
      
      img.onerror = () => {
        const loadTime = performance.now() - startTime;
        this.metrics.set(`image-error-${imageUrl}`, loadTime);
        resolve(loadTime);
      };
      
      img.src = imageUrl;
    });
  }

  // Get Web Vitals summary
  getWebVitals(): {
    lcp: number | undefined;
    fid: number | undefined;
    cls: number | undefined;
  } {
    return {
      lcp: this.getMetric('lcp'),
      fid: this.getMetric('fid'),
      cls: this.getMetric('cls'),
    };
  }

  // Check if performance is good based on Web Vitals thresholds
  isPerformanceGood(): boolean {
    const vitals = this.getWebVitals();
    const lcpGood = !vitals.lcp || vitals.lcp <= 2500; // 2.5s
    const fidGood = !vitals.fid || vitals.fid <= 100; // 100ms
    const clsGood = !vitals.cls || vitals.cls <= 0.1; // 0.1
    
    return lcpGood && fidGood && clsGood;
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  return {
    markStart: performanceMonitor.markStart.bind(performanceMonitor),
    markEnd: performanceMonitor.markEnd.bind(performanceMonitor),
    getMetric: performanceMonitor.getMetric.bind(performanceMonitor),
    getAllMetrics: performanceMonitor.getAllMetrics.bind(performanceMonitor),
    logMetrics: performanceMonitor.logMetrics.bind(performanceMonitor),
    sendMetrics: performanceMonitor.sendMetrics.bind(performanceMonitor),
    measureComponentRender: performanceMonitor.measureComponentRender.bind(performanceMonitor),
    measureApiCall: performanceMonitor.measureApiCall.bind(performanceMonitor),
    measureImageLoad: performanceMonitor.measureImageLoad.bind(performanceMonitor),
    getWebVitals: performanceMonitor.getWebVitals.bind(performanceMonitor),
    isPerformanceGood: performanceMonitor.isPerformanceGood.bind(performanceMonitor),
  };
};

export default performanceMonitor;
