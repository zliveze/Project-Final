import { EventFromAPI } from '@/components/home/EventsSection'; // Assuming EventFromAPI is exported from EventsSection or a shared types file
import axiosInstance from '@/lib/axios'; // Assuming you have an axios instance configured

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Fetches active events from the backend.
 * Assumes the API returns an array of events, and we'll take the first one
 * if multiple active events are returned, or handle as needed.
 * For now, let's assume it might return one or more, and the component
 * will decide which one to display or if it should display products from multiple events.
 * Based on the current UI, it seems like it displays one event at a time.
 */
export const getActiveEvents = async (): Promise<EventFromAPI[]> => {
  try {
    const response = await axiosInstance.get<EventFromAPI[]>(`${API_URL}/events/active`);
    return response.data;
  } catch (error: unknown) { // Thay thế any bằng unknown để an toàn hơn
    console.error('Error fetching active events:', error);
    // It's better to throw the error and let the component handle it
    // This allows for more specific error messages or UI changes in the component
    if (error && typeof error === 'object' && 'response' in error) {
      const errorWithResponse = error as { 
        response?: { 
          data?: { message?: string }, 
          status?: number 
        },
        request?: unknown
      };
      
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (errorWithResponse.response && errorWithResponse.response.data && errorWithResponse.response.status) {
        const message = typeof errorWithResponse.response.data.message === 'string' 
          ? errorWithResponse.response.data.message 
          : JSON.stringify(errorWithResponse.response.data.message);
        throw new Error(`Server responded with ${errorWithResponse.response.status}: ${message || 'Failed to fetch active events'}`);
      } else if (errorWithResponse.request) {
        // The request was made but no response was received
        throw new Error('No response from server while fetching active events.');
      } else {
        // Something happened in setting up the request that triggered an Error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error('Error fetching active events: ' + (errorMessage || 'Unknown error'));
      }
    } else {
      // Fallback for unexpected error types
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error('Error fetching active events: ' + errorMessage);
    }
  }
};
