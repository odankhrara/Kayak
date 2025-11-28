"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@kayak/common/src/middleware/auth");
const kafkaClient_1 = require("../../common/src/kafka/kafkaClient");
const topics_1 = require("../../common/src/kafka/topics");
const billingService_1 = require("../services/billingService");
const router = (0, express_1.Router)();
const billingService = new billingService_1.BillingService();
const emitPaymentEvent = async (billing) => {
    if (!billing || !billing.status)
        return;
    let topic = null;
    if (billing.status === 'completed') {
        topic = topics_1.KAFKA_TOPICS.PAYMENT_SUCCEEDED;
    }
    else if (billing.status === 'failed') {
        topic = topics_1.KAFKA_TOPICS.PAYMENT_FAILED;
    }
    if (!topic)
        return;
    try {
        await (0, kafkaClient_1.sendKafkaMessage)(topic, {
            paymentId: billing.billingId,
            bookingId: billing.bookingId,
            userId: billing.userId,
            amount: billing.amount,
            status: billing.status,
            paidAt: billing.transactionDate || billing.updatedAt || new Date().toISOString()
        });
    }
    catch (kafkaError) {
        console.error('Kafka publish failed for billing event:', kafkaError);
    }
};
/**
 * @route   GET /api/billing/:id
 * @desc    Get billing record by ID
 * @access  Private (own billing) or Admin
 */
router.get('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        const billing = await billingService.getById(req.params.id);
        // Check if user owns this billing record or is admin
        const requestingUserId = req.user.userId;
        const isAdmin = req.user.isAdmin;
        if (billing.userId !== requestingUserId && !isAdmin) {
            return res.status(403).json({
                error: 'You do not have permission to view this billing record'
            });
        }
        await emitPaymentEvent(billing);
        res.json(billing);
    }
    catch (error) {
        console.error('Get billing error:', error.message);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/billing/booking/:bookingId
 * @desc    Get billing records for a booking
 * @access  Private (own booking) or Admin
 */
router.get('/booking/:bookingId', auth_1.requireAuth, async (req, res) => {
    try {
        const billings = await billingService.getByBookingId(req.params.bookingId);
        if (billings.length > 0) {
            const requestingUserId = req.user.userId;
            const isAdmin = req.user.isAdmin;
            if (billings[0].userId !== requestingUserId && !isAdmin) {
                return res.status(403).json({
                    error: 'You do not have permission to view these billing records'
                });
            }
        }
        for (const billing of billings) {
            await emitPaymentEvent(billing);
        }
        res.json({
            bookingId: req.params.bookingId,
            count: billings.length,
            billings
        });
    }
    catch (error) {
        console.error('Get billing by booking error:', error.message);
        res.status(500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/billing/user/:userId
 * @desc    Get user's billing history
 * @access  Private (own billings) or Admin
 */
router.get('/user/:userId', auth_1.requireAuth, async (req, res) => {
    try {
        const requestingUserId = req.user.userId;
        const targetUserId = req.params.userId;
        const isAdmin = req.user.isAdmin;
        // Users can only view their own billings unless they're admin
        if (requestingUserId !== targetUserId && !isAdmin) {
            return res.status(403).json({
                error: 'You do not have permission to view these billing records'
            });
        }
        const billings = await billingService.getUserBillings(targetUserId);
        res.json({
            userId: targetUserId,
            count: billings.length,
            billings
        });
    }
    catch (error) {
        console.error('Get user billings error:', error.message);
        res.status(500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/billing/:id/invoice
 * @desc    Generate invoice for a billing record
 * @access  Private (own billing) or Admin
 */
router.get('/:id/invoice', auth_1.requireAuth, async (req, res) => {
    try {
        const billing = await billingService.getById(req.params.id);
        // Check if user owns this billing record or is admin
        const requestingUserId = req.user.userId;
        const isAdmin = req.user.isAdmin;
        if (billing.userId !== requestingUserId && !isAdmin) {
            return res.status(403).json({
                error: 'You do not have permission to view this invoice'
            });
        }
        const invoice = await billingService.generateInvoice(req.params.id);
        res.json(invoice);
    }
    catch (error) {
        console.error('Generate invoice error:', error.message);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
});
/**
 * @route   POST /api/billing/search
 * @desc    Search billing records with filters
 * @access  Admin only
 */
router.post('/search', auth_1.requireAdmin, async (req, res) => {
    try {
        const filters = {
            userId: req.body.userId,
            bookingType: req.body.bookingType,
            status: req.body.status,
            paymentMethod: req.body.paymentMethod,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            minAmount: req.body.minAmount,
            maxAmount: req.body.maxAmount,
            limit: req.body.limit || 100
        };
        const billings = await billingService.searchBillings(filters);
        res.json({
            count: billings.length,
            filters,
            billings
        });
    }
    catch (error) {
        console.error('Search billings error:', error.message);
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   GET /api/billing/analytics/revenue
 * @desc    Get revenue analytics
 * @access  Admin only
 */
router.get('/analytics/revenue', auth_1.requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'Start date and end date are required'
            });
        }
        const revenue = await billingService.getRevenue(startDate, endDate);
        res.json(revenue);
    }
    catch (error) {
        console.error('Get revenue error:', error.message);
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   GET /api/billing/analytics/top-properties
 * @desc    Get top revenue generating properties
 * @access  Admin only
 */
router.get('/analytics/top-properties', auth_1.requireAdmin, async (req, res) => {
    try {
        const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const topProperties = await billingService.getTopProperties(year, limit);
        res.json({
            year,
            count: topProperties.length,
            properties: topProperties
        });
    }
    catch (error) {
        console.error('Get top properties error:', error.message);
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   GET /api/billing/analytics/city-revenue
 * @desc    Get city-wise revenue
 * @access  Admin only
 */
router.get('/analytics/city-revenue', auth_1.requireAdmin, async (req, res) => {
    try {
        const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
        const cityRevenue = await billingService.getCityRevenue(year);
        res.json({
            year,
            count: cityRevenue.length,
            cities: cityRevenue
        });
    }
    catch (error) {
        console.error('Get city revenue error:', error.message);
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   GET /api/billing
 * @desc    Get all billing records
 * @access  Admin only
 */
router.get('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const billings = await billingService.getAllBillings(limit);
        res.json({
            count: billings.length,
            billings
        });
    }
    catch (error) {
        console.error('Get all billings error:', error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
