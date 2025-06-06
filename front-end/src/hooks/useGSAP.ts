import { useLayoutEffect, useRef, RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

// Define types to replace 'any'
type GSAPElement = string | Element | Element[] | NodeList | null
type GSAPTween = gsap.core.Tween
type GSAPTimeline = gsap.core.Timeline

interface AnimationOptions {
  duration?: number
  ease?: string
  delay?: number
  stagger?: number
  [key: string]: unknown
}

interface ScrollTriggerOptions {
  trigger?: GSAPElement
  start?: string
  end?: string
  scrub?: boolean | number
  onEnter?: () => void
  onLeave?: () => void
  onEnterBack?: () => void
  onLeaveBack?: () => void
  [key: string]: unknown
}

interface GSAPContext {
  gsap: typeof gsap
  animations: typeof animations
  ScrollTrigger: typeof ScrollTrigger
}

// Animation presets
export const animations = {
  // Fade in from bottom
  fadeInUp: (element: GSAPElement, options: AnimationOptions = {}): GSAPTween => {
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
  fadeInScale: (element: GSAPElement, options: AnimationOptions = {}): GSAPTween => {
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
  staggerReveal: (elements: GSAPElement, options: AnimationOptions = {}): GSAPTween => {
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
  magneticHover: (element: Element, strength: number = 0.3): (() => void) => {
    const btn = element as HTMLElement
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
  morphShape: (element: GSAPElement, options: AnimationOptions & { target?: string } = {}): GSAPTween => {
    return gsap.to(element, {
      morphSVG: options.target,
      duration: 0.8,
      ease: "power2.inOut",
      ...options
    })
  },

  // Parallax effect
  parallax: (element: GSAPElement, speed: number = 0.5): GSAPTween => {
    return gsap.to(element, {
      yPercent: -50 * speed,
      ease: "none",
      scrollTrigger: {
        trigger: element as gsap.DOMTarget, // Ensure compatibility
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    })
  },

  // Elastic bounce
  elasticBounce: (element: GSAPElement, options: AnimationOptions = {}): GSAPTween => {
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
  textReveal: (element: HTMLElement, options: AnimationOptions = {}): GSAPTween => {
    const chars = element.textContent?.split('') || []
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
  callback: (context: GSAPContext) => void,
  dependencies: React.DependencyList = []
) => {
  const contextRef = useRef<gsap.Context | null>(null) // Initialize with null

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      callback({ gsap, animations, ScrollTrigger })
    })

    contextRef.current = context

    return () => context.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, ...dependencies])

  return contextRef.current
}

// Helper hook for scroll-triggered animations
export const useScrollAnimation = (
  trigger: RefObject<HTMLElement>,
  animation: (element: HTMLElement) => void,
  options: ScrollTriggerOptions = {}
) => {
  useLayoutEffect(() => {
    if (!trigger.current) return

    const element = trigger.current
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { trigger: _optionTrigger, ...restOptions } = options; // Destructure to separate options.trigger

    ScrollTrigger.create({
      trigger: element as gsap.DOMTarget, // Ensure 'element' is the trigger
      start: "top 80%",
      onEnter: () => animation(element),
      ...restOptions // Spread remaining options
    })

    return () => {
      ScrollTrigger.getAll().forEach(st => {
        if (st.trigger === element) {
          st.kill()
        }
      })
    }
  }, [trigger, animation, options])
}

// Performance optimization utilities
export const gsapUtils = {
  // Force hardware acceleration
  set3D: (element: GSAPElement): void => {
    gsap.set(element, { force3D: true, transformPerspective: 1000 })
  },

  // Batch DOM updates
  batch: (elements: GSAPElement[], animation: AnimationOptions): GSAPTween => {
    return gsap.to(elements, { ...animation })
  },

  // Kill all animations for cleanup
  killAll: (): void => {
    gsap.globalTimeline.clear()
    ScrollTrigger.getAll().forEach(st => st.kill())
  },

  // Refresh ScrollTrigger (useful after layout changes)
  refresh: (): void => {
    ScrollTrigger.refresh()
  },

  // Create timeline with default settings
  timeline: (options: AnimationOptions = {}): GSAPTimeline => {
    return gsap.timeline({
      ease: "power2.out",
      ...options
    })
  }
}
