/**
 * Timezone Utility Functions
 * Handles timezone conversions for flight times and filters
 */

// Common timezone options for travel applications
export const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: 0 },
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: -5 },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: -6 },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: -7 },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: -8 },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)', offset: -9 },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)', offset: -10 },
  { value: 'Europe/London', label: 'London (GMT/BST)', offset: 0 },
  { value: 'Europe/Paris', label: 'Central European (CET)', offset: 1 },
  { value: 'Asia/Tokyo', label: 'Japan (JST)', offset: 9 },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: 8 },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)', offset: 11 },
];

/**
 * Get the browser's local timezone
 */
export const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

/**
 * Get timezone abbreviation for display
 */
export const getTimezoneAbbreviation = (timezone: string): string => {
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(part => part.type === 'timeZoneName');
    return tzPart?.value || timezone;
  } catch {
    return timezone;
  }
};

/**
 * Convert a UTC datetime string to a specific timezone
 * @param utcDateStr - ISO datetime string in UTC (e.g., "2025-12-06T23:15:17.000Z")
 * @param timezone - Target timezone (e.g., "America/Los_Angeles")
 * @returns Formatted time string in the target timezone
 */
export const convertToTimezone = (utcDateStr: string, timezone: string): Date => {
  const date = new Date(utcDateStr);
  
  // Get the timezone offset in minutes
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';
  
  // Create a new date in the target timezone
  const year = parseInt(getPart('year'));
  const month = parseInt(getPart('month')) - 1;
  const day = parseInt(getPart('day'));
  const hour = parseInt(getPart('hour'));
  const minute = parseInt(getPart('minute'));
  const second = parseInt(getPart('second'));
  
  return new Date(year, month, day, hour, minute, second);
};

/**
 * Format a UTC datetime to display in a specific timezone
 * @param utcDateStr - ISO datetime string in UTC
 * @param timezone - Target timezone
 * @param includeTimezone - Whether to include timezone abbreviation
 * @returns Formatted time string (e.g., "03:15 PM PST")
 */
export const formatTimeInTimezone = (
  utcDateStr: string,
  timezone: string,
  includeTimezone: boolean = true
): string => {
  try {
    const date = new Date(utcDateStr);
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    
    if (includeTimezone) {
      options.timeZoneName = 'short';
    }
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('Error formatting time:', error);
    return utcDateStr;
  }
};

/**
 * Convert a local time string to UTC time string for API queries
 * @param timeStr - Time string in HH:MM format (e.g., "14:30" or "22:45")
 * @param timezone - Source timezone (e.g., "America/Los_Angeles" or "UTC")
 * @param referenceDate - Reference date for the conversion (defaults to today)
 * @returns Time string in HH:MM:SS format in UTC
 */
export const convertLocalTimeToUTC = (
  timeStr: string,
  timezone: string,
  referenceDate: Date = new Date()
): string => {
  if (!timeStr) return '';
  
  try {
    // If timezone is already UTC, just return the time with seconds
    if (timezone === 'UTC') {
      return `${timeStr}:00`;
    }
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Create a reference date in UTC
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const day = referenceDate.getDate();
    
    // Create a Date object representing the time in the source timezone
    // We do this by creating a UTC date and then calculating the offset
    const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, 0));
    
    // Get the offset between the source timezone and UTC
    // Format a date in both UTC and the target timezone to find the difference
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    
    const utcFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    
    // Get offset by comparing a known time in both timezones
    const testDate = new Date(Date.UTC(year, month, day, 12, 0, 0)); // noon UTC
    const tzParts = formatter.formatToParts(testDate);
    const utcParts = utcFormatter.formatToParts(testDate);
    
    const tzHour = parseInt(tzParts.find(p => p.type === 'hour')?.value || '12');
    const utcHour = parseInt(utcParts.find(p => p.type === 'hour')?.value || '12');
    
    // Calculate offset in hours (positive = timezone is ahead of UTC)
    let offsetHours = tzHour - utcHour;
    if (offsetHours > 12) offsetHours -= 24;
    if (offsetHours < -12) offsetHours += 24;
    
    // Apply inverse offset to convert from local to UTC
    let utcHours = hours - offsetHours;
    
    // Handle day wraparound
    if (utcHours < 0) utcHours += 24;
    if (utcHours >= 24) utcHours -= 24;
    
    // Format as HH:MM:SS
    return `${String(utcHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  } catch (error) {
    console.error('Error converting time to UTC:', error);
    // Return the original time with seconds as fallback
    return `${timeStr}:00`;
  }
};

/**
 * Get a user-friendly timezone label
 */
export const getTimezoneLabel = (timezone: string): string => {
  const option = TIMEZONE_OPTIONS.find(opt => opt.value === timezone);
  if (option) return option.label;
  
  // If not in our list, try to create a label from the timezone string
  const abbr = getTimezoneAbbreviation(timezone);
  return `${timezone.replace(/_/g, ' ')} (${abbr})`;
};

/**
 * Check if a timezone string is valid
 */
export const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

