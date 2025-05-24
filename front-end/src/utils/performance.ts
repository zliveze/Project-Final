import { gsap } from 'gsap';

// Performance optimization utilities for GSAP
export const performanceUtils = {
  // Force hardware acceleration for elements
  set3D: (elements: any) => {
    gsap.set(elements, { 
      force3D: true,
      transformPerspective: 1000,
      transformOrigin: "center center",
      backfaceVisibility: "hidden"
    });
  },

  // Batch DOM updates for better performance
  batchUpdate: (callback: () => void) => {
    gsap.ticker.add(callback, true);
  },

  // Lazy loading with intersection observer
  lazyAnimate: (elements: NodeListOf<Element>, animation: any) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          gsap.to(entry.target, animation);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    elements.forEach((el) => observer.observe(el));
    return observer;
  },

  // Preload and cache animations
  preloadAnimations: () => {
    // Pre-create commonly used timelines to reduce creation overhead
    const commonTimelines = {
      fadeIn: gsap.timeline({ paused: true }),
      slideUp: gsap.timeline({ paused: true }),
      scale: gsap.timeline({ paused: true })
    };

    // Setup common animations
    commonTimelines.fadeIn.fromTo('.fade-target', 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.5 }
    );

    commonTimelines.slideUp.fromTo('.slide-target',
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6 }
    );

    commonTimelines.scale.fromTo('.scale-target',
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5 }
    );

    return commonTimelines;
  },

  // Throttle scroll events for better performance
  throttleScroll: (callback: () => void, delay: number = 16) => {
    let timeoutId: NodeJS.Timeout;
    let lastExecTime = 0;
    
    return () => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        callback();
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          callback();
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  },

  // Disable animations on low-power devices
  checkPerformance: () => {
    const isLowPower = 
      // Check for reduced motion preference
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      // Check for low-end device indicators
      navigator.hardwareConcurrency <= 2 ||
      (navigator as any).deviceMemory <= 2 ||
      // Check for slow connection
      (navigator as any).connection?.effectiveType === 'slow-2g' ||
      (navigator as any).connection?.effectiveType === '2g';

    return {
      isLowPower,
      shouldReduceAnimations: isLowPower
    };
  },

  // Clean up animations on component unmount
  cleanup: () => {
    gsap.killTweensOf('*');
    gsap.globalTimeline.clear();
  },

  // Optimize for mobile devices
  mobileOptimizations: () => {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // Reduce animation complexity on mobile
      gsap.config({
        force3D: true,
        nullTargetWarn: false
      });

      // Disable expensive effects on mobile
      return {
        reduceParticles: true,
        disableParallax: true,
        simplifyTransitions: true
      };
    }

    return {
      reduceParticles: false,
      disableParallax: false,
      simplifyTransitions: false
    };
  },

  // Memory management for long-running animations
  memoryManager: {
    animationPool: new Map(),
    
    getAnimation: (key: string, factory: () => gsap.core.Timeline) => {
      if (!performanceUtils.memoryManager.animationPool.has(key)) {
        performanceUtils.memoryManager.animationPool.set(key, factory());
      }
      return performanceUtils.memoryManager.animationPool.get(key);
    },

    clearPool: () => {
      performanceUtils.memoryManager.animationPool.forEach((animation) => {
        animation.kill();
      });
      performanceUtils.memoryManager.animationPool.clear();
    }
  },

  // Performance monitoring
  monitor: {
    startTime: 0,
    
    start: () => {
      performanceUtils.monitor.startTime = performance.now();
    },

    end: (label: string) => {
      const endTime = performance.now();
      const duration = endTime - performanceUtils.monitor.startTime;
      
      if (duration > 16.67) { // More than one frame at 60fps
        console.warn(`Animation "${label}" took ${duration.toFixed(2)}ms (>16.67ms)`);
      }
      
      return duration;
    }
  }
};

// Auto-apply performance optimizations on initialization
export const initPerformanceOptimizations = () => {
  const { shouldReduceAnimations } = performanceUtils.checkPerformance();
  const mobileOpts = performanceUtils.mobileOptimizations();

  // Set global GSAP config based on device capabilities
  if (shouldReduceAnimations) {
    gsap.config({
      force3D: false,
      nullTargetWarn: false
    });
    
    // Disable complex animations globally
    gsap.globalTimeline.timeScale(0.5); // Slow down all animations
  } else {
    gsap.config({
      force3D: true,
      nullTargetWarn: false
    });
  }

  // Apply mobile optimizations
  if (mobileOpts.simplifyTransitions) {
    gsap.defaults({
      duration: 0.3, // Shorter durations on mobile
      ease: "power2.out" // Simpler easing
    });
  }

  return {
    shouldReduceAnimations,
    mobileOptimizations: mobileOpts
  };
};

// Export performance-optimized animation presets
export const optimizedAnimations = {
  fadeIn: (target: any, options: any = {}) => {
    return gsap.fromTo(target,
      { opacity: 0 },
      { 
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
        ...options
      }
    );
  },

  slideUp: (target: any, options: any = {}) => {
    return gsap.fromTo(target,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power3.out",
        ...options
      }
    );
  },

  scaleIn: (target: any, options: any = {}) => {
    return gsap.fromTo(target,
      { scale: 0.8, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: "back.out(1.7)",
        ...options
      }
    );
  },

  staggerReveal: (targets: any, options: any = {}) => {
    return gsap.fromTo(targets,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        ...options
      }
    );
  }
}; 