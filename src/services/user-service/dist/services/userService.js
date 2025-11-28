"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userRepository_1 = require("../repositories/userRepository");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
class UserService {
    constructor() {
        this.userRepository = new userRepository_1.UserRepository();
    }
    /**
     * Validate SSN format (XXX-XX-XXXX)
     */
    validateSSN(ssn) {
        const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
        if (!ssnRegex.test(ssn)) {
            throw new Error('Invalid SSN format. Must be XXX-XX-XXXX (e.g., 123-45-6789)');
        }
    }
    /**
     * Validate US state abbreviation
     */
    validateState(state) {
        const validStates = [
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
            'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
            'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
            'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
            'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
        ];
        if (!validStates.includes(state.toUpperCase())) {
            throw new Error(`Invalid state abbreviation: ${state}. Must be a valid US state code (e.g., CA, NY, TX)`);
        }
    }
    /**
     * Validate ZIP code format (##### or #####-####)
     */
    validateZipCode(zipCode) {
        const zipRegex = /^\d{5}(-\d{4})?$/;
        if (!zipRegex.test(zipCode)) {
            throw new Error('Invalid ZIP code format. Must be ##### or #####-#### (e.g., 95123 or 95123-4567)');
        }
    }
    /**
     * Validate email format
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }
    }
    /**
     * Validate password strength
     */
    validatePassword(password) {
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }
    }
    /**
     * Register a new user
     */
    async register(userData) {
        try {
            // Validate all fields
            this.validateSSN(userData.userId);
            this.validateEmail(userData.email);
            this.validatePassword(userData.password);
            if (userData.state) {
                this.validateState(userData.state);
            }
            if (userData.zipCode) {
                this.validateZipCode(userData.zipCode);
            }
            // Hash password
            const hashedPassword = await bcryptjs_1.default.hash(userData.password, 10);
            // Create user via repository (repository will check for duplicates)
            const user = await this.userRepository.create({
                user_id: userData.userId,
                first_name: userData.firstName,
                last_name: userData.lastName,
                email: userData.email,
                hashedPassword,
                phone: userData.phone,
                address: userData.address,
                city: userData.city,
                state: userData.state,
                zip_code: userData.zipCode
            });
            // Generate JWT token
            const token = jsonwebtoken_1.default.sign({
                userId: user.userId,
                email: user.email,
                isAdmin: false
            }, JWT_SECRET, { expiresIn: '7d' });
            // Remove sensitive data before returning
            const { hashedPassword: _, ...userWithoutPassword } = user;
            return {
                user: userWithoutPassword,
                token
            };
        }
        catch (error) {
            // Enhanced error messages
            if (error.message.includes('already exists')) {
                throw new Error('User with this email or SSN already exists');
            }
            throw error;
        }
    }
    /**
     * Login user
     */
    async login(email, password) {
        try {
            // Validate inputs
            if (!email || !password) {
                throw new Error('Email and password are required');
            }
            this.validateEmail(email);
            // Get user by email
            const user = await this.userRepository.getByEmail(email);
            if (!user) {
                throw new Error('Invalid email or password');
            }
            // Check if user is active
            if (user.status !== 'active') {
                throw new Error('Account is inactive or suspended');
            }
            // Verify password
            const isValidPassword = await bcryptjs_1.default.compare(password, user.hashedPassword);
            if (!isValidPassword) {
                throw new Error('Invalid email or password');
            }
            // Generate JWT token with actual admin status from database
            const token = jsonwebtoken_1.default.sign({
                userId: user.userId,
                email: user.email,
                isAdmin: user.isAdmin || false
            }, JWT_SECRET, { expiresIn: '7d' });
            // Remove sensitive data
            const { hashedPassword: _, ...userWithoutPassword } = user;
            return {
                user: userWithoutPassword,
                token
            };
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        const user = await this.userRepository.getById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        // Remove sensitive data
        const { hashedPassword: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    /**
     * Update user profile
     */
    async updateUser(userId, updates) {
        try {
            // Check if user exists
            const existingUser = await this.userRepository.getById(userId);
            if (!existingUser) {
                throw new Error('User not found');
            }
            // Validate fields if provided
            if (updates.email) {
                this.validateEmail(updates.email);
            }
            if (updates.state) {
                this.validateState(updates.state);
            }
            if (updates.zipCode) {
                this.validateZipCode(updates.zipCode);
            }
            if (updates.password) {
                this.validatePassword(updates.password);
                // Hash new password
                const hashedPassword = await bcryptjs_1.default.hash(updates.password, 10);
                updates = { ...updates, password: undefined };
                updates.hashedPassword = hashedPassword;
            }
            // Update user
            const updatedUser = await this.userRepository.update(userId, updates);
            // Remove sensitive data
            const { hashedPassword: _, ...userWithoutPassword } = updatedUser;
            return userWithoutPassword;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Delete user
     */
    async deleteUser(userId) {
        const user = await this.userRepository.getById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        await this.userRepository.delete(userId);
    }
    /**
     * Get user's booking history
     */
    async getUserBookings(userId, type) {
        const user = await this.userRepository.getById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return this.userRepository.getUserBookings(userId);
    }
    /**
     * Search users (Admin only)
     */
    async searchUsers(query) {
        if (!query || query.trim().length === 0) {
            throw new Error('Search query is required');
        }
        const users = await this.userRepository.searchUsers(query);
        // Remove sensitive data from all users
        return users.map(user => {
            const { hashedPassword: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    }
    /**
     * Get all users (Admin only)
     */
    async getAllUsers() {
        const users = await this.userRepository.getAllUsers();
        // Remove sensitive data from all users
        return users.map(user => {
            const { hashedPassword: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    }
    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
}
exports.UserService = UserService;
