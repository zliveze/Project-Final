import React from 'react';
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

export default function Home() {
  return (
    <DefaultLayout>
      <Herobanners />
      <CouponSection />
      <EventsSection />
      <CategorySection />
      <BrandSection />
      <BestSellerSection />
      <TopSearchSection />
      <RecommendationSection />
      <CustomerReviewsSection />
    </DefaultLayout>
  );
}
