/**
 * Utility functions for handling image errors
 */

/**
 * Handles image loading errors by setting a fallback image
 * 
 * @param event The error event from the image
 * @param fallbackSrc Optional custom fallback image source
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc: string = '/404.png'
) => {
  event.currentTarget.src = fallbackSrc;
};

/**
 * Handles avatar image loading errors by setting a fallback avatar
 * 
 * @param event The error event from the image
 * @param fallbackSrc Optional custom fallback avatar source
 */
export const handleAvatarError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc: string = '/images/default-avatar.png'
) => {
  event.currentTarget.src = fallbackSrc;
};

/**
 * Handles product image loading errors by setting a fallback product image
 * 
 * @param event The error event from the image
 * @param fallbackSrc Optional custom fallback product image source
 */
export const handleProductImageError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc: string = '/404.png'
) => {
  event.currentTarget.src = fallbackSrc;
};
