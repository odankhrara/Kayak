"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlightRepository = void 0;
const mysqlPool_1 = __importDefault(require("@kayak/common/src/db/mysqlPool"));
class FlightRepository {
    /**
     * Search flights with comprehensive filters
     */
    async search(filters) {
        let query = `SELECT * FROM flights WHERE status = 'scheduled' AND available_seats > 0`;
        const params = [];
        // Origin/Destination filters
        if (filters.origin) {
            query += ' AND departure_airport = ?';
            params.push(filters.origin.toUpperCase());
        }
        if (filters.destination) {
            query += ' AND arrival_airport = ?';
            params.push(filters.destination.toUpperCase());
        }
        // Date filters
        if (filters.departureDate) {
            query += ' AND DATE(departure_datetime) = ?';
            params.push(filters.departureDate);
        }
        // Passenger count (check available seats)
        if (filters.passengers) {
            query += ' AND available_seats >= ?';
            params.push(filters.passengers);
        }
        // Flight class filter
        if (filters.class) {
            query += ' AND flight_class = ?';
            params.push(filters.class);
        }
        // Price range filters
        if (filters.minPrice) {
            query += ' AND price_per_ticket >= ?';
            params.push(filters.minPrice);
        }
        if (filters.maxPrice) {
            query += ' AND price_per_ticket <= ?';
            params.push(filters.maxPrice);
        }
        // Airline filter
        if (filters.airline) {
            query += ' AND airline_name LIKE ?';
            params.push(`%${filters.airline}%`);
        }
        // Departure time filters
        if (filters.departureTimeMin) {
            query += ' AND TIME(departure_datetime) >= ?';
            params.push(filters.departureTimeMin);
        }
        if (filters.departureTimeMax) {
            query += ' AND TIME(departure_datetime) <= ?';
            params.push(filters.departureTimeMax);
        }
        // Rating filter
        if (filters.minRating) {
            query += ' AND rating >= ?';
            params.push(filters.minRating);
        }
        // Sorting
        const validSortFields = ['price_per_ticket', 'duration_minutes', 'rating', 'departure_datetime'];
        const sortBy = filters.sortBy === 'price' ? 'price_per_ticket' :
            filters.sortBy === 'duration' ? 'duration_minutes' :
                filters.sortBy === 'departure_time' ? 'departure_datetime' :
                    filters.sortBy || 'departure_datetime';
        const sortOrder = filters.sortOrder || 'ASC';
        if (validSortFields.includes(sortBy)) {
            query += ` ORDER BY ${sortBy} ${sortOrder}`;
        }
        // Limit results (use direct value, not placeholder, to avoid MySQL prepared statement issues)
        if (filters.limit && filters.limit > 0) {
            query += ` LIMIT ${parseInt(String(filters.limit))}`;
        }
        const [rows] = await mysqlPool_1.default.execute(query, params);
        return rows.map(row => this.mapRowToFlight(row));
    }
    async getById(flightId) {
        const [rows] = await mysqlPool_1.default.execute('SELECT * FROM flights WHERE flight_id = ?', [flightId]);
        const flights = rows;
        if (flights.length === 0)
            return null;
        return this.mapRowToFlight(flights[0]);
    }
    /**
     * Create a new flight (Admin only)
     */
    async create(flightData) {
        const available_seats = flightData.total_seats;
        await mysqlPool_1.default.execute(`INSERT INTO flights (
        flight_id, airline_name, departure_airport, arrival_airport,
        departure_datetime, arrival_datetime, duration_minutes, flight_class,
        price_per_ticket, total_seats, available_seats, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`, [
            flightData.flight_id.toUpperCase(),
            flightData.airline_name,
            flightData.departure_airport.toUpperCase(),
            flightData.arrival_airport.toUpperCase(),
            flightData.departure_datetime,
            flightData.arrival_datetime,
            flightData.duration_minutes,
            flightData.flight_class,
            flightData.price_per_ticket,
            flightData.total_seats,
            available_seats
        ]);
        return this.getById(flightData.flight_id);
    }
    /**
     * Update flight details (Admin only)
     */
    async update(flightId, updates) {
        const fields = [];
        const values = [];
        const fieldMap = {
            airlineName: 'airline_name',
            departureAirport: 'departure_airport',
            arrivalAirport: 'arrival_airport',
            departureDatetime: 'departure_datetime',
            arrivalDatetime: 'arrival_datetime',
            durationMinutes: 'duration_minutes',
            flightClass: 'flight_class',
            pricePerTicket: 'price_per_ticket',
            totalSeats: 'total_seats',
            availableSeats: 'available_seats',
            status: 'status'
        };
        Object.entries(updates).forEach(([key, value]) => {
            if (key !== 'flightId' && key !== 'createdAt' && key !== 'updatedAt' && value !== undefined) {
                const dbField = fieldMap[key] || key;
                fields.push(`${dbField} = ?`);
                values.push(value);
            }
        });
        if (fields.length === 0) {
            return this.getById(flightId);
        }
        values.push(flightId);
        await mysqlPool_1.default.execute(`UPDATE flights SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE flight_id = ?`, values);
        return this.getById(flightId);
    }
    /**
     * Decrease available seats when booking (with transaction support)
     */
    async decreaseAvailableSeats(flightId, seatCount, connection) {
        const conn = connection || mysqlPool_1.default;
        // First check if enough seats available
        const [rows] = await conn.execute('SELECT available_seats FROM flights WHERE flight_id = ? FOR UPDATE', [flightId]);
        const flight = rows[0];
        if (!flight) {
            throw new Error('Flight not found');
        }
        if (flight.available_seats < seatCount) {
            throw new Error(`Not enough seats available. Only ${flight.available_seats} seats left.`);
        }
        // Decrease seats
        await conn.execute('UPDATE flights SET available_seats = available_seats - ? WHERE flight_id = ?', [seatCount, flightId]);
    }
    /**
     * Increase available seats when booking is cancelled
     */
    async increaseAvailableSeats(flightId, seatCount, connection) {
        const conn = connection || mysqlPool_1.default;
        await conn.execute('UPDATE flights SET available_seats = available_seats + ? WHERE flight_id = ? AND available_seats < total_seats', [seatCount, flightId]);
    }
    /**
     * Get all flights for admin (no filters)
     */
    async getAll(limit = 100) {
        const [rows] = await mysqlPool_1.default.execute(`SELECT * FROM flights ORDER BY departure_datetime DESC LIMIT ${parseInt(String(limit))}`);
        return rows.map(row => this.mapRowToFlight(row));
    }
    /**
     * Delete flight (Admin only)
     */
    async delete(flightId) {
        await mysqlPool_1.default.execute('DELETE FROM flights WHERE flight_id = ?', [flightId]);
    }
    mapRowToFlight(row) {
        return {
            flightId: row.flight_id,
            airlineName: row.airline_name,
            departureAirport: row.departure_airport,
            arrivalAirport: row.arrival_airport,
            departureDatetime: row.departure_datetime,
            arrivalDatetime: row.arrival_datetime,
            durationMinutes: row.duration_minutes,
            flightClass: row.flight_class,
            pricePerTicket: parseFloat(row.price_per_ticket),
            totalSeats: row.total_seats,
            availableSeats: row.available_seats,
            rating: row.rating ? parseFloat(row.rating) : 0,
            reviewsCount: row.reviews_count || 0,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
exports.FlightRepository = FlightRepository;
