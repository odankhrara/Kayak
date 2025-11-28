"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarRepository = void 0;
const mysqlPool_1 = __importDefault(require("@kayak/common/src/db/mysqlPool"));
class CarRepository {
    /**
     * Search cars with filters
     */
    async search(filters) {
        let query = 'SELECT * FROM cars WHERE available = true';
        const params = [];
        // Location filter (city, state or full location)
        if (filters.location) {
            query += ' AND location LIKE ?';
            params.push(`%${filters.location}%`);
        }
        // Car type filter
        if (filters.carType) {
            query += ' AND car_type = ?';
            params.push(filters.carType);
        }
        // Transmission filter
        if (filters.transmission) {
            query += ' AND transmission = ?';
            params.push(filters.transmission);
        }
        // Price range filters
        if (filters.minPrice) {
            query += ' AND daily_rate >= ?';
            params.push(filters.minPrice);
        }
        if (filters.maxPrice) {
            query += ' AND daily_rate <= ?';
            params.push(filters.maxPrice);
        }
        // Seats filter
        if (filters.minSeats) {
            query += ' AND seats >= ?';
            params.push(filters.minSeats);
        }
        // Company filter
        if (filters.company) {
            query += ' AND company_name LIKE ?';
            params.push(`%${filters.company}%`);
        }
        // Rating filter
        if (filters.minRating) {
            query += ' AND rating >= ?';
            params.push(filters.minRating);
        }
        // Sorting
        const sortBy = filters.sortBy === 'price' ? 'daily_rate' :
            filters.sortBy === 'rating' ? 'rating' :
                'daily_rate';
        const sortOrder = filters.sortOrder || 'ASC';
        query += ` ORDER BY ${sortBy} ${sortOrder}`;
        // Limit
        if (filters.limit && filters.limit > 0) {
            query += ' LIMIT ?';
            params.push(filters.limit);
        }
        const [rows] = await mysqlPool_1.default.execute(query, params);
        return rows.map(row => this.mapRowToCar(row));
    }
    /**
     * Get car by ID
     */
    async getById(carId) {
        const [rows] = await mysqlPool_1.default.execute('SELECT * FROM cars WHERE car_id = ?', [carId]);
        if (rows.length === 0)
            return null;
        return this.mapRowToCar(rows[0]);
    }
    /**
     * Create a new car (Admin only)
     */
    async create(carData) {
        await mysqlPool_1.default.execute(`INSERT INTO cars (
        car_id, car_type, company_name, model, year, transmission,
        seats, daily_rate, location, available
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true)`, [
            carData.car_id,
            carData.car_type,
            carData.company_name,
            carData.model,
            carData.year,
            carData.transmission,
            carData.seats,
            carData.daily_rate,
            carData.location
        ]);
        return this.getById(carData.car_id);
    }
    /**
     * Update car details (Admin only)
     */
    async update(carId, updates) {
        const fields = [];
        const values = [];
        const fieldMap = {
            carType: 'car_type',
            companyName: 'company_name',
            model: 'model',
            year: 'year',
            transmission: 'transmission',
            seats: 'seats',
            dailyRate: 'daily_rate',
            location: 'location',
            available: 'available'
        };
        Object.entries(updates).forEach(([key, value]) => {
            if (key !== 'carId' && key !== 'createdAt' && key !== 'updatedAt' && value !== undefined) {
                const dbField = fieldMap[key] || key;
                fields.push(`${dbField} = ?`);
                values.push(value);
            }
        });
        if (fields.length === 0) {
            return this.getById(carId);
        }
        values.push(carId);
        await mysqlPool_1.default.execute(`UPDATE cars SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE car_id = ?`, values);
        return this.getById(carId);
    }
    /**
     * Mark car as unavailable (when booked)
     */
    async markUnavailable(carId, connection) {
        const conn = connection || mysqlPool_1.default;
        // Check if car exists and is available
        const [rows] = await conn.execute('SELECT available FROM cars WHERE car_id = ? FOR UPDATE', [carId]);
        const car = rows[0];
        if (!car) {
            throw new Error('Car not found');
        }
        if (!car.available) {
            throw new Error('Car is already booked');
        }
        // Mark unavailable
        await conn.execute('UPDATE cars SET available = false WHERE car_id = ?', [carId]);
    }
    /**
     * Mark car as available (when booking cancelled or returned)
     */
    async markAvailable(carId, connection) {
        const conn = connection || mysqlPool_1.default;
        await conn.execute('UPDATE cars SET available = true WHERE car_id = ?', [carId]);
    }
    /**
     * Get all cars for admin
     */
    async getAll(limit = 100) {
        const [rows] = await mysqlPool_1.default.execute('SELECT * FROM cars ORDER BY created_at DESC LIMIT ?', [limit]);
        return rows.map(row => this.mapRowToCar(row));
    }
    /**
     * Delete car (Admin only)
     */
    async delete(carId) {
        await mysqlPool_1.default.execute('DELETE FROM cars WHERE car_id = ?', [carId]);
    }
    mapRowToCar(row) {
        return {
            carId: row.car_id,
            carType: row.car_type,
            companyName: row.company_name,
            model: row.model,
            year: row.year,
            transmission: row.transmission,
            seats: row.seats,
            dailyRate: parseFloat(row.daily_rate),
            location: row.location,
            rating: row.rating ? parseFloat(row.rating) : 0,
            reviewsCount: row.reviews_count || 0,
            available: row.available,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
exports.CarRepository = CarRepository;
