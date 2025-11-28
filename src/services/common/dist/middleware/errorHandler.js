"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
class AppError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
function errorHandler(err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }
    console.error('Unexpected error:', err);
    res.status(500).json({
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { message: err.message })
    });
}
//# sourceMappingURL=errorHandler.js.map