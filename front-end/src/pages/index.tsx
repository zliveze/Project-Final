import React, { useState, useEffect } from 'react';
import DefaultLayout from '@/layout/DefaultLayout';
import Herobanners from '@/components/home/Herobanners';
import EventsSection from '@/components/home/EventsSection';
import CategorySection from '@/components/home/CategorySection';
import BrandSection from '@/components/home/BrandSection';
import BestSellerSection from '@/components/home/BestSellerSection';
import TopSearchSection from '@/components/home/TopSearchSection';
import RecommendationSection from '@/components/home/RecommendationSection';
import CouponSection from '@/components/home/CouponSection';
import CustomerReviewsSection from '@/components/home/CustomerReviewsSection';
import PageLoader from '@/components/ui/PageLoader';
import { useActiveEvents } from '@/hooks/useActiveEvents';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const { hasActiveEvents } = useActiveEvents();

  // Handle page loading
  useEffect(() => {
    // Simulate minimum loading time for smooth experience
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleLoaderComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      {/* Page Loader */}
      {isLoading && <PageLoader onComplete={handleLoaderComplete} />}

      {/* Main Content */}
      <DefaultLayout>
        <div className="home-content relative overflow-hidden">
          {/* Unified Background System - Rose/Pink Theme */}
          <div className="fixed inset-0 pointer-events-none z-0">
            {/* Primary unified gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50/40 via-pink-50/30 to-purple-50/20"></div>
            
            {/* Subtle floating orbs - Rose/Pink theme only */}
            <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-r from-rose-200/15 to-pink-200/15 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/3 left-10 w-64 h-64 bg-gradient-to-r from-pink-200/10 to-rose-200/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-32 right-1/4 w-80 h-80 bg-gradient-to-r from-rose-100/8 to-pink-100/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
            
            {/* Ultra-subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.015]" 
                 style={{
                   backgroundImage: `radial-gradient(circle at 1px 1px, rgba(244, 63, 94, 0.1) 1px, transparent 0)`,
                   backgroundSize: '40px 40px'
                 }}>
            </div>
          </div>

          {/* Content Sections - Clean spacing without individual backgrounds */}
          <div className="relative z-10">
            {/* Hero Section */}
            <div className="home-section">
              <Herobanners />
            </div>

            {/* Minimal decorative divider - Rose theme */}
            <div className="flex justify-center py-2">
              <div className="flex items-center space-x-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent via-rose-300/30 to-transparent"></div>
                <div className="w-2 h-2 bg-rose-300/40 rounded-full"></div>
                <div className="h-px w-24 bg-gradient-to-r from-rose-300/30 via-pink-300/30 to-rose-300/30"></div>
                <div className="w-2 h-2 bg-pink-300/40 rounded-full"></div>
                <div className="h-px w-12 bg-gradient-to-r from-transparent via-pink-300/30 to-transparent"></div>
              </div>
            </div>

            {/* Coupon Section */}
            <div className="home-section py-2">
              <CouponSection />
            </div>

            <div className="py-2"></div>

            {/* Conditional Events Section */}
            {hasActiveEvents && (
              <>
                <div className="home-section">
                  <EventsSection />
                </div>
                <div className="py-2"></div>
              </>
            )}

            {/* Category Section */}
            <div className="home-section py-2">
              <CategorySection />
            </div>

            {/* Subtle divider */}
            <div className="flex justify-center py-2">
              <div className="flex items-center space-x-6">
                <div className="h-px w-16 bg-gradient-to-r from-transparent via-rose-400/20 to-rose-400/20"></div>
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-rose-400/30 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-pink-400/30 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-rose-400/30 rounded-full"></div>
                </div>
                <div className="h-px w-16 bg-gradient-to-r from-rose-400/20 to-transparent"></div>
              </div>
            </div>

            {/* Brand Section */}
            <div className="home-section py-2">
              <BrandSection />
            </div>

            {/* Best Seller Section - No additional background */}
            <div className="home-section py-2">
              <BestSellerSection />
            </div>

            <div className="py-2"></div>

            {/* Top Search Section */}
            <div className="home-section py-2">
              <TopSearchSection />
            </div>

            {/* Recommendation Section - No additional background */}
            <div className="home-section py-2">
              <RecommendationSection />
            </div>

            <div className="py-2"></div>

            {/* Customer Reviews Section */}
            <div className="home-section py-2">
              <CustomerReviewsSection />
            </div>

            {/* Bottom decorative element - Rose theme */}
            <div className="flex justify-center pb-2 py-2">
              <div className="flex items-center space-x-8">
                <div className="h-px w-20 bg-gradient-to-r from-transparent via-rose-300/25 to-rose-300/25"></div>
                <div className="w-3 h-3 bg-gradient-to-r from-rose-400/60 to-pink-400/60 rounded-full shadow-lg"></div>
                <div className="h-px w-32 bg-gradient-to-r from-rose-300/25 via-pink-300/25 to-rose-300/25"></div>
                <div className="w-3 h-3 bg-gradient-to-r from-pink-400/60 to-rose-400/60 rounded-full shadow-lg"></div>
                <div className="h-px w-20 bg-gradient-to-r from-rose-300/25 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </DefaultLayout>

      <style jsx>{`
        .home-content {
          min-height: 100vh;
          position: relative;
        }

        .home-section {
          transform: translateZ(0);
          will-change: transform, opacity;
          position: relative;
        }

        /* Smooth animations with consistent timing */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes pulse-soft {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.6; }
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-pulse-soft {
          animation: pulse-soft 6s ease-in-out infinite;
        }

        /* Smooth scroll behavior */
        .home-content {
          scroll-behavior: smooth;
        }

        /* Section transitions - Unified timing */
        .home-section {
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Enhanced backdrop blur effects */
        @supports (backdrop-filter: blur(10px)) {
          .backdrop-blur-custom {
            backdrop-filter: blur(10px) saturate(150%);
          }
        }
      `}</style>
    </>
  );
}
