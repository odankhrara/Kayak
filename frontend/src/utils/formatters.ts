import { format, parseISO, differenceInMinutes, differenceInDays } from 'date-fns';

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Format date
export const formatDate = (dateStr: string | Date, formatStr: string = 'MMM dd, yyyy'): string => {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(date, formatStr);
};

// Format time
export const formatTime = (dateStr: string | Date): string => {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(date, 'hh:mm a');
};

// Format datetime
export const formatDateTime = (dateStr: string | Date): string => {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(date, 'MMM dd, yyyy hh:mm a');
};

// Format duration in minutes to hours and minutes
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
};

// Calculate duration between two dates
export const calculateDuration = (start: string | Date, end: string | Date): string => {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  const minutes = differenceInMinutes(endDate, startDate);
  return formatDuration(minutes);
};

// Calculate number of nights
export const calculateNights = (checkIn: string | Date, checkOut: string | Date): number => {
  const checkInDate = typeof checkIn === 'string' ? parseISO(checkIn) : checkIn;
  const checkOutDate = typeof checkOut === 'string' ? parseISO(checkOut) : checkOut;
  return differenceInDays(checkOutDate, checkInDate);
};

// Format credit card number (mask all but last 4)
export const formatCardNumber = (cardNumber: string): string => {
  const last4 = cardNumber.slice(-4);
  return `**** **** **** ${last4}`;
};

// Format phone number
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

// Format SSN (mask all but last 4)
export const formatSSN = (ssn: string): string => {
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `***-**-${cleaned.slice(-4)}`;
  }
  return ssn;
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

// Format number with commas
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

// Get relative time (e.g., "2 hours ago")
export const getRelativeTime = (dateStr: string | Date): string => {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  const now = new Date();
  const diffMinutes = differenceInMinutes(now, date);
  
  if (diffMinutes < 1) {
    return 'just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
};

