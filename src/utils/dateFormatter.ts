// Date Formatter Utility
// 
// Rule: API = UTC, UI = local timezone
//
// This utility provides functions to format ISO timestamps from the API
// into human-readable format in the user's local timezone.

/**
 * Check if a date is today in local timezone
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Format timestamp for Logs list display
 * 
 * @param timestamp - ISO string from API (UTC)
 * @returns Formatted string in local timezone
 * 
 * Examples:
 * - "Today 14:35" (if today)
 * - "2025-12-12 14:35" (if not today)
 */
export function formatLogTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    
    // Check if invalid date
    if (isNaN(date.getTime())) {
      return timestamp; // Fallback to original string
    }
    
    // Format time: HH:mm
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    // If today, show "Today HH:mm"
    if (isToday(date)) {
      return `Today ${timeStr}`;
    }
    
    // Otherwise, show "YYYY-MM-DD HH:mm"
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${timeStr}`;
  } catch (error) {
    console.error('Failed to format timestamp:', timestamp, error);
    return timestamp; // Fallback to original string
  }
}

/**
 * Format timestamp as UTC string for details view
 * 
 * @param timestamp - ISO string from API (UTC)
 * @returns Formatted UTC string
 * 
 * Example: "2025-12-12 14:35:22 UTC"
 */
export function formatUTC(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    
    // Check if invalid date
    if (isNaN(date.getTime())) {
      return timestamp; // Fallback to original string
    }
    
    // Format as UTC
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
  } catch (error) {
    console.error('Failed to format UTC timestamp:', timestamp, error);
    return timestamp; // Fallback to original string
  }
}

/**
 * Get relative time string (optional - for future use)
 * 
 * @param timestamp - ISO string from API (UTC)
 * @returns Relative time string
 * 
 * Examples:
 * - "2 minutes ago"
 * - "1 hour ago"
 * - "3 days ago"
 */
export function getRelativeTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return formatLogTimestamp(timestamp);
    }
  } catch (error) {
    console.error('Failed to calculate relative time:', timestamp, error);
    return timestamp;
  }
}
