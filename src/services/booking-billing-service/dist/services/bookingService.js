"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const bookingRepository_1 = require("../repositories/bookingRepository");
const billingRepository_1 = require("../repositories/billingRepository");
const mysqlPool_1 = __importDefault(require("@kayak/common/src/db/mysqlPool"));
class BookingService {
    constructor() {
        this.bookingRepository = new bookingRepository_1.BookingRepository();
        this.billingRepository = new billingRepository_1.BillingRepository();
    }
    /**
     * Generate unique booking reference
     */
    generateBookingRef(type) {
        const prefix = type.charAt(0).toUpperCase();
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}${timestamp}${random}`;
    }
    /**
     * Validate credit card (basic validation)
     */
    validateCreditCard(cardNumber, cvv, expiryDate) {
        // Basic card number validation (length)
        if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
            throw new Error('Invalid credit card number');
        }
        // CVV validation
        if (!cvv || cvv.length < 3 || cvv.length > 4) {
            throw new Error('Invalid CVV');
        }
        // Expiry date validation (MM/YY format)
        const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
        if (!expiryRegex.test(expiryDate)) {
            throw new Error('Invalid expiry date. Format must be MM/YY');
        }
        // Check if card is expired
        const [month, year] = expiryDate.split('/').map(Number);
        const expiry = new Date(2000 + year, month - 1);
        const now = new Date();
        if (expiry < now) {
            throw new Error('Credit card has expired');
        }
    }
    /**
     * Check inventory availability and reserve it
     */
    async checkAndReserveInventory(bookingType, entityId, quantity, connection) {
        try {
            if (bookingType === 'flight') {
                // Check flight availability
                const [flightRows] = await connection.execute('SELECT available_seats FROM flights WHERE flight_id = ? FOR UPDATE', [entityId]);
                const flight = flightRows[0];
                if (!flight) {
                    throw new Error(`Flight ${entityId} not found`);
                }
                if (flight.available_seats < quantity) {
                    throw new Error(`Insufficient seats available. Requested: ${quantity}, Available: ${flight.available_seats}`);
                }
                // Reserve seats
                await connection.execute('UPDATE flights SET available_seats = available_seats - ? WHERE flight_id = ?', [quantity, entityId]);
            }
            else if (bookingType === 'hotel') {
                // Check hotel room availability
                const [roomRows] = await connection.execute('SELECT available_rooms FROM hotel_rooms WHERE hotel_id = ? AND room_type = ? FOR UPDATE', [entityId.split(':')[0], entityId.split(':')[1] || 'Standard']);
                const room = roomRows[0];
                if (!room) {
                    throw new Error(`Hotel room not found for ${entityId}`);
                }
                if (room.available_rooms < quantity) {
                    throw new Error(`Insufficient rooms available. Requested: ${quantity}, Available: ${room.available_rooms}`);
                }
                // Reserve rooms
                await connection.execute('UPDATE hotel_rooms SET available_rooms = available_rooms - ? WHERE hotel_id = ? AND room_type = ?', [quantity, entityId.split(':')[0], entityId.split(':')[1] || 'Standard']);
            }
            else if (bookingType === 'car') {
                // Check car availability
                const [carRows] = await connection.execute('SELECT availability_status FROM cars WHERE car_id = ? FOR UPDATE', [entityId]);
                const car = carRows[0];
                if (!car) {
                    throw new Error(`Car ${entityId} not found`);
                }
                if (car.availability_status !== 'available') {
                    throw new Error(`Car ${entityId} is not available`);
                }
                // Mark car as unavailable
                await connection.execute('UPDATE cars SET availability_status = ? WHERE car_id = ?', ['unavailable', entityId]);
            }
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Create a booking with payment (full transaction)
     */
    async createBookingWithPayment(bookingData) {
        const connection = await mysqlPool_1.default.getConnection();
        try {
            // Start transaction
            await connection.beginTransaction();
            // 1. Validate payment details
            if (bookingData.paymentMethod === 'credit_card' || bookingData.paymentMethod === 'debit_card') {
                this.validateCreditCard(bookingData.paymentDetails.cardNumber, bookingData.paymentDetails.cvv, bookingData.paymentDetails.expiryDate);
            }
            else if (bookingData.paymentMethod === 'paypal') {
                if (!bookingData.paymentDetails.paypalEmail) {
                    throw new Error('PayPal email is required');
                }
            }
            // 2. Check and reserve inventory
            await this.checkAndReserveInventory(bookingData.bookingType, bookingData.entityId, bookingData.quantity, connection);
            // 3. Create booking record
            const bookingRef = this.generateBookingRef(bookingData.bookingType);
            const booking = await this.bookingRepository.create({
                userId: bookingData.userId,
                bookingType: bookingData.bookingType,
                bookingRef,
                status: 'pending',
                checkInDate: bookingData.checkInDate,
                checkOutDate: bookingData.checkOutDate,
                bookingDate: new Date().toISOString().split('T')[0],
                totalAmount: bookingData.totalAmount
            }, connection);
            // 4. Process payment and create billing record
            const billing = await this.billingRepository.create({
                userId: bookingData.userId,
                bookingId: booking.bookingId,
                bookingType: bookingData.bookingType,
                amount: bookingData.totalAmount,
                paymentMethod: bookingData.paymentMethod,
                status: 'completed',
                transactionDate: new Date(),
                invoiceDetails: {
                    bookingRef,
                    entityId: bookingData.entityId,
                    quantity: bookingData.quantity,
                    checkIn: bookingData.checkInDate,
                    checkOut: bookingData.checkOutDate
                },
                receiptDetails: {
                    transactionId: `TXN${Date.now()}`,
                    paymentMethod: bookingData.paymentMethod,
                    lastFourDigits: bookingData.paymentDetails.cardNumber?.slice(-4) || 'N/A'
                }
            }, connection);
            // 5. Update booking status to 'confirmed'
            await this.bookingRepository.updateStatus(booking.bookingId, 'confirmed', connection);
            // Commit transaction
            await connection.commit();
            return {
                booking: { ...booking, status: 'confirmed' },
                billing,
                message: `Booking ${bookingRef} created successfully. Payment confirmed.`
            };
        }
        catch (error) {
            // Rollback on any error
            await connection.rollback();
            throw new Error(`Booking failed: ${error.message}`);
        }
        finally {
            connection.release();
        }
    }
    /**
     * Get booking by ID
     */
    async getById(bookingId) {
        if (!bookingId || bookingId.trim().length === 0) {
            throw new Error('Booking ID is required');
        }
        const booking = await this.bookingRepository.getById(bookingId);
        if (!booking) {
            throw new Error(`Booking ${bookingId} not found`);
        }
        return booking;
    }
    /**
     * Get user's booking history
     */
    async getUserBookings(userId, filter) {
        if (!userId || userId.trim().length === 0) {
            throw new Error('User ID is required');
        }
        const bookings = await this.bookingRepository.getByUserId(userId);
        // Filter by date if requested
        if (filter) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return bookings.filter((booking) => {
                const checkIn = new Date(booking.checkInDate);
                const checkOut = new Date(booking.checkOutDate);
                if (filter === 'past') {
                    return checkOut < today;
                }
                else if (filter === 'current') {
                    return checkIn <= today && checkOut >= today;
                }
                else if (filter === 'future') {
                    return checkIn > today;
                }
                return true;
            });
        }
        return bookings;
    }
    /**
     * Cancel booking with refund
     */
    async cancelBooking(bookingId, userId, reason) {
        const connection = await mysqlPool_1.default.getConnection();
        try {
            await connection.beginTransaction();
            // Get booking
            const booking = await this.bookingRepository.getById(bookingId, connection);
            if (!booking) {
                throw new Error(`Booking ${bookingId} not found`);
            }
            // Verify user owns this booking
            if (booking.userId !== userId) {
                throw new Error('You do not have permission to cancel this booking');
            }
            // Check if already cancelled
            if (booking.status === 'cancelled') {
                throw new Error('Booking is already cancelled');
            }
            // Check cancellation policy (24 hours before check-in)
            const checkInDate = new Date(booking.checkInDate);
            const now = new Date();
            const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            let refundPercentage = 0;
            if (hoursUntilCheckIn > 24) {
                refundPercentage = 1.0; // 100% refund
            }
            else if (hoursUntilCheckIn > 0) {
                refundPercentage = 0.5; // 50% refund
            }
            else {
                throw new Error('Cannot cancel booking after check-in date');
            }
            const refundAmount = booking.totalAmount * refundPercentage;
            // Cancel booking
            await this.bookingRepository.cancelBooking(bookingId, connection);
            // Create refund billing record
            await this.billingRepository.create({
                userId: booking.userId,
                bookingId: booking.bookingId,
                bookingType: booking.bookingType,
                amount: -refundAmount,
                paymentMethod: 'refund',
                status: 'completed',
                transactionDate: new Date(),
                invoiceDetails: {
                    reason: reason || 'Booking cancelled by user',
                    originalAmount: booking.totalAmount,
                    refundPercentage: refundPercentage * 100
                },
                receiptDetails: {
                    transactionId: `REFUND${Date.now()}`,
                    refundAmount
                }
            }, connection);
            await connection.commit();
            return {
                message: `Booking ${bookingId} cancelled successfully`,
                refundAmount
            };
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    /**
     * Update booking status (Admin only)
     */
    async updateStatus(bookingId, status) {
        const booking = await this.bookingRepository.getById(bookingId);
        if (!booking) {
            throw new Error(`Booking ${bookingId} not found`);
        }
        const connection = await mysqlPool_1.default.getConnection();
        try {
            await connection.beginTransaction();
            await this.bookingRepository.updateStatus(bookingId, status, connection);
            await connection.commit();
            return { ...booking, status };
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    /**
     * Get all bookings (Admin only)
     */
    async getAllBookings(limit = 100) {
        if (limit < 1 || limit > 1000) {
            throw new Error('Limit must be between 1 and 1000');
        }
        return await this.bookingRepository.getAll(limit);
    }
}
exports.BookingService = BookingService;
