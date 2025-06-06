import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'react-toastify';
import axios, { AxiosError } from 'axios'; // Import axios and AxiosError
import { UserApiService } from '../UserApiService'; // Assuming correct path
import { useAuth } from '../../AuthContext'; // Assuming correct path
import axiosInstance from '../../../lib/axiosInstance';

// Define API URL - không sử dụng
// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app/api';

// Define the structure of variant options
export interface VariantOptions {
    color?: string;        // Color with optional hex code: "Red \"#FF0000\""
    sizes?: string[];      // Selected size(s)
    shades?: string[];     // Selected shade(s)
    shape?: string;        // Selected shape
    material?: string;     // Selected material
    [key: string]: unknown;    // Allow for other custom properties
}

// Define the structure of a wishlist item (matching backend response)
export interface WishlistItem {
    productId: string; // Assuming backend returns string IDs after population
    variantId: string | null; // Allow null to match source type
    name: string;
    slug: string;
    price: number;
    currentPrice: number;
    image: string; // URL of the image
    brand: {
        name: string;
        slug: string;
        logo?: string; // Optional logo URL
    } | null;
    inStock: boolean;
    variantOptions?: VariantOptions; // Optional: Color, Size, etc.
}

interface WishlistContextProps {
    wishlistItems: WishlistItem[];
    isLoading: boolean;
    error: string | null;
    itemCount: number; // Derived state for convenience
    isItemInWishlist: (productId: string, variantId: string) => boolean;
    fetchWishlist: () => Promise<void>;
    addToWishlist: (productId: string, variantId?: string) => Promise<void>;
    removeFromWishlist: (productId: string, variantId?: string) => Promise<void>;
    clearWishlistLocally: () => void; // Function to clear local state on logout
}

