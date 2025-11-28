/**
 * Shared validation utilities for all microservices
 * Ensures consistent validation across the entire platform
 */
/**
 * Validate US Social Security Number format (XXX-XX-XXXX)
 */
export declare function validateSSN(ssn: string): {
    valid: boolean;
    error?: string;
};
/**
 * Validate US state abbreviation
 */
export declare function validateState(state: string): {
    valid: boolean;
    error?: string;
};
/**
 * Validate US ZIP code format (##### or #####-####)
 */
export declare function validateZipCode(zipCode: string): {
    valid: boolean;
    error?: string;
};
/**
 * Validate email format
 */
export declare function validateEmail(email: string): {
    valid: boolean;
    error?: string;
};
/**
 * Validate phone number (US format)
 */
export declare function validatePhoneNumber(phone: string): {
    valid: boolean;
    error?: string;
};
/**
 * Validate password strength
 */
export declare function validatePassword(password: string): {
    valid: boolean;
    error?: string;
};
/**
 * Validate IATA airport code (3 letters)
 */
export declare function validateAirportCode(code: string): {
    valid: boolean;
    error?: string;
};
/**
 * Validate date is in the future
 */
export declare function validateFutureDate(date: string, fieldName?: string): {
    valid: boolean;
    error?: string;
};
/**
 * Validate date range
 */
export declare function validateDateRange(startDate: string, endDate: string, startLabel?: string, endLabel?: string): {
    valid: boolean;
    error?: string;
};
/**
 * Validate credit card number (Luhn algorithm)
 */
export declare function validateCreditCard(cardNumber: string): {
    valid: boolean;
    error?: string;
};
/**
 * Validate credit card CVV
 */
export declare function validateCVV(cvv: string): {
    valid: boolean;
    error?: string;
};
/**
 * Validate credit card expiry date (MM/YY format)
 */
export declare function validateCardExpiry(expiryDate: string): {
    valid: boolean;
    error?: string;
};
/**
 * Validate price range
 */
export declare function validatePriceRange(minPrice?: number, maxPrice?: number): {
    valid: boolean;
    error?: string;
};
/**
 * Validate rating (0-5 scale)
 */
export declare function validateRating(rating: number): {
    valid: boolean;
    error?: string;
};
/**
 * Sanitize user input (prevent XSS)
 */
export declare function sanitizeInput(input: string): string;
/**
 * Validate and throw error if invalid
 */
export declare function assertValid(validation: {
    valid: boolean;
    error?: string;
}): void;
//# sourceMappingURL=validators.d.ts.map