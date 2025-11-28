"use strict";
/**
 * Shared validation utilities for all microservices
 * Ensures consistent validation across the entire platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSSN = validateSSN;
exports.validateState = validateState;
exports.validateZipCode = validateZipCode;
exports.validateEmail = validateEmail;
exports.validatePhoneNumber = validatePhoneNumber;
exports.validatePassword = validatePassword;
exports.validateAirportCode = validateAirportCode;
exports.validateFutureDate = validateFutureDate;
exports.validateDateRange = validateDateRange;
exports.validateCreditCard = validateCreditCard;
exports.validateCVV = validateCVV;
exports.validateCardExpiry = validateCardExpiry;
exports.validatePriceRange = validatePriceRange;
exports.validateRating = validateRating;
exports.sanitizeInput = sanitizeInput;
exports.assertValid = assertValid;
/**
 * Validate US Social Security Number format (XXX-XX-XXXX)
 */
function validateSSN(ssn) {
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    if (!ssnRegex.test(ssn)) {
        return {
            valid: false,
            error: 'Invalid SSN format. Must be XXX-XX-XXXX (e.g., 123-45-6789)'
        };
    }
    return { valid: true };
}
/**
 * Validate US state abbreviation
 */
function validateState(state) {
    const validStates = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];
    if (!validStates.includes(state.toUpperCase())) {
        return {
            valid: false,
            error: `Invalid state abbreviation: ${state}. Must be a valid US state code (e.g., CA, NY, TX)`
        };
    }
    return { valid: true };
}
/**
 * Validate US ZIP code format (##### or #####-####)
 */
function validateZipCode(zipCode) {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(zipCode)) {
        return {
            valid: false,
            error: 'Invalid ZIP code format. Must be ##### or #####-#### (e.g., 95123 or 95123-4567)'
        };
    }
    return { valid: true };
}
/**
 * Validate email format
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            valid: false,
            error: 'Invalid email format'
        };
    }
    return { valid: true };
}
/**
 * Validate phone number (US format)
 */
function validatePhoneNumber(phone) {
    // Supports formats: (123) 456-7890, 123-456-7890, 1234567890, +1 (123) 456-7890
    const phoneRegex = /^(\+1\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/;
    if (!phoneRegex.test(phone)) {
        return {
            valid: false,
            error: 'Invalid phone number format. Use (123) 456-7890 or 123-456-7890'
        };
    }
    return { valid: true };
}
/**
 * Validate password strength
 */
function validatePassword(password) {
    if (password.length < 8) {
        return {
            valid: false,
            error: 'Password must be at least 8 characters long'
        };
    }
    // Optional: Add more strength requirements
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        return {
            valid: false,
            error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        };
    }
    return { valid: true };
}
/**
 * Validate IATA airport code (3 letters)
 */
function validateAirportCode(code) {
    const airportRegex = /^[A-Z]{3}$/;
    if (!airportRegex.test(code.toUpperCase())) {
        return {
            valid: false,
            error: 'Invalid airport code. Must be a 3-letter IATA code (e.g., SFO, JFK, LAX)'
        };
    }
    return { valid: true };
}
/**
 * Validate date is in the future
 */
function validateFutureDate(date, fieldName = 'Date') {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(inputDate.getTime())) {
        return {
            valid: false,
            error: `${fieldName} is not a valid date`
        };
    }
    if (inputDate < today) {
        return {
            valid: false,
            error: `${fieldName} must be in the future`
        };
    }
    return { valid: true };
}
/**
 * Validate date range
 */
function validateDateRange(startDate, endDate, startLabel = 'Start date', endLabel = 'End date') {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime())) {
        return { valid: false, error: `${startLabel} is not a valid date` };
    }
    if (isNaN(end.getTime())) {
        return { valid: false, error: `${endLabel} is not a valid date` };
    }
    if (end <= start) {
        return {
            valid: false,
            error: `${endLabel} must be after ${startLabel}`
        };
    }
    return { valid: true };
}
/**
 * Validate credit card number (Luhn algorithm)
 */
function validateCreditCard(cardNumber) {
    const sanitized = cardNumber.replace(/\s/g, '');
    if (sanitized.length < 13 || sanitized.length > 19) {
        return {
            valid: false,
            error: 'Invalid credit card number length'
        };
    }
    if (!/^\d+$/.test(sanitized)) {
        return {
            valid: false,
            error: 'Credit card number must contain only digits'
        };
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
    if (sum % 10 !== 0) {
        return {
            valid: false,
            error: 'Invalid credit card number'
        };
    }
    return { valid: true };
}
/**
 * Validate credit card CVV
 */
function validateCVV(cvv) {
    if (!cvv || cvv.length < 3 || cvv.length > 4) {
        return {
            valid: false,
            error: 'Invalid CVV. Must be 3 or 4 digits'
        };
    }
    if (!/^\d+$/.test(cvv)) {
        return {
            valid: false,
            error: 'CVV must contain only digits'
        };
    }
    return { valid: true };
}
/**
 * Validate credit card expiry date (MM/YY format)
 */
function validateCardExpiry(expiryDate) {
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(expiryDate)) {
        return {
            valid: false,
            error: 'Invalid expiry date. Format must be MM/YY'
        };
    }
    const [month, year] = expiryDate.split('/').map(Number);
    const expiry = new Date(2000 + year, month - 1);
    const now = new Date();
    if (expiry < now) {
        return {
            valid: false,
            error: 'Credit card has expired'
        };
    }
    return { valid: true };
}
/**
 * Validate price range
 */
function validatePriceRange(minPrice, maxPrice) {
    if (minPrice !== undefined && minPrice < 0) {
        return {
            valid: false,
            error: 'Minimum price cannot be negative'
        };
    }
    if (maxPrice !== undefined && maxPrice < 0) {
        return {
            valid: false,
            error: 'Maximum price cannot be negative'
        };
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
        return {
            valid: false,
            error: 'Minimum price cannot be greater than maximum price'
        };
    }
    return { valid: true };
}
/**
 * Validate rating (0-5 scale)
 */
function validateRating(rating) {
    if (rating < 0 || rating > 5) {
        return {
            valid: false,
            error: 'Rating must be between 0 and 5'
        };
    }
    return { valid: true };
}
/**
 * Sanitize user input (prevent XSS)
 */
function sanitizeInput(input) {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}
/**
 * Validate and throw error if invalid
 */
function assertValid(validation) {
    if (!validation.valid) {
        throw new Error(validation.error);
    }
}
//# sourceMappingURL=validators.js.map