// SSN validation (XXX-XX-XXXX)
export const validateSSN = (ssn: string): boolean => {
  const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
  return ssnRegex.test(ssn);
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ZIP code validation (##### or #####-####)
export const validateZipCode = (zipCode: string): boolean => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
};

// State code validation (2-letter US states)
export const validateState = (state: string): boolean => {
  const validStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  return validStates.includes(state.toUpperCase());
};

// Airport code validation (3-letter IATA)
export const validateAirportCode = (code: string): boolean => {
  const airportRegex = /^[A-Z]{3}$/;
  return airportRegex.test(code.toUpperCase());
};

// Credit card validation (Luhn algorithm)
export const validateCreditCard = (cardNumber: string): boolean => {
  const sanitized = cardNumber.replace(/\s/g, '');
  
  if (sanitized.length < 13 || sanitized.length > 19) {
    return false;
  }

  if (!/^\d+$/.test(sanitized)) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

// CVV validation
export const validateCVV = (cvv: string): boolean => {
  return /^\d{3,4}$/.test(cvv);
};

// Card expiry validation (MM/YY)
export const validateCardExpiry = (expiry: string): boolean => {
  const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  
  if (!expiryRegex.test(expiry)) {
    return false;
  }

  const [month, year] = expiry.split('/').map(Number);
  const expiryDate = new Date(2000 + year, month - 1);
  const now = new Date();
  
  return expiryDate > now;
};

// Password strength validation
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  feedback: string[];
} => {
  const feedback: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  
  if (password.length < 8) {
    feedback.push('At least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    feedback.push('One uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    feedback.push('One lowercase letter');
  }
  if (!/\d/.test(password)) {
    feedback.push('One number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    feedback.push('One special character (!@#$%^&*)');
  }

  const isValid = feedback.length === 0;
  
  if (isValid) {
    strength = 'strong';
  } else if (feedback.length <= 2) {
    strength = 'medium';
  }

  return { isValid, strength, feedback };
};

// Phone number validation (US format)
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+1\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/;
  return phoneRegex.test(phone);
};

// Date validation (must be in the future)
export const validateFutureDate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

// Date range validation
export const validateDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end > start;
};

