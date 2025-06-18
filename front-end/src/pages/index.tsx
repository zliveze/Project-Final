import React from 'react';
import dynamic from 'next/dynamic';
import DefaultLayout from '@/layout/DefaultLayout';
import Herobanners from '@/components/home/Herobanners';
import CouponSection from '@/components/home/CouponSection';
import { useActiveEvents } from '@/hooks/useActiveEvents';

const EventsSection = dynamic(() => import('@/components/home/EventsSection'));
const CategorySection = dynamic(() => import('@/components/home/CategorySection'));
const BrandSection = dynamic(() => import('@/components/home/BrandSection'));
const BestSellerSection = dynamic(() => import('@/components/home/BestSellerSection'));
const TopSearchSection = dynamic(() => import('@/components/home/TopSearchSection'));
const RecommendationSection = dynamic(() => import('@/components/home/RecommendationSection'));
const CustomerReviewsSection = dynamic(() => import('@/components/home/CustomerReviewsSection'));

export default function Home() {
  const { hasActiveEvents } = useActiveEvents();

  return (
    <DefaultLayout>
      <div className="home-content relative">
        {/* Simple background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50/20 via-pink-50/15 to-purple-50/10"></div>
        </div>

        {/* Content Sections - High contrast alternating backgrounds */}
        <div className="relative z-10">
          {/* Hero Section - White */}
          <div className="bg-white border-b border-gray-200">
            <Herobanners />
          </div>

          {/* Coupon Section - Gray */}
          <div className="py-1 bg-gray-50 border-b border-gray-200">
            <CouponSection />
          </div>

          {/* Conditional Events Section - White */}
          {hasActiveEvents && (
            <div className="py-1 bg-white border-b border-gray-200">
              <EventsSection />
            </div>
          )}

          {/* Category Section - Gray */}
          <div className="py-1 bg-gray-50 border-b border-gray-200">
            <CategorySection />
          </div>

          {/* Brand Section - White */}
          <div className="py-1 bg-white border-b border-gray-200">
            <BrandSection />
          </div>

          {/* Best Seller Section - Gray */}
          <div className="py-1 bg-gray-50 border-b border-gray-200">
            <BestSellerSection />
          </div>

          {/* Top Search Section - White */}
          <div className="py-1 bg-white border-b border-gray-200">
            <TopSearchSection />
          </div>

          {/* Recommendation Section - Gray */}
          <div className="py-1 bg-gray-50 border-b border-gray-200">
            <RecommendationSection />
          </div>

          {/* Customer Reviews Section - White */}
          <div className="py-1 bg-white">
            <CustomerReviewsSection />
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
