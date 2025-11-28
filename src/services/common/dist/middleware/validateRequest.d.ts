import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to validate user registration data
 */
export declare const validateUserRegistration: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to validate login data
 */
export declare const validateLogin: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to validate flight search
 */
export declare const validateFlightSearch: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to validate hotel search
 */
export declare const validateHotelSearch: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to validate car search
 */
export declare const validateCarSearch: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to validate booking creation
 */
export declare const validateBookingCreation: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to validate ID parameter
 */
export declare const validateIdParam: (paramName?: string) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to validate pagination parameters
 */
export declare const validatePagination: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to sanitize request body
 */
export declare const sanitizeBody: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Generic validation middleware factory
 */
export declare const validate: (schema: (data: any) => {
    valid: boolean;
    error?: string;
}) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validateRequest.d.ts.map