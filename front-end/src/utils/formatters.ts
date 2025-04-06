/**
 * Utility functions for formatting data
 */

/**
 * Format a date to a human-readable string
 * @param date Date object or string
 * @returns Formatted date string in Vietnamese format
 */
export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format a number as a price with currency symbol
 * @param price Number to format
 * @param currencyCode Currency code (default: 'VND')
 * @returns Formatted price string with currency symbol
 */
export const formatPrice = (price: number, currencyCode: string = 'VND'): string => {
  if (price === undefined || price === null) return '';
  
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: currencyCode 
  }).format(price);
};

/**
 * Format a number with thousand separators
 * @param num Number to format
 * @returns Formatted number string with thousand separators
 */
export const formatNumber = (num: number): string => {
  if (num === undefined || num === null) return '';
  
  return new Intl.NumberFormat('vi-VN').format(num);
};

/**
 * Truncate a string if it exceeds a certain length
 * @param str String to truncate
 * @param maxLength Maximum length before truncating
 * @returns Truncated string with ellipsis
 */
export const truncateString = (str: string, maxLength: number = 50): string => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  
  return str.slice(0, maxLength) + '...';
}; 