"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@kayak/common/src/middleware/auth");
const kafkaClient_1 = require("../../common/src/kafka/kafkaClient");
const topics_1 = require("../../common/src/kafka/topics");
const bookingService_1 = require("../services/bookingService");
const router = (0, express_1.Router)();
const bookingService = new bookingService_1.BookingService();
/**
 * @route   POST /api/bookings/create
 * @desc    Create a booking with payment (full transaction)
 * @access  Private
 */
router.post('/create', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        // Validate required fields
        const { bookingType, entityId, quantity, checkInDate, checkOutDate, totalAmount, paymentMethod, paymentDetails } = req.body;
        if (!bookingType || !entityId || !quantity || !checkInDate || !checkOutDate || !totalAmount || !paymentMethod || !paymentDetails) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['bookingType', 'entityId', 'quantity', 'checkInDate', 'checkOutDate', 'totalAmount', 'paymentMethod', 'paymentDetails']
            });
        }
        // Create booking with payment (full transaction with rollback)
        const result = await bookingService.createBookingWithPayment({
            userId,
            bookingType,
            entityId,
            quantity,
            checkInDate,
            checkOutDate,
            totalAmount,
            paymentMethod,
            paymentDetails
        });
        try {
            const booking = result.booking;
            await (0, kafkaClient_1.sendKafkaMessage)(topics_1.KAFKA_TOPICS.BOOKING_CREATED, {
                bookingId: booking.bookingId,
                userId: booking.userId,
                totalAmount: booking.totalAmount,
                status: booking.status,
                createdAt: booking.createdAt || new Date().toISOString()
            });
        }
        catch (kafkaError) {
            console.error('Kafka publish failed for booking create:', kafkaError);
        }
        res.status(201).json(result);
    }
    catch (error) {
        console.error('Create booking error:', error.message);
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        const booking = await bookingService.getById(req.params.id);
        // Check if user owns this booking or is admin
        const requestingUserId = req.user.userId;
        const isAdmin = req.user.isAdmin;
        if (booking.userId !== requestingUserId && !isAdmin) {
            return res.status(403).json({
                error: 'You do not have permission to view this booking'
            });
        }
        res.json(booking);
    }
    catch (error) {
        console.error('Get booking error:', error.message);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/bookings/user/:userId
 * @desc    Get user's booking history
 * @access  Private (own bookings) or Admin
 */
router.get('/user/:userId', auth_1.requireAuth, async (req, res) => {
    try {
        const requestingUserId = req.user.userId;
        const targetUserId = req.params.userId;
        const isAdmin = req.user.isAdmin;
        // Users can only view their own bookings unless they're admin
        if (requestingUserId !== targetUserId && !isAdmin) {
            return res.status(403).json({
                error: 'You do not have permission to view these bookings'
            });
        }
        const filter = req.query.filter;
        const bookings = await bookingService.getUserBookings(targetUserId, filter);
        res.json({
            userId: targetUserId,
            filter: filter || 'all',
            count: bookings.length,
            bookings
        });
    }
    catch (error) {
        console.error('Get user bookings error:', error.message);
        res.status(500).json({ error: error.message });
    }
});
/**
 * @route   POST /api/bookings/:id/cancel
 * @desc    Cancel booking with refund
 * @access  Private (own booking) or Admin
 */
router.post('/:id/cancel', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const bookingId = req.params.id;
        const reason = req.body.reason;
        const result = await bookingService.cancelBooking(bookingId, userId, reason);
        res.json(result);
    }
    catch (error) {
        console.error('Cancel booking error:', error.message);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('permission')) {
            return res.status(403).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   PUT /api/bookings/:id/status
 * @desc    Update booking status
 * @access  Admin only
 */
router.put('/:id/status', auth_1.requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }
        const booking = await bookingService.updateStatus(req.params.id, status);
        try {
            await (0, kafkaClient_1.sendKafkaMessage)(topics_1.KAFKA_TOPICS.BOOKING_UPDATED, {
                bookingId: booking.bookingId,
                userId: booking.userId,
                totalAmount: booking.totalAmount,
                status: booking.status,
                createdAt: booking.createdAt || booking.bookingDate,
                updatedAt: new Date().toISOString()
            });
        }
        catch (kafkaError) {
            console.error('Kafka publish failed for booking update:', kafkaError);
        }
        res.json({
            message: 'Booking status updated successfully',
            booking
        });
    }
    catch (error) {
        console.error('Update status error:', error.message);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   GET /api/bookings
 * @desc    Get all bookings
 * @access  Admin only
 */
router.get('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const bookings = await bookingService.getAllBookings(limit);
        res.json({
            count: bookings.length,
            bookings
        });
    }
    catch (error) {
        console.error('Get all bookings error:', error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
