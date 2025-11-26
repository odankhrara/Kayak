import { PoolConnection } from 'mysql2/promise'
import mysqlPool from '@kayak/common/src/db/mysqlPool'
import { Booking } from '../models/Booking'

export class BookingRepository {
  /**
   * Create a booking with transaction support
   * Must be called within a transaction to ensure atomicity with inventory updates
   */
  async create(bookingData: {
    booking_id: string;
    user_id: string;
    booking_type: 'flight' | 'hotel' | 'car';
    booking_reference: string; // flight_id, hotel_id, or car_id
    confirmation_code: string;
    start_date: string;
    end_date?: string;
    guests: number;
    total_amount: number;
    special_requests?: string;
  }, connection?: PoolConnection): Promise<any> {
    const conn = connection || mysqlPool

    // Insert booking
    await conn.execute(
      `INSERT INTO bookings (
        booking_id, user_id, booking_type, booking_reference, confirmation_code,
        status, start_date, end_date, guests, total_amount, special_requests
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
      [
        bookingData.booking_id,
        bookingData.user_id,
        bookingData.booking_type,
        bookingData.booking_reference,
        bookingData.confirmation_code,
        bookingData.start_date,
        bookingData.end_date || null,
        bookingData.guests,
        bookingData.total_amount,
        bookingData.special_requests || null
      ]
    )

    return this.getById(bookingData.booking_id)
  }

  /**
   * Add flight passenger details for flight bookings
   */
  async addFlightPassengers(bookingId: string, flightId: string, passengers: Array<{
    first_name: string;
    last_name: string;
    dob: string;
    passport_number?: string;
    seat_number?: string;
  }>, connection?: PoolConnection): Promise<void> {
    const conn = connection || mysqlPool

    for (const passenger of passengers) {
      await conn.execute(
        `INSERT INTO flight_booking_details (
          booking_id, flight_id, passenger_first_name, passenger_last_name,
          passenger_dob, passport_number, seat_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          bookingId,
          flightId,
          passenger.first_name,
          passenger.last_name,
          passenger.dob,
          passenger.passport_number || null,
          passenger.seat_number || null
        ]
      )
    }
  }

  /**
   * Get booking by ID
   */
  async getById(bookingId: string): Promise<any | null> {
    const [rows] = await mysqlPool.execute(
      `SELECT b.*,
              CASE 
                WHEN b.booking_type = 'flight' THEN f.airline_name
                WHEN b.booking_type = 'hotel' THEN h.hotel_name
                WHEN b.booking_type = 'car' THEN c.model
              END as listing_name,
              CASE 
                WHEN b.booking_type = 'flight' THEN f.departure_airport
                WHEN b.booking_type = 'hotel' THEN h.city
                WHEN b.booking_type = 'car' THEN c.location
              END as listing_location
       FROM bookings b
       LEFT JOIN flights f ON b.booking_type = 'flight' AND b.booking_reference = f.flight_id
       LEFT JOIN hotels h ON b.booking_type = 'hotel' AND b.booking_reference = h.hotel_id
       LEFT JOIN cars c ON b.booking_type = 'car' AND b.booking_reference = c.car_id
       WHERE b.booking_id = ?`,
      [bookingId]
    )

    if ((rows as any[]).length === 0) return null
    
    const booking = (rows as any[])[0]

    // If flight booking, get passenger details
    if (booking.booking_type === 'flight') {
      const [passengers] = await mysqlPool.execute(
        'SELECT * FROM flight_booking_details WHERE booking_id = ?',
        [bookingId]
      )
      booking.passengers = passengers
    }

    return this.mapRowToBooking(booking)
  }

  /**
   * Get bookings by user ID
   */
  async getByUserId(userId: string, filters?: {
    type?: 'past' | 'current' | 'future' | 'all';
    category?: 'flight' | 'hotel' | 'car' | 'all';
  }): Promise<any[]> {
    let query = `
      SELECT b.*,
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
    `
    const params: any[] = [userId]

    // Filter by category
    if (filters?.category && filters.category !== 'all') {
      query += ' AND b.booking_type = ?'
      params.push(filters.category)
    }

    // Filter by time
    if (filters?.type) {
      const today = new Date().toISOString().split('T')[0]
      if (filters.type === 'past') {
        query += ' AND b.end_date < ?'
        params.push(today)
      } else if (filters.type === 'current') {
        query += ' AND b.start_date <= ? AND (b.end_date >= ? OR b.end_date IS NULL)'
        params.push(today, today)
      } else if (filters.type === 'future') {
        query += ' AND b.start_date > ?'
        params.push(today)
      }
    }

    query += ' ORDER BY b.booking_date DESC'

    const [rows] = await mysqlPool.execute(query, params)
    return (rows as any[]).map(row => this.mapRowToBooking(row))
  }

  /**
   * Update booking status
   */
  async updateStatus(bookingId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed', connection?: PoolConnection): Promise<void> {
    const conn = connection || mysqlPool

    await conn.execute(
      'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE booking_id = ?',
      [status, bookingId]
    )
  }

  /**
   * Cancel booking
   */
  async cancel(bookingId: string, connection?: PoolConnection): Promise<void> {
    await this.updateStatus(bookingId, 'cancelled', connection)
  }

  /**
   * Get booking by confirmation code
   */
  async getByConfirmationCode(confirmationCode: string): Promise<any | null> {
    const [rows] = await mysqlPool.execute(
      'SELECT booking_id FROM bookings WHERE confirmation_code = ?',
      [confirmationCode]
    )

    if ((rows as any[]).length === 0) return null
    return this.getById((rows as any[])[0].booking_id)
  }

  /**
   * Get all bookings for admin
   */
  async getAll(filters?: {
    status?: string;
    type?: string;
    limit?: number;
  }): Promise<any[]> {
    let query = 'SELECT * FROM bookings WHERE 1=1'
    const params: any[] = []

    if (filters?.status) {
      query += ' AND status = ?'
      params.push(filters.status)
    }

    if (filters?.type) {
      query += ' AND booking_type = ?'
      params.push(filters.type)
    }

    query += ' ORDER BY booking_date DESC'

    if (filters?.limit) {
      query += ' LIMIT ?'
      params.push(filters.limit)
    }

    const [rows] = await mysqlPool.execute(query, params)
    return (rows as any[]).map(row => this.mapRowToBooking(row))
  }

  private mapRowToBooking(row: any): any {
    return {
      bookingId: row.booking_id,
      userId: row.user_id,
      bookingType: row.booking_type,
      bookingReference: row.booking_reference,
      confirmationCode: row.confirmation_code,
      status: row.status,
      bookingDate: row.booking_date,
      startDate: row.start_date,
      endDate: row.end_date,
      guests: row.guests,
      totalAmount: parseFloat(row.total_amount),
      specialRequests: row.special_requests,
      listingName: row.listing_name,
      listingLocation: row.listing_location,
      passengers: row.passengers || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}


