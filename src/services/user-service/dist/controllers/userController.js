"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userService_1 = require("../services/userService");
const auth_1 = require("@kayak/common/src/middleware/auth");
const router = (0, express_1.Router)();
const userService = new userService_1.UserService();
/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        // Validate required fields
        const { userId, firstName, lastName, email, password } = req.body;
        if (!userId || !firstName || !lastName || !email || !password) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['userId (SSN)', 'firstName', 'lastName', 'email', 'password']
            });
        }
        // Register user (validation happens in service)
        const result = await userService.register({
            userId, // SSN
            firstName,
            lastName,
            email,
            password,
            phone: req.body.phone,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            zipCode: req.body.zipCode
        });
        res.status(201).json({
            message: 'User registered successfully',
            user: result.user,
            token: result.token
        });
    }
    catch (error) {
        console.error('Registration error:', error.message);
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   POST /api/users/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }
        const result = await userService.login(email, password);
        res.json({
            message: 'Login successful',
            user: result.user,
            token: result.token
        });
    }
    catch (error) {
        console.error('Login error:', error.message);
        res.status(401).json({ error: error.message });
    }
});
/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await userService.getUserById(userId);
        res.json(user);
    }
    catch (error) {
        console.error('Get profile error:', error.message);
        res.status(500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);
        res.json(user);
    }
    catch (error) {
        console.error('Get user error:', error.message);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
});
/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (own profile) or Admin
 */
router.put('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        const requestingUserId = req.user.userId;
        const targetUserId = req.params.id;
        const isAdmin = req.user.isAdmin;
        // Users can only update their own profile unless they're admin
        if (requestingUserId !== targetUserId && !isAdmin) {
            return res.status(403).json({
                error: 'You do not have permission to update this user'
            });
        }
        const updatedUser = await userService.updateUser(targetUserId, req.body);
        res.json({
            message: 'User updated successfully',
            user: updatedUser
        });
    }
    catch (error) {
        console.error('Update user error:', error.message);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   GET /api/users/:id/bookings
 * @desc    Get user's booking history
 * @access  Private (own bookings) or Admin
 */
router.get('/:id/bookings', auth_1.requireAuth, async (req, res) => {
    try {
        const requestingUserId = req.user.userId;
        const targetUserId = req.params.id;
        const isAdmin = req.user.isAdmin;
        // Users can only view their own bookings unless they're admin
        if (requestingUserId !== targetUserId && !isAdmin) {
            return res.status(403).json({
                error: 'You do not have permission to view these bookings'
            });
        }
        const type = req.query.type;
        const bookings = await userService.getUserBookings(targetUserId, type);
        res.json({
            userId: targetUserId,
            type: type || 'all',
            count: bookings.length,
            bookings
        });
    }
    catch (error) {
        console.error('Get bookings error:', error.message);
        res.status(500).json({ error: error.message });
    }
});
/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Admin only
 */
router.delete('/:id', auth_1.requireAdmin, async (req, res) => {
    try {
        await userService.deleteUser(req.params.id);
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Delete user error:', error.message);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/users/search/query
 * @desc    Search users
 * @access  Admin only
 */
router.get('/search/query', auth_1.requireAdmin, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Search query (q) is required' });
        }
        const users = await userService.searchUsers(q);
        res.json({
            query: q,
            count: users.length,
            users
        });
    }
    catch (error) {
        console.error('Search users error:', error.message);
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Admin only
 */
router.get('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.json({
            count: users.length,
            users
        });
    }
    catch (error) {
        console.error('Get all users error:', error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
