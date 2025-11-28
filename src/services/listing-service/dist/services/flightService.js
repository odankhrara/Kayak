"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlightService = void 0;
const flightRepository_1 = require("../repositories/flightRepository");
const redisCache_1 = require("../../../common/src/cache/redisCache");
class FlightService {
    constructor() {
        this.repository = new flightRepository_1.FlightRepository();
    }
    /**
     * Validate airport code format (3 letters)
     */
    validateAirportCode(code, fieldName) {
        const airportRegex = /^[A-Z]{3}$/;
        if (!airportRegex.test(code.toUpperCase())) {
            throw new Error(`Invalid ${fieldName}. Must be a 3-letter IATA code (e.g., SFO, JFK, LAX)`);
        }
    }
    /**
     * Validate date is in the future
     */
    validateFutureDate(date, fieldName) {
        const inputDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (inputDate < today) {
            throw new Error(`${fieldName} must be in the future`);
        }
    }
    /**
     * Search flights with validation
     */
    async search(filters) {
        try {
            // Validate required fields
            if (!filters.origin || !filters.destination) {
                throw new Error('Origin and destination airports are required');
            }
            // Validate airport codes
            this.validateAirportCode(filters.origin, 'Origin airport');
            this.validateAirportCode(filters.destination, 'Destination airport');
            // Check origin !== destination
            if (filters.origin.toUpperCase() === filters.destination.toUpperCase()) {
                throw new Error('Origin and destination airports must be different');
            }
            // Validate departure date if provided
            if (filters.departureDate) {
                this.validateFutureDate(filters.departureDate, 'Departure date');
            }
            // Validate return date if provided
            if (filters.returnDate && filters.departureDate) {
                const departure = new Date(filters.departureDate);
                const returnDate = new Date(filters.returnDate);
                if (returnDate < departure) {
                    throw new Error('Return date must be after departure date');
                }
            }
            // Validate passenger count
            if (filters.passengers && filters.passengers < 1) {
                throw new Error('Number of passengers must be at least 1');
            }
            if (filters.passengers && filters.passengers > 9) {
                throw new Error('Cannot book more than 9 passengers per search');
            }
            // Validate price range
            if (filters.minPrice && filters.minPrice < 0) {
                throw new Error('Minimum price cannot be negative');
            }
            if (filters.maxPrice && filters.maxPrice < 0) {
                throw new Error('Maximum price cannot be negative');
            }
            if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
                throw new Error('Minimum price cannot be greater than maximum price');
            }
            // Validate rating
            if (filters.minRating && (filters.minRating < 0 || filters.minRating > 5)) {
                throw new Error('Rating must be between 0 and 5');
            }
            // Generate cache key from filters
            const cacheKey = `flights:search:${JSON.stringify(filters)}`;
            // Try cache first
            const cachedFlights = await redisCache_1.redisCache.get(cacheKey);
            if (cachedFlights) {
                return cachedFlights;
            }
            // Cache miss - query database
            const flights = await this.repository.search(filters);
            if (flights.length === 0) {
                return [];
            }
            // Store in cache (5 minutes TTL)
            await redisCache_1.redisCache.set(cacheKey, flights, 300);
            return flights;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Get flight by ID (with caching)
     */
    async getById(flightId) {
        if (!flightId || flightId.trim().length === 0) {
            throw new Error('Flight ID is required');
        }
        // Try cache first
        const normalizedId = flightId.toUpperCase();
        const cacheKey = `flight:${normalizedId}`;
        const cachedFlight = await redisCache_1.redisCache.get(cacheKey);
        if (cachedFlight) {
            return cachedFlight;
        }
        // Cache miss - query database
        const flight = await this.repository.getById(normalizedId);
        if (!flight) {
            throw new Error(`Flight ${flightId} not found`);
        }
        // Store in cache (10 minutes TTL)
        await redisCache_1.redisCache.set(cacheKey, flight, 600);
        return flight;
    }
    /**
     * Create a new flight (Admin only)
     */
    async createFlight(flightData) {
        try {
            // Validate flight ID format
            if (!flightData.flight_id || flightData.flight_id.trim().length === 0) {
                throw new Error('Flight ID is required');
            }
            // Validate airport codes
            this.validateAirportCode(flightData.departure_airport, 'Departure airport');
            this.validateAirportCode(flightData.arrival_airport, 'Arrival airport');
            if (flightData.departure_airport === flightData.arrival_airport) {
                throw new Error('Departure and arrival airports must be different');
            }
            // Validate dates
            const departure = new Date(flightData.departure_datetime);
            const arrival = new Date(flightData.arrival_datetime);
            const now = new Date();
            if (departure < now) {
                throw new Error('Departure time must be in the future');
            }
            if (arrival <= departure) {
                throw new Error('Arrival time must be after departure time');
            }
            // Validate duration
            if (flightData.duration_minutes < 30) {
                throw new Error('Flight duration must be at least 30 minutes');
            }
            // Validate price
            if (flightData.price_per_ticket <= 0) {
                throw new Error('Price must be greater than 0');
            }
            // Validate seats
            if (flightData.total_seats < 1) {
                throw new Error('Total seats must be at least 1');
            }
            // Create flight
            return await this.repository.create(flightData);
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Update flight (Admin only) - with cache invalidation
     */
    async updateFlight(flightId, updates) {
        // Check if flight exists
        const existingFlight = await this.repository.getById(flightId);
        if (!existingFlight) {
            throw new Error(`Flight ${flightId} not found`);
        }
        // Validate updates
        if (updates.departure_airport) {
            this.validateAirportCode(updates.departure_airport, 'Departure airport');
        }
        if (updates.arrival_airport) {
            this.validateAirportCode(updates.arrival_airport, 'Arrival airport');
        }
        if (updates.pricePerTicket && updates.pricePerTicket <= 0) {
            throw new Error('Price must be greater than 0');
        }
        if (updates.totalSeats && updates.totalSeats < 1) {
            throw new Error('Total seats must be at least 1');
        }
        // Update in database
        const updatedFlight = await this.repository.update(flightId, updates);
        // Invalidate caches
        await redisCache_1.redisCache.del(`flight:${flightId}`);
        await redisCache_1.redisCache.delPattern('flights:search:*');
        console.log(`🔄 Cache invalidated for flight ${flightId}`);
        return updatedFlight;
    }
    /**
     * Delete flight (Admin only) - with cache invalidation
     */
    async deleteFlight(flightId) {
        const flight = await this.repository.getById(flightId);
        if (!flight) {
            throw new Error(`Flight ${flightId} not found`);
        }
        // Delete from database
        await this.repository.delete(flightId);
        // Invalidate caches
        await redisCache_1.redisCache.del(`flight:${flightId}`);
        await redisCache_1.redisCache.delPattern('flights:search:*');
        console.log(`🗑️  Cache invalidated for deleted flight ${flightId}`);
    }
    /**
     * Check flight availability
     */
    async checkAvailability(flightId, passengers) {
        const flight = await this.repository.getById(flightId);
        if (!flight) {
            throw new Error(`Flight ${flightId} not found`);
        }
        return {
            available: flight.availableSeats >= passengers,
            availableSeats: flight.availableSeats,
            requestedSeats: passengers
        };
    }
    /**
     * Get all flights (Admin only)
     */
    async getAllFlights(limit = 100) {
        if (limit < 1 || limit > 1000) {
            throw new Error('Limit must be between 1 and 1000');
        }
        return await this.repository.getAll(limit);
    }
}
exports.FlightService = FlightService;
