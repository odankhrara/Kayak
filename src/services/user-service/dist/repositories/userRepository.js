"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const mysqlPool_1 = __importDefault(require("@kayak/common/src/db/mysqlPool"));
class UserRepository {
    /**
     * Create a new user with SSN validation
     * SSN format must be: XXX-XX-XXXX
     */
    async create(userData) {
        // Validate SSN format
        const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
        if (!ssnRegex.test(userData.user_id)) {
            throw new Error('Invalid SSN format. Must be XXX-XX-XXXX');
        }
        // Validate state (if provided)
        if (userData.state) {
            const validStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
            if (!validStates.includes(userData.state.toUpperCase())) {
                throw new Error('Invalid state abbreviation');
            }
        }
        // Validate ZIP code (if provided)
        if (userData.zip_code) {
            const zipRegex = /^\d{5}(-\d{4})?$/;
            if (!zipRegex.test(userData.zip_code)) {
                throw new Error('Invalid ZIP code format. Must be ##### or #####-####');
            }
        }
        // Check for duplicate user
        const existing = await this.getByEmail(userData.email);
        if (existing) {
            throw new Error('User with this email already exists');
        }
        const existingSSN = await this.getById(userData.user_id);
        if (existingSSN) {
            throw new Error('User with this SSN already exists');
        }
        const [result] = await mysqlPool_1.default.execute(`INSERT INTO users (user_id, first_name, last_name, email, password_hash, phone, address, city, state, zip_code, profile_image_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`, [
            userData.user_id,
            userData.first_name,
            userData.last_name,
            userData.email,
            userData.hashedPassword,
            userData.phone || null,
            userData.address || null,
            userData.city || null,
            userData.state || null,
            userData.zip_code || null,
            userData.profile_image_id || null
        ]);
        return this.getById(userData.user_id);
    }
    async getById(userId) {
        const [rows] = await mysqlPool_1.default.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        const users = rows;
        if (users.length === 0)
            return null;
        return this.mapRowToUser(users[0]);
    }
    async getByEmail(email) {
        const [rows] = await mysqlPool_1.default.execute('SELECT * FROM users WHERE email = ?', [email]);
        const users = rows;
        if (users.length === 0)
            return null;
        return this.mapRowToUser(users[0]);
    }
    async update(userId, updates) {
        const fields = [];
        const values = [];
        // Map camelCase to snake_case for database columns
        const fieldMap = {
            firstName: 'first_name',
            lastName: 'last_name',
            email: 'email',
            phone: 'phone',
            address: 'address',
            city: 'city',
            state: 'state',
            zipCode: 'zip_code',
            profileImageId: 'profile_image_id',
            hashedPassword: 'password_hash'
        };
        Object.entries(updates).forEach(([key, value]) => {
            if (key !== 'userId' && key !== 'createdAt' && key !== 'updatedAt' && value !== undefined) {
                const dbField = fieldMap[key] || key;
                fields.push(`${dbField} = ?`);
                values.push(value);
            }
        });
        if (fields.length === 0) {
            return this.getById(userId);
        }
        values.push(userId);
        await mysqlPool_1.default.execute(`UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`, values);
        return this.getById(userId);
    }
    async delete(userId) {
        await mysqlPool_1.default.execute('DELETE FROM users WHERE user_id = ?', [userId]);
    }
    async getAllUsers() {
        const [rows] = await mysqlPool_1.default.execute('SELECT * FROM users ORDER BY created_at DESC');
        return rows.map(row => this.mapRowToUser(row));
    }
    async searchUsers(query) {
        const searchTerm = `%${query}%`;
        const [rows] = await mysqlPool_1.default.execute(`SELECT * FROM users 
       WHERE first_name LIKE ? 
       OR last_name LIKE ? 
       OR email LIKE ? 
       OR phone LIKE ?
       OR city LIKE ?
       ORDER BY created_at DESC`, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
        return rows.map(row => this.mapRowToUser(row));
    }
    async getUserBookings(userId) {
        const [rows] = await mysqlPool_1.default.execute(`SELECT b.*, 
              CASE 
                WHEN b.booking_type = 'flight' THEN f.airline_name
                WHEN b.booking_type = 'hotel' THEN h.hotel_name
                WHEN b.booking_type = 'car' THEN c.model
              END as listing_name
       FROM bookings b
       LEFT JOIN flights f ON b.booking_type = 'flight' AND b.booking_reference = f.flight_id
       LEFT JOIN hotels h ON b.booking_type = 'hotel' AND b.booking_reference = h.hotel_id
       LEFT JOIN cars c ON b.booking_type = 'car' AND b.booking_reference = c.car_id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC`, [userId]);
        return rows;
    }
    mapRowToUser(row) {
        return {
            userId: row.user_id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            hashedPassword: row.password_hash,
            phone: row.phone,
            address: row.address,
            city: row.city,
            state: row.state,
            zipCode: row.zip_code,
            profileImageId: row.profile_image_id,
            status: row.status,
            isAdmin: row.is_admin === 1 || row.is_admin === true,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
exports.UserRepository = UserRepository;
