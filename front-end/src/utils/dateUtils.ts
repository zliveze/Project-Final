/**
 * Format a date to a readable string in Vietnamese format
 * @param date The date to format
 * @returns Formatted date string (e.g., "01/01/2023")
 */
export const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Check if a date is in the past
 * @param date The date to check
 * @returns True if the date is in the past, false otherwise
 */
export const isDatePast = (date: Date): boolean => {
  const now = new Date();
  return date < now;
};

/**
 * Format a date to a relative string (e.g., "2 days ago", "in 3 days")
 * @param date The date to format
 * @returns Formatted relative date string
 */
export const formatRelativeDate = (date: Date): string => {
  const now = new Date();
  const diffTime = Math.abs(date.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (date < now) {
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
  } else {
    if (diffDays === 1) return 'Ngày mai';
    if (diffDays < 7) return `${diffDays} ngày nữa`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần nữa`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng nữa`;
    return `${Math.floor(diffDays / 365)} năm nữa`;
  }
};
