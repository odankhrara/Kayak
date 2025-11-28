"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarService = void 0;
const carRepository_1 = require("../repositories/carRepository");
class CarService {
    constructor() {
        this.repository = new carRepository_1.CarRepository();
    }
    /**
     * Validate dates
     */
    validateDates(pickupDate, returnDate) {
        const pickup = new Date(pickupDate);
        const returnD = new Date(returnDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (pickup < today) {
            throw new Error('Pickup date must be today or in the future');
        }
        if (returnD <= pickup) {
            throw new Error('Return date must be after pickup date');
        }
        // Calculate days
        const days = Math.ceil((returnD.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));
        if (days > 30) {
            throw new Error('Cannot rent a car for more than 30 days at once');
        }
    }
    /**
     * Search cars with validation
     */
    async search(filters) {
        try {
            // Validate required fields
            if (!filters.location) {
                throw new Error('Location is required for car search');
            }
            // Validate dates if provided
            if (filters.pickupDate && filters.returnDate) {
                this.validateDates(filters.pickupDate, filters.returnDate);
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
            // Validate seats
            if (filters.minSeats && filters.minSeats < 1) {
                throw new Error('Minimum seats must be at least 1');
            }
            // Validate rating
            if (filters.minRating && (filters.minRating < 0 || filters.minRating > 5)) {
                throw new Error('Rating must be between 0 and 5');
            }
            // Search cars
            const cars = await this.repository.search(filters);
            return cars;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Get car by ID
     */
    async getById(carId) {
        if (!carId || carId.trim().length === 0) {
            throw new Error('Car ID is required');
        }
        const car = await this.repository.getById(carId);
        if (!car) {
            throw new Error(`Car ${carId} not found`);
        }
        return car;
    }
    /**
     * Create a new car (Admin only)
     */
    async createCar(carData) {
        try {
            // Validate required fields
            if (!carData.model || carData.model.trim().length === 0) {
                throw new Error('Car model is required');
            }
            if (!carData.company_name || carData.company_name.trim().length === 0) {
                throw new Error('Company name is required');
            }
            if (!carData.location || carData.location.trim().length === 0) {
                throw new Error('Location is required');
            }
            // Validate year
            const currentYear = new Date().getFullYear();
            if (carData.year < 2000 || carData.year > currentYear + 1) {
                throw new Error(`Year must be between 2000 and ${currentYear + 1}`);
            }
            // Validate seats
            if (carData.seats < 2 || carData.seats > 15) {
                throw new Error('Seats must be between 2 and 15');
            }
            // Validate daily rate
            if (carData.daily_rate <= 0) {
                throw new Error('Daily rate must be greater than 0');
            }
            return await this.repository.create(carData);
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Update car (Admin only)
     */
    async updateCar(carId, updates) {
        const car = await this.repository.getById(carId);
        if (!car) {
            throw new Error(`Car ${carId} not found`);
        }
        // Validate updates
        if (updates.year) {
            const currentYear = new Date().getFullYear();
            if (updates.year < 2000 || updates.year > currentYear + 1) {
                throw new Error(`Year must be between 2000 and ${currentYear + 1}`);
            }
        }
        if (updates.seats && (updates.seats < 2 || updates.seats > 15)) {
            throw new Error('Seats must be between 2 and 15');
        }
        if (updates.dailyRate && updates.dailyRate <= 0) {
            throw new Error('Daily rate must be greater than 0');
        }
        return await this.repository.update(carId, updates);
    }
    /**
     * Check car availability
     */
    async checkAvailability(carId) {
        const car = await this.repository.getById(carId);
        if (!car) {
            throw new Error(`Car ${carId} not found`);
        }
        return {
            available: car.available,
            carId: car.carId
        };
    }
    /**
     * Get all cars (Admin only)
     */
    async getAllCars(limit = 100) {
        if (limit < 1 || limit > 1000) {
            throw new Error('Limit must be between 1 and 1000');
        }
        return await this.repository.getAll(limit);
    }
    /**
     * Delete car (Admin only)
     */
    async deleteCar(carId) {
        const car = await this.repository.getById(carId);
        if (!car) {
            throw new Error(`Car ${carId} not found`);
        }
        await this.repository.delete(carId);
    }
    /**
     * Calculate rental cost
     */
    calculateRentalCost(dailyRate, pickupDate, returnDate) {
        const pickup = new Date(pickupDate);
        const returnD = new Date(returnDate);
        const days = Math.ceil((returnD.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));
        const subtotal = dailyRate * days;
        const tax = subtotal * 0.1; // 10% tax
        const total = subtotal + tax;
        return {
            days,
            dailyRate,
            subtotal: parseFloat(subtotal.toFixed(2)),
            tax: parseFloat(tax.toFixed(2)),
            total: parseFloat(total.toFixed(2))
        };
    }
}
exports.CarService = CarService;
