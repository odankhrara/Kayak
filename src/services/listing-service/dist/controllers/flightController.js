"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const flightService_1 = require("../services/flightService");
const auth_1 = require("@kayak/common/src/middleware/auth");
const router = (0, express_1.Router)();
const flightService = new flightService_1.FlightService();
/**
 * @route   GET /api/flights/search
 * @desc    Search flights with filters
 * @access  Public
 * @query   origin, destination, departureDate, returnDate, passengers, class, minPrice, maxPrice, airline, sortBy, sortOrder
 */
router.get('/search', async (req, res) => {
    try {
        const filters = {
            origin: req.query.origin,
            destination: req.query.destination,
            departureDate: req.query.departureDate,
            returnDate: req.query.returnDate,
            passengers: req.query.passengers ? parseInt(req.query.passengers) : undefined,
            class: req.query.class,
            minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
            maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
            airline: req.query.airline,
            departureTimeMin: req.query.departureTimeMin,
            departureTimeMax: req.query.departureTimeMax,
            minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder,
            limit: req.query.limit ? parseInt(req.query.limit) : 50
        };
        const flights = await flightService.search(filters);
        res.json({
            count: flights.length,
            filters: {
                origin: filters.origin,
                destination: filters.destination,
                departureDate: filters.departureDate,
                passengers: filters.passengers || 1,
                class: filters.class || 'economy'
            },
            flights
        });
    }
    catch (error) {
        console.error('Flight search error:', error.message);
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   GET /api/flights/:id
 * @desc    Get flight by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const flight = await flightService.getById(req.params.id);
        res.json(flight);
    }
    catch (error) {
        console.error('Get flight error:', error.message);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/flights/:id/availability
 * @desc    Check flight availability
 * @access  Public
 */
router.get('/:id/availability', async (req, res) => {
    try {
        const passengers = parseInt(req.query.passengers) || 1;
        const availability = await flightService.checkAvailability(req.params.id, passengers);
        res.json(availability);
    }
    catch (error) {
        console.error('Check availability error:', error.message);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   POST /api/flights
 * @desc    Create a new flight
 * @access  Admin only
 */
router.post('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const flight = await flightService.createFlight(req.body);
        res.status(201).json({
            message: 'Flight created successfully',
            flight
        });
    }
    catch (error) {
        console.error('Create flight error:', error.message);
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   PUT /api/flights/:id
 * @desc    Update flight
 * @access  Admin only
 */
router.put('/:id', auth_1.requireAdmin, async (req, res) => {
    try {
        const flight = await flightService.updateFlight(req.params.id, req.body);
        res.json({
            message: 'Flight updated successfully',
            flight
        });
    }
    catch (error) {
        console.error('Update flight error:', error.message);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   DELETE /api/flights/:id
 * @desc    Delete flight
 * @access  Admin only
 */
router.delete('/:id', auth_1.requireAdmin, async (req, res) => {
    try {
        await flightService.deleteFlight(req.params.id);
        res.json({ message: 'Flight deleted successfully' });
    }
    catch (error) {
        console.error('Delete flight error:', error.message);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/flights
 * @desc    Get all flights
 * @access  Admin only
 */
router.get('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const flights = await flightService.getAllFlights(limit);
        res.json({
            count: flights.length,
            flights
        });
    }
    catch (error) {
        console.error('Get all flights error:', error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
