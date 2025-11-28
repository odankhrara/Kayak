"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const carService_1 = require("../services/carService");
const auth_1 = require("@kayak/common/src/middleware/auth");
const router = (0, express_1.Router)();
const carService = new carService_1.CarService();
/**
 * @route   GET /api/cars/search
 * @desc    Search cars with filters
 * @access  Public
 * @query   location, pickupDate, returnDate, carType, transmission, minPrice, maxPrice, minSeats, company, sortBy
 */
router.get('/search', async (req, res) => {
    try {
        const filters = {
            location: req.query.location,
            pickupDate: req.query.pickupDate,
            returnDate: req.query.returnDate,
            carType: req.query.carType,
            transmission: req.query.transmission,
            minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
            maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
            minSeats: req.query.minSeats ? parseInt(req.query.minSeats) : undefined,
            company: req.query.company,
            minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder,
            limit: req.query.limit ? parseInt(req.query.limit) : 50
        };
        const cars = await carService.search(filters);
        res.json({
            count: cars.length,
            filters: {
                location: filters.location,
                pickupDate: filters.pickupDate,
                returnDate: filters.returnDate,
                carType: filters.carType
            },
            cars
        });
    }
    catch (error) {
        console.error('Car search error:', error.message);
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   GET /api/cars/:id
 * @desc    Get car by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const car = await carService.getById(req.params.id);
        res.json(car);
    }
    catch (error) {
        console.error('Get car error:', error.message);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/cars/:id/availability
 * @desc    Check car availability
 * @access  Public
 */
router.get('/:id/availability', async (req, res) => {
    try {
        const availability = await carService.checkAvailability(req.params.id);
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
 * @route   POST /api/cars/:id/calculate-cost
 * @desc    Calculate rental cost
 * @access  Public
 */
router.post('/:id/calculate-cost', async (req, res) => {
    try {
        const { pickupDate, returnDate } = req.body;
        if (!pickupDate || !returnDate) {
            return res.status(400).json({
                error: 'Pickup date and return date are required'
            });
        }
        const car = await carService.getById(req.params.id);
        const cost = carService.calculateRentalCost(car.dailyRentalPrice, pickupDate, returnDate);
        res.json({
            carId: req.params.id,
            pickupDate,
            returnDate,
            ...cost
        });
    }
    catch (error) {
        console.error('Calculate cost error:', error.message);
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   POST /api/cars
 * @desc    Create a new car
 * @access  Admin only
 */
router.post('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const car = await carService.createCar(req.body);
        res.status(201).json({
            message: 'Car created successfully',
            car
        });
    }
    catch (error) {
        console.error('Create car error:', error.message);
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   PUT /api/cars/:id
 * @desc    Update car
 * @access  Admin only
 */
router.put('/:id', auth_1.requireAdmin, async (req, res) => {
    try {
        const car = await carService.updateCar(req.params.id, req.body);
        res.json({
            message: 'Car updated successfully',
            car
        });
    }
    catch (error) {
        console.error('Update car error:', error.message);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   DELETE /api/cars/:id
 * @desc    Delete car
 * @access  Admin only
 */
router.delete('/:id', auth_1.requireAdmin, async (req, res) => {
    try {
        await carService.deleteCar(req.params.id);
        res.json({ message: 'Car deleted successfully' });
    }
    catch (error) {
        console.error('Delete car error:', error.message);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/cars
 * @desc    Get all cars
 * @access  Admin only
 */
router.get('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const cars = await carService.getAllCars(limit);
        res.json({
            count: cars.length,
            cars
        });
    }
    catch (error) {
        console.error('Get all cars error:', error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
