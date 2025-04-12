import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const LoadingOverlay: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Add html class for page transitions
    const handleStart = (url: string) => {
      // Only trigger for different routes
      if (url !== router.asPath) {
        setLoading(true);
        document.documentElement.classList.add('page-transitioning');
      }
    };

    const handleComplete = () => {
      setLoading(false);
      document.documentElement.classList.remove('page-transitioning');
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return (
    <div className={`global-loading-overlay ${loading ? 'active' : ''}`}>
      <div className="w-16 h-16 border-4 border-t-4 border-pink-500 rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingOverlay;
