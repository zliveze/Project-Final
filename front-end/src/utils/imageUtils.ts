/**
 * Utility functions for handling images
 */

/**
 * Ensures an image URL is properly formatted for Next.js Image component
 * Next.js requires image URLs to either be absolute (http/https) or start with a leading slash
 *
 * @param url The image URL to format
 * @returns Properly formatted URL
 */
export const formatImageUrl = (url: string): string => {
  if (!url) return '/404.png';

  // If URL already starts with http/https or a slash, return as is
  if (url.startsWith('http') || url.startsWith('/')) {
    return url;
  }

  // If it's a Cloudinary URL without http/https prefix
  if (url.includes('cloudinary.com') || url.startsWith('res.cloudinary.com')) {
    return `https://${url}`;
  }

  // For other relative paths, add a leading slash
  return `/${url}`;
};
