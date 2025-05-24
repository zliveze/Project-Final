import { useState, useEffect } from 'react';
import { getActiveEvents } from '@/services/eventService';

interface EventFromAPI {
  _id: string;
  title: string;
  description: string;
  slug: string;
  startDate: string;
  endDate: string;
  products: any[];
}

export const useActiveEvents = () => {
  const [hasActiveEvents, setHasActiveEvents] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkActiveEvents = async () => {
      try {
        setIsLoading(true);
        const eventsData = await getActiveEvents();
        
        // Kiểm tra xem có events với products hay không
        const eventsWithProducts = eventsData?.filter(
          event => event.products && event.products.length > 0
        ) || [];
        
        setHasActiveEvents(eventsWithProducts.length > 0);
        setError(null);
      } catch (err: any) {
        console.error('Error checking active events:', err);
        setError(err.message || 'Không thể kiểm tra sự kiện');
        setHasActiveEvents(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkActiveEvents();
  }, []);

  return { hasActiveEvents, isLoading, error };
};