const WishlistContext = createContext<WishlistContextProps | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated, user, isLoading: authLoading } = useAuth();
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false); // Start as false, load on auth change
    const [error, setError] = useState<string | null>(null);

    const fetchWishlist = useCallback(async () => {
        if (!isAuthenticated || authLoading || !user) {
            // Don't fetch if not authenticated, auth is loading, or user data isn't available yet
            // console.log('Wishlist fetch skipped: User not authenticated or auth loading.');
            setWishlistItems([]); // Clear local wishlist if not authenticated
            return;
        }

        // console.log('Fetching wishlist...');
        setIsLoading(true);
        setError(null);
        try {
            const fetchedItems: WishlistItem[] | null | undefined = await UserApiService.getWishlist();
            // console.log('Raw wishlist data from API:', fetchedItems);

            const itemsArray = Array.isArray(fetchedItems) ? fetchedItems : [];

            const processedItems = itemsArray.map((item: WishlistItem) => ({
                ...item,
                variantId: item.variantId || '' // Ensure variantId is a string, not null
            }));

            setWishlistItems(processedItems);
            // console.log('Processed wishlist items set:', processedItems);
        } catch (err: unknown) {
            console.error('Error fetching wishlist:', err);
            let errorMessage = 'Không thể tải danh sách yêu thích.';

            if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError<{ message?: string }>;
                // console.error('Axios error details:', axiosError.response?.data, axiosError.message);
                if (axiosError.response?.status === 404) {
                    errorMessage = 'Danh sách yêu thích trống hoặc không tìm thấy.';
                    setWishlistItems([]); // Explicitly set to empty on 404
                } else {
                    errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
                }
            } else if (err instanceof Error) {
                // console.error('Generic error details:', err.message);
                errorMessage = err.message;
            }

            // Avoid showing toast for "not found" or empty list scenarios unless it's a different error
            if (!errorMessage.includes('Không tìm thấy') && !errorMessage.includes('trống')) {
                setError(errorMessage); // Set error state for other types of errors
                // toast.error(errorMessage); // Consider if toast is needed for all errors
            }
            
            // Ensure wishlistItems is cleared if an error other than 404 occurs,
            // or if it wasn't explicitly cleared by a 404.
            if (axios.isAxiosError(err) && (err as AxiosError).response?.status !== 404) {
                 setWishlistItems([]);
            } else if (!(err instanceof Error && err.message.includes('Không tìm thấy'))) {
                 // If not an Axios 404 and not a generic "not found", clear.
                 // This logic might need refinement based on how UserApiService.getWishlist() signals "empty" vs "error".
                 // For now, if any error other than a clear "not found" happens, we clear.
                 setWishlistItems([]);
            }

        } finally {
            setIsLoading(false);
            // console.log('Wishlist fetch finished.');
        }
    }, [isAuthenticated, authLoading, user]); // Depend on authentication state

    // Fetch wishlist when authentication status changes or user data is loaded
    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]); // fetchWishlist includes dependencies

    const addToWishlist = async (productId: string, variantId?: string) => {
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để thêm vào danh sách yêu thích.', {
                position: "bottom-right"
            });
            return;
        }

        // Debug logging
        console.log('Adding to wishlist with:', { productId, variantId });

        // Validate inputs
        if (!productId) {
            console.error('Missing productId in addToWishlist');
            toast.error('Lỗi: Thiếu thông tin sản phẩm', {
                position: "bottom-right"
            });
            return;
        }

        // For products without variants, use empty string
        const variantIdToUse = variantId || '';

        // Prevent adding if already exists locally (optimistic update)
        if (isItemInWishlist(productId, variantIdToUse)) {
             toast.info('Sản phẩm này đã có trong danh sách yêu thích.', {
                 position: "bottom-right"
             });
             return;
        }

        setIsLoading(true); // Indicate loading state
        try {
            // Call API
            const result = await UserApiService.addToWishlist(productId, variantIdToUse);
            console.log('Wishlist API response:', result);

            // Refetch wishlist to get the updated list including populated data
            await fetchWishlist();

            toast.success('Đã thêm vào danh sách yêu thích!', {
                 style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
            });

            // Ghi lại hoạt động thêm vào danh sách yêu thích (sử dụng click endpoint)
            try {
                await axiosInstance.post(`/recommendations/log/click/${productId}`, {
                    variantId: variantIdToUse || undefined
                });
            } catch (error) {
                console.error('Error logging wishlist activity:', error);
            }

        } catch (err) {
            console.error('Error adding to wishlist:', err);
            const errorMessage = err instanceof Error ? err.message : 'Không thể thêm vào danh sách yêu thích.';
            toast.error(errorMessage);
            setError(errorMessage); // Set error state
        } finally {
            setIsLoading(false); // Reset loading state
        }
    };

    const removeFromWishlist = async (productId: string, variantId?: string) => {
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để thực hiện thao tác này.');
            return;
        }

        // For products without variants, use empty string
        const variantIdToUse = variantId || '';

        // Optimistic UI update: Remove immediately from local state
        const originalItems = wishlistItems;
        setWishlistItems(prevItems =>
            prevItems.filter(item => !(item.productId === productId && item.variantId === variantIdToUse))
        );

        try {
            // Call API
            await UserApiService.removeFromWishlist(productId, variantIdToUse);
            toast.success('Đã xóa khỏi danh sách yêu thích.', {
                 style: { backgroundColor: '#fef2f2', color: '#dc2626', borderLeft: '4px solid #dc2626' }
            });
            // No need to refetch here as the optimistic update handles the UI change
        } catch (err) {
            console.error('Error removing from wishlist:', err);
            const errorMessage = err instanceof Error ? err.message : 'Không thể xóa khỏi danh sách yêu thích.';
            toast.error(errorMessage);
            // Rollback optimistic update on error
            setWishlistItems(originalItems);
            setError(errorMessage); // Set error state
        }
        // No finally setIsLoading(false) needed for optimistic update
    };

    // Helper function to check if an item exists
    const isItemInWishlist = (productId: string, variantId: string): boolean => {
        // For products without variants, variantId will be empty string
        return wishlistItems.some(item => item.productId === productId && item.variantId === variantId);
    };

    // Function to clear local state, e.g., on logout
    const clearWishlistLocally = () => {
        setWishlistItems([]);
        setError(null);
        setIsLoading(false);
    };


    const itemCount = wishlistItems.length;

    return (
        <WishlistContext.Provider value={{
            wishlistItems,
            isLoading,
            error,
            itemCount,
            isItemInWishlist,
            fetchWishlist,
            addToWishlist,
            removeFromWishlist,
            clearWishlistLocally
        }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = (): WishlistContextProps => {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};
