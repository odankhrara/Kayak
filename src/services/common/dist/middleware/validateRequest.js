"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.sanitizeBody = exports.validatePagination = exports.validateIdParam = exports.validateBookingCreation = exports.validateCarSearch = exports.validateHotelSearch = exports.validateFlightSearch = exports.validateLogin = exports.validateUserRegistration = void 0;
const validators_1 = require("../utils/validators");
/**
 * Middleware to validate user registration data
 */
const validateUserRegistration = (req, res, next) => {
    try {
        const { userId, firstName, lastName, email, password, state, zipCode } = req.body;
        // Validate required fields
        if (!userId)
            throw new Error('User ID (SSN) is required');
        if (!firstName)
            throw new Error('First name is required');
        if (!lastName)
            throw new Error('Last name is required');
        if (!email)
            throw new Error('Email is required');
        if (!password)
            throw new Error('Password is required');
        // Validate formats
        (0, validators_1.assertValid)((0, validators_1.validateSSN)(userId));
        (0, validators_1.assertValid)((0, validators_1.validateEmail)(email));
        (0, validators_1.assertValid)((0, validators_1.validatePassword)(password));
        if (state) {
            (0, validators_1.assertValid)((0, validators_1.validateState)(state));
        }
        if (zipCode) {
            (0, validators_1.assertValid)((0, validators_1.validateZipCode)(zipCode));
        }
        next();
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.validateUserRegistration = validateUserRegistration;
/**
 * Middleware to validate login data
 */
const validateLogin = (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email)
            throw new Error('Email is required');
        if (!password)
            throw new Error('Password is required');
        (0, validators_1.assertValid)((0, validators_1.validateEmail)(email));
        next();
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.validateLogin = validateLogin;
/**
 * Middleware to validate flight search
 */
const validateFlightSearch = (req, res, next) => {
    try {
        const { origin, destination } = req.query;
        if (!origin)
            throw new Error('Origin airport is required');
        if (!destination)
            throw new Error('Destination airport is required');
        (0, validators_1.assertValid)((0, validators_1.validateAirportCode)(origin));
        (0, validators_1.assertValid)((0, validators_1.validateAirportCode)(destination));
        if (origin === destination) {
            throw new Error('Origin and destination must be different');
        }
        next();
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.validateFlightSearch = validateFlightSearch;
/**
 * Middleware to validate hotel search
 */
const validateHotelSearch = (req, res, next) => {
    try {
        const { city, state } = req.query;
        if (!city && !state) {
            throw new Error('City or state is required for hotel search');
        }
        if (state) {
            (0, validators_1.assertValid)((0, validators_1.validateState)(state));
        }
        next();
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.validateHotelSearch = validateHotelSearch;
/**
 * Middleware to validate car search
 */
const validateCarSearch = (req, res, next) => {
    try {
        const { location } = req.query;
        if (!location) {
            throw new Error('Location is required for car search');
        }
        next();
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.validateCarSearch = validateCarSearch;
/**
 * Middleware to validate booking creation
 */
const validateBookingCreation = (req, res, next) => {
    try {
        const { bookingType, entityId, quantity, checkInDate, checkOutDate, totalAmount, paymentMethod, paymentDetails } = req.body;
        // Required fields
        if (!bookingType)
            throw new Error('Booking type is required');
        if (!entityId)
            throw new Error('Entity ID is required');
        if (!quantity)
            throw new Error('Quantity is required');
        if (!checkInDate)
            throw new Error('Check-in date is required');
        if (!checkOutDate)
            throw new Error('Check-out date is required');
        if (!totalAmount)
            throw new Error('Total amount is required');
        if (!paymentMethod)
            throw new Error('Payment method is required');
        if (!paymentDetails)
            throw new Error('Payment details are required');
        // Validate booking type
        const validTypes = ['flight', 'hotel', 'car'];
        if (!validTypes.includes(bookingType)) {
            throw new Error(`Invalid booking type. Must be one of: ${validTypes.join(', ')}`);
        }
        // Validate quantity
        if (quantity < 1) {
            throw new Error('Quantity must be at least 1');
        }
        // Validate amount
        if (totalAmount <= 0) {
            throw new Error('Total amount must be greater than 0');
        }
        // Validate payment method
        const validPaymentMethods = ['credit_card', 'debit_card', 'paypal'];
        if (!validPaymentMethods.includes(paymentMethod)) {
            throw new Error(`Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`);
        }
        // Validate payment details based on method
        if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
            const { cardNumber, cvv, expiryDate } = paymentDetails;
            if (!cardNumber)
                throw new Error('Card number is required');
            if (!cvv)
                throw new Error('CVV is required');
            if (!expiryDate)
                throw new Error('Expiry date is required');
            (0, validators_1.assertValid)((0, validators_1.validateCreditCard)(cardNumber));
            (0, validators_1.assertValid)((0, validators_1.validateCVV)(cvv));
            (0, validators_1.assertValid)((0, validators_1.validateCardExpiry)(expiryDate));
        }
        else if (paymentMethod === 'paypal') {
            if (!paymentDetails.paypalEmail) {
                throw new Error('PayPal email is required');
            }
            (0, validators_1.assertValid)((0, validators_1.validateEmail)(paymentDetails.paypalEmail));
        }
        next();
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.validateBookingCreation = validateBookingCreation;
/**
 * Middleware to validate ID parameter
 */
const validateIdParam = (paramName = 'id') => {
    return (req, res, next) => {
        try {
            const id = req.params[paramName];
            if (!id || id.trim().length === 0) {
                throw new Error(`${paramName} is required`);
            }
            next();
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    };
};
exports.validateIdParam = validateIdParam;
/**
 * Middleware to validate pagination parameters
 */
const validatePagination = (req, res, next) => {
    try {
        const { page, limit } = req.query;
        if (page) {
            const pageNum = parseInt(page);
            if (isNaN(pageNum) || pageNum < 1) {
                throw new Error('Page must be a positive integer');
            }
        }
        if (limit) {
            const limitNum = parseInt(limit);
            if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
                throw new Error('Limit must be between 1 and 1000');
            }
        }
        next();
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.validatePagination = validatePagination;
/**
 * Middleware to sanitize request body
 */
const sanitizeBody = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        const sanitize = (obj) => {
            if (typeof obj === 'string') {
                return obj.trim();
            }
            if (Array.isArray(obj)) {
                return obj.map(sanitize);
            }
            if (typeof obj === 'object' && obj !== null) {
                const sanitized = {};
                for (const key in obj) {
                    sanitized[key] = sanitize(obj[key]);
                }
                return sanitized;
            }
            return obj;
        };
        req.body = sanitize(req.body);
    }
    next();
};
exports.sanitizeBody = sanitizeBody;
/**
 * Generic validation middleware factory
 */
const validate = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema(req.body);
            if (!result.valid) {
                throw new Error(result.error);
            }
            next();
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    };
};
exports.validate = validate;
//# sourceMappingURL=validateRequest.js.map