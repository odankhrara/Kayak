"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const hotelService_1 = require("../services/hotelService");
const auth_1 = require("@kayak/common/src/middleware/auth");
const router = (0, express_1.Router)();
const hotelService = new hotelService_1.HotelService();
/**
 * @route   GET /api/hotels/search
 * @desc    Search hotels with filters
 * @access  Public
 * @query   city, state, checkIn, checkOut, guests, rooms, minPrice, maxPrice, minStars, maxStars, amenities, sortBy
 */
router.get('/search', async (req, res) => {
    try {
        const filters = {
            city: req.query.city,
            state: req.query.state,
            checkIn: req.query.checkIn,
            checkOut: req.query.checkOut,
            guests: req.query.guests ? parseInt(req.query.guests) : undefined,
            rooms: req.query.rooms ? parseInt(req.query.rooms) : undefined,
            minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
            maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
            minStars: req.query.minStars ? parseInt(req.query.minStars) : undefined,
            maxStars: req.query.maxStars ? parseInt(req.query.maxStars) : undefined,
            amenities: req.query.amenities ? req.query.amenities.split(',') : undefined,
            minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder,
            limit: req.query.limit ? parseInt(req.query.limit) : 50
        };
        const hotels = await hotelService.search(filters);
        res.json({
            count: hotels.length,
            filters: {
                city: filters.city,
                state: filters.state,
                checkIn: filters.checkIn,
                checkOut: filters.checkOut,
                guests: filters.guests || 1,
                rooms: filters.rooms || 1
            },
            hotels
        });
    }
    catch (error) {
        console.error('Hotel search error:', error.message);
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   GET /api/hotels/:id
 * @desc    Get hotel by ID with details
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const hotel = await hotelService.getById(req.params.id);
        res.json(hotel);
    }
    catch (error) {
        console.error('Get hotel error:', error.message);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/hotels/:id/availability
 * @desc    Check hotel room availability
 * @access  Public
 */
router.get('/:id/availability', async (req, res) => {
    try {
        const roomType = req.query.roomType || 'Standard';
        const roomCount = parseInt(req.query.rooms) || 1;
        const availability = await hotelService.checkAvailability(req.params.id, roomType, roomCount);
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
 * @route   POST /api/hotels
 * @desc    Create a new hotel
 * @access  Admin only
 */
router.post('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const hotel = await hotelService.createHotel(req.body);
        res.status(201).json({
            message: 'Hotel created successfully',
            hotel
        });
    }
    catch (error) {
        console.error('Create hotel error:', error.message);
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   POST /api/hotels/:id/rooms
 * @desc    Add room type to hotel
 * @access  Admin only
 */
router.post('/:id/rooms', auth_1.requireAdmin, async (req, res) => {
    try {
        await hotelService.addRoom({
            hotel_id: req.params.id,
            ...req.body
        });
        res.status(201).json({
            message: 'Room type added successfully'
        });
    }
    catch (error) {
        console.error('Add room error:', error.message);
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   POST /api/hotels/:id/amenities
 * @desc    Add amenity to hotel
 * @access  Admin only
 */
router.post('/:id/amenities', auth_1.requireAdmin, async (req, res) => {
    try {
        const { amenityName, isFree } = req.body;
        if (!amenityName) {
            return res.status(400).json({ error: 'Amenity name is required' });
        }
        await hotelService.addAmenity(req.params.id, amenityName, isFree !== false);
        res.status(201).json({
            message: 'Amenity added successfully'
        });
    }
    catch (error) {
        console.error('Add amenity error:', error.message);
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   PUT /api/hotels/:id
 * @desc    Update hotel
 * @access  Admin only
 */
router.put('/:id', auth_1.requireAdmin, async (req, res) => {
    try {
        const hotel = await hotelService.updateHotel(req.params.id, req.body);
        res.json({
            message: 'Hotel updated successfully',
            hotel
        });
    }
    catch (error) {
        console.error('Update hotel error:', error.message);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
});
/**
 * @route   DELETE /api/hotels/:id
 * @desc    Delete hotel
 * @access  Admin only
 */
router.delete('/:id', auth_1.requireAdmin, async (req, res) => {
    try {
        await hotelService.deleteHotel(req.params.id);
        res.json({ message: 'Hotel deleted successfully' });
    }
    catch (error) {
        console.error('Delete hotel error:', error.message);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/hotels
 * @desc    Get all hotels
 * @access  Admin only
 */
router.get('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const hotels = await hotelService.getAllHotels(limit);
        res.json({
            count: hotels.length,
            hotels
        });
    }
    catch (error) {
        console.error('Get all hotels error:', error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
