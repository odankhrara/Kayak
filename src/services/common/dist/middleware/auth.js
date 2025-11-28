"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            isAdmin: decoded.isAdmin || false
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (!req.user?.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    });
}
//# sourceMappingURL=auth.js.map