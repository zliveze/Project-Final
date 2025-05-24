import { useLayoutEffect, useRef, RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

// Animation presets
export const animations = {
  // Fade in from bottom
  fadeInUp: (element: any, options: any = {}) => {
    return gsap.fromTo(element, 
      { y: 50, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.8,
        ease: "power3.out",
        ...options 
      }
    )
  },

  // Fade in with scale
  fadeInScale: (element: any, options: any = {}) => {
    return gsap.fromTo(element,
      { scale: 0.8, opacity: 0 },
      { 
        scale: 1, 
        opacity: 1, 
        duration: 0.6,
        ease: "back.out(1.7)",
        ...options 
      }
    )
  },

  // Stagger animation for lists
  staggerReveal: (elements: any, options: any = {}) => {
    return gsap.fromTo(elements,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.1,
        ...options
      }
    )
  },

  // Magnetic hover effect
  magneticHover: (element: any, strength: number = 0.3) => {
    const btn = element
    const handleMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const deltaX = (e.clientX - centerX) * strength
      const deltaY = (e.clientY - centerY) * strength
      
      gsap.to(btn, {
        x: deltaX,
        y: deltaY,
        duration: 0.3,
        ease: "power2.out"
      })
    }

    const handleMouseLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.3)"
      })
    }

    btn.addEventListener('mousemove', handleMouseMove)
    btn.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      btn.removeEventListener('mousemove', handleMouseMove)
      btn.removeEventListener('mouseleave', handleMouseLeave)
    }
  },

  // Smooth morphing animation
  morphShape: (element: any, options: any = {}) => {
    return gsap.to(element, {
      morphSVG: options.target,
      duration: 0.8,
      ease: "power2.inOut",
      ...options
    })
  },

  // Parallax effect
  parallax: (element: any, speed: number = 0.5) => {
    return gsap.to(element, {
      yPercent: -50 * speed,
      ease: "none",
      scrollTrigger: {
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    })
  },

  // Elastic bounce
  elasticBounce: (element: any, options: any = {}) => {
    return gsap.fromTo(element,
      { scale: 0 },
      {
        scale: 1,
        duration: 0.8,
        ease: "elastic.out(1, 0.5)",
        ...options
      }
    )
  },

  // Text reveal animation
  textReveal: (element: any, options: any = {}) => {
    const chars = element.textContent.split('')
    element.innerHTML = chars.map((char: string) => 
      `<span style="display: inline-block;">${char === ' ' ? '&nbsp;' : char}</span>`
    ).join('')
    
    const charElements = element.querySelectorAll('span')
    
    return gsap.fromTo(charElements,
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: "back.out(1.7)",
        stagger: 0.03,
        ...options
      }
    )
  }
}

// Main useGSAP hook
export const useGSAP = (
  callback: (context: any) => void,
  dependencies: any[] = []
) => {
  const contextRef = useRef<any>()

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      callback({ gsap, animations, ScrollTrigger })
    })
    
    contextRef.current = context
    
    return () => context.revert()
  }, dependencies)

  return contextRef.current
}

// Helper hook for scroll-triggered animations
export const useScrollAnimation = (
  trigger: RefObject<HTMLElement>,
  animation: (element: HTMLElement) => void,
  options: any = {}
) => {
  useLayoutEffect(() => {
    if (!trigger.current) return

    const element = trigger.current
    
    ScrollTrigger.create({
      trigger: element,
      start: "top 80%",
      onEnter: () => animation(element),
      ...options
    })

    return () => {
      ScrollTrigger.getAll().forEach(st => {
        if (st.trigger === element) {
          st.kill()
        }
      })
    }
  }, [trigger, animation])
}

// Performance optimization utilities
export const gsapUtils = {
  // Force hardware acceleration
  set3D: (element: any) => {
    gsap.set(element, { force3D: true, transformPerspective: 1000 })
  },

  // Batch DOM updates
  batch: (elements: any[], animation: any) => {
    return gsap.to(elements, { ...animation })
  },

  // Kill all animations for cleanup
  killAll: () => {
    gsap.globalTimeline.clear()
    ScrollTrigger.getAll().forEach(st => st.kill())
  },

  // Refresh ScrollTrigger (useful after layout changes)
  refresh: () => {
    ScrollTrigger.refresh()
  },

  // Create timeline with default settings
  timeline: (options: any = {}) => {
    return gsap.timeline({
      ease: "power2.out",
      ...options
    })
  }
} 