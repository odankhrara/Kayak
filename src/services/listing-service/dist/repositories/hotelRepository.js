"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotelRepository = void 0;
const mysqlPool_1 = __importDefault(require("@kayak/common/src/db/mysqlPool"));
class HotelRepository {
    /**
     * Search hotels with comprehensive filters including room availability
     */
    async search(filters) {
        // Base query with hotels and min room price
        let query = `
      SELECT DISTINCT h.*,
             MIN(r.price_per_night) as min_price_per_night,
             MAX(r.price_per_night) as max_price_per_night
      FROM hotels h
      INNER JOIN hotel_rooms r ON h.hotel_id = r.hotel_id
      WHERE h.status = 'active' AND r.available_rooms > 0
    `;
        const params = [];
        // City/State filters
        if (filters.city) {
            query += ' AND h.city = ?';
            params.push(filters.city);
        }
        if (filters.state) {
            query += ' AND h.state = ?';
            params.push(filters.state);
        }
        // Guest/Room requirements
        if (filters.guests) {
            query += ' AND r.max_guests >= ?';
            params.push(filters.guests);
        }
        if (filters.rooms) {
            query += ' AND r.available_rooms >= ?';
            params.push(filters.rooms || 1);
        }
        // Star rating filters
        if (filters.minStars) {
            query += ' AND h.star_rating >= ?';
            params.push(filters.minStars);
        }
        if (filters.maxStars) {
            query += ' AND h.star_rating <= ?';
            params.push(filters.maxStars);
        }
        // Rating filter
        if (filters.minRating) {
            query += ' AND h.rating >= ?';
            params.push(filters.minRating);
        }
        // Amenity filters
        if (filters.amenities && filters.amenities.length > 0) {
            query += ` AND EXISTS (
        SELECT 1 FROM hotel_amenities a 
        WHERE a.hotel_id = h.hotel_id 
        AND a.amenity_name IN (${filters.amenities.map(() => '?').join(',')})
        GROUP BY a.hotel_id
        HAVING COUNT(DISTINCT a.amenity_name) = ?
      )`;
            params.push(...filters.amenities, filters.amenities.length);
        }
        // Group by hotel
        query += ' GROUP BY h.hotel_id';
        // Price filters (applied after grouping)
        if (filters.minPrice) {
            query += ' HAVING MIN(r.price_per_night) >= ?';
            params.push(filters.minPrice);
        }
        if (filters.maxPrice) {
            if (filters.minPrice) {
                query += ' AND MAX(r.price_per_night) <= ?';
            }
            else {
                query += ' HAVING MAX(r.price_per_night) <= ?';
            }
            params.push(filters.maxPrice);
        }
        // Sorting
        const sortBy = filters.sortBy === 'price' ? 'min_price_per_night' :
            filters.sortBy === 'stars' ? 'h.star_rating' :
                filters.sortBy === 'rating' ? 'h.rating' :
                    'h.rating';
        const sortOrder = filters.sortOrder || 'DESC';
        query += ` ORDER BY ${sortBy} ${sortOrder}`;
        // Limit
        if (filters.limit && filters.limit > 0) {
            query += ` LIMIT ${parseInt(String(filters.limit))}`;
        }
        const [rows] = await mysqlPool_1.default.execute(query, params);
        // Fetch rooms and amenities for each hotel
        const hotels = [];
        for (const row of rows) {
            const hotel = await this.getHotelWithDetails(row.hotel_id);
            if (hotel) {
                hotels.push({
                    ...hotel,
                    minPricePerNight: parseFloat(row.min_price_per_night),
                    maxPricePerNight: parseFloat(row.max_price_per_night)
                });
            }
        }
        return hotels;
    }
    /**
     * Get hotel by ID with all rooms and amenities
     */
    async getById(hotelId) {
        return this.getHotelWithDetails(hotelId);
    }
    /**
     * Get hotel with complete details (rooms and amenities)
     */
    async getHotelWithDetails(hotelId) {
        // Get hotel basic info
        const [hotelRows] = await mysqlPool_1.default.execute('SELECT * FROM hotels WHERE hotel_id = ?', [hotelId]);
        if (hotelRows.length === 0)
            return null;
        const hotel = hotelRows[0];
        // Get rooms
        const [roomRows] = await mysqlPool_1.default.execute('SELECT * FROM hotel_rooms WHERE hotel_id = ? ORDER BY price_per_night ASC', [hotelId]);
        // Get amenities
        const [amenityRows] = await mysqlPool_1.default.execute('SELECT amenity_name, is_free FROM hotel_amenities WHERE hotel_id = ?', [hotelId]);
        return {
            hotelId: hotel.hotel_id,
            hotelName: hotel.hotel_name,
            address: hotel.address,
            city: hotel.city,
            state: hotel.state,
            zipCode: hotel.zip_code,
            starRating: hotel.star_rating,
            description: hotel.description,
            totalRooms: hotel.total_rooms,
            rating: hotel.rating ? parseFloat(hotel.rating) : 0,
            reviewsCount: hotel.reviews_count || 0,
            latitude: hotel.latitude,
            longitude: hotel.longitude,
            status: hotel.status,
            rooms: roomRows.map(r => ({
                roomId: r.room_id,
                roomType: r.room_type,
                pricePerNight: parseFloat(r.price_per_night),
                maxGuests: r.max_guests,
                totalRooms: r.total_rooms,
                availableRooms: r.available_rooms,
                description: r.description
            })),
            amenities: amenityRows.map(a => ({
                name: a.amenity_name,
                isFree: a.is_free
            })),
            createdAt: hotel.created_at,
            updatedAt: hotel.updated_at
        };
    }
    /**
     * Create a new hotel (Admin only)
     */
    async create(hotelData) {
        await mysqlPool_1.default.execute(`INSERT INTO hotels (
        hotel_id, hotel_name, address, city, state, zip_code,
        star_rating, description, total_rooms, latitude, longitude, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`, [
            hotelData.hotel_id,
            hotelData.hotel_name,
            hotelData.address,
            hotelData.city,
            hotelData.state,
            hotelData.zip_code,
            hotelData.star_rating,
            hotelData.description || null,
            hotelData.total_rooms,
            hotelData.latitude || null,
            hotelData.longitude || null
        ]);
        return this.getById(hotelData.hotel_id);
    }
    /**
     * Update hotel (Admin only)
     */
    async update(hotelId, updates) {
        const fields = [];
        const values = [];
        const fieldMap = {
            hotelName: 'hotel_name',
            address: 'address',
            city: 'city',
            state: 'state',
            zipCode: 'zip_code',
            starRating: 'star_rating',
            description: 'description',
            totalRooms: 'total_rooms',
            status: 'status'
        };
        Object.entries(updates).forEach(([key, value]) => {
            if (key !== 'hotelId' && value !== undefined) {
                const dbField = fieldMap[key] || key;
                fields.push(`${dbField} = ?`);
                values.push(value);
            }
        });
        if (fields.length === 0) {
            return this.getById(hotelId);
        }
        values.push(hotelId);
        await mysqlPool_1.default.execute(`UPDATE hotels SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE hotel_id = ?`, values);
        return this.getById(hotelId);
    }
    /**
     * Add room type to hotel (Admin only)
     */
    async addRoom(roomData) {
        await mysqlPool_1.default.execute(`INSERT INTO hotel_rooms (hotel_id, room_type, price_per_night, max_guests, total_rooms, available_rooms, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            roomData.hotel_id,
            roomData.room_type,
            roomData.price_per_night,
            roomData.max_guests,
            roomData.total_rooms,
            roomData.total_rooms, // Initially all available
            roomData.description || null
        ]);
    }
    /**
     * Add amenity to hotel (Admin only)
     */
    async addAmenity(hotelId, amenityName, isFree = true) {
        await mysqlPool_1.default.execute('INSERT INTO hotel_amenities (hotel_id, amenity_name, is_free) VALUES (?, ?, ?)', [hotelId, amenityName, isFree]);
    }
    /**
     * Decrease room availability when booking
     */
    async decreaseRoomAvailability(hotelId, roomType, roomCount, connection) {
        const conn = connection || mysqlPool_1.default;
        // Check availability
        const [rows] = await conn.execute('SELECT available_rooms FROM hotel_rooms WHERE hotel_id = ? AND room_type = ? FOR UPDATE', [hotelId, roomType]);
        const room = rows[0];
        if (!room) {
            throw new Error('Room type not found');
        }
        if (room.available_rooms < roomCount) {
            throw new Error(`Not enough rooms available. Only ${room.available_rooms} rooms left.`);
        }
        // Decrease availability
        await conn.execute('UPDATE hotel_rooms SET available_rooms = available_rooms - ? WHERE hotel_id = ? AND room_type = ?', [roomCount, hotelId, roomType]);
    }
    /**
     * Increase room availability when booking cancelled
     */
    async increaseRoomAvailability(hotelId, roomType, roomCount, connection) {
        const conn = connection || mysqlPool_1.default;
        await conn.execute('UPDATE hotel_rooms SET available_rooms = available_rooms + ? WHERE hotel_id = ? AND room_type = ? AND available_rooms < total_rooms', [roomCount, hotelId, roomType]);
    }
    /**
     * Get all hotels for admin
     */
    async getAll(limit = 100) {
        const [rows] = await mysqlPool_1.default.execute('SELECT * FROM hotels ORDER BY created_at DESC LIMIT ?', [limit]);
        const hotels = [];
        for (const row of rows) {
            const hotel = await this.getHotelWithDetails(row.hotel_id);
            if (hotel)
                hotels.push(hotel);
        }
        return hotels;
    }
    /**
     * Delete hotel (Admin only)
     */
    async delete(hotelId) {
        // CASCADE will delete rooms and amenities
        await mysqlPool_1.default.execute('DELETE FROM hotels WHERE hotel_id = ?', [hotelId]);
    }
}
exports.HotelRepository = HotelRepository;
