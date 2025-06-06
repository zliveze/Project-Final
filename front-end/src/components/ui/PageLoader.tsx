import React, { useRef } from 'react';
import { useGSAP, gsapUtils } from '../../hooks/useGSAP';

interface PageLoaderProps {
  onComplete?: () => void;
  duration?: number;
}

export default function PageLoader({ onComplete }: PageLoaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null);

  useGSAP(({ gsap }) => {
    if (!loaderRef.current) return;

    const tl = gsapUtils.timeline({
      onComplete: () => {
        onComplete?.();
      }
    });

    // Set initial states
    gsap.set('.loader-logo', { scale: 0, opacity: 0, rotation: -180 });
    gsap.set('.loader-text', { y: 30, opacity: 0 });
    gsap.set('.loader-progress', { scaleX: 0 });
    gsap.set('.loader-dots .dot', { scale: 0, opacity: 0 });
    gsap.set('.loader-sparkle', { scale: 0, opacity: 0, rotation: 0 });

    // Main loading animation sequence
    tl
      // Logo entrance with rotation
      .to('.loader-logo', {
        scale: 1,
        opacity: 1,
        rotation: 0,
        duration: 0.8,
        ease: "back.out(1.7)"
      })
      
      // Text entrance
      .to('.loader-text', {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power3.out"
      }, "-=0.4")
      
      // Dots animation
      .to('.loader-dots .dot', {
        scale: 1,
        opacity: 1,
        duration: 0.4,
        stagger: 0.1,
        ease: "back.out(1.7)"
      }, "-=0.2")
      
      // Progress bar animation
      .to('.loader-progress', {
        scaleX: 1,
        duration: 1.2,
        ease: "power2.inOut"
      }, "-=0.3")
      
      // Sparkles animation
      .to('.loader-sparkle', {
        scale: 1,
        opacity: 0.8,
        rotation: 360,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
      }, "-=0.8")
      
      // Pulsing effect for logo
      .to('.loader-logo', {
        scale: 1.1,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      }, "-=0.4")
      
      // Final exit animation
      .to('.loader-content', {
        scale: 0.9,
        opacity: 0,
        duration: 0.5,
        ease: "power2.in"
      }, "+=0.2")
      
      .to(loaderRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in"
      }, "-=0.2");

    // Floating animation for sparkles
    gsap.to('.loader-sparkle', {
      y: -10,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
      stagger: 0.2,
      delay: 0.5
    });

  }, []);

  return (
    <div 
      ref={loaderRef}
      className="fixed inset-0 z-50 bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="loader-content relative z-10 text-center">
        {/* Logo Section */}
        <div className="loader-logo relative mb-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            Y
          </div>
          
          {/* Sparkles around logo */}
          <div className="loader-sparkle absolute -top-2 -left-2 w-3 h-3 bg-yellow-400 rounded-full"></div>
          <div className="loader-sparkle absolute -top-1 -right-3 w-2 h-2 bg-pink-400 rounded-full"></div>
          <div className="loader-sparkle absolute -bottom-2 -left-3 w-2 h-2 bg-purple-400 rounded-full"></div>
          <div className="loader-sparkle absolute -bottom-1 -right-2 w-3 h-3 bg-blue-400 rounded-full"></div>
        </div>

        {/* Brand Text */}
        <div className="loader-text mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Yumin Beauty
          </h1>
          <p className="text-gray-600 text-sm">Đang tải trang chủ...</p>
        </div>

        {/* Loading Dots */}
        <div className="loader-dots flex justify-center space-x-2 mb-6">
          <div className="dot w-3 h-3 bg-pink-400 rounded-full"></div>
          <div className="dot w-3 h-3 bg-purple-400 rounded-full"></div>
          <div className="dot w-3 h-3 bg-blue-400 rounded-full"></div>
        </div>

        {/* Progress Bar */}
        <div className="w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
          <div className="loader-progress h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full origin-left"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
} 