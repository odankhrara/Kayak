import { PoolConnection } from 'mysql2/promise'
import mysqlPool from '@kayak/common/src/db/mysqlPool'
import { Booking } from '../models/Booking'

export class BookingRepository {
  async create(booking: Omit<Booking, 'bookingId' | 'createdAt' | 'updatedAt'>, connection?: PoolConnection): Promise<Booking> {
    const pool = connection || mysqlPool
    const [result] = await pool.execute(
      `INSERT INTO bookings (user_id, booking_type, booking_ref, status, check_in_date, check_out_date, booking_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [booking.userId, booking.bookingType, booking.bookingRef, booking.status, booking.checkInDate, booking.checkOutDate, booking.bookingDate]
    )
    const insertId = (result as any).insertId
    return this.getById(insertId.toString())
  }

  async getById(bookingId: string): Promise<Booking> {
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM bookings WHERE booking_id = ?',
      [bookingId]
    )
    const bookings = rows as any[]
    return this.mapRowToBooking(bookings[0])
  }

  async getByUserId(userId: string): Promise<Booking[]> {
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM bookings WHERE user_id = ? ORDER BY booking_date DESC',
      [userId]
    )
    return (rows as any[]).map(row => this.mapRowToBooking(row))
  }

  private mapRowToBooking(row: any): Booking {
    return {
      bookingId: row.booking_id.toString(),
      userId: row.user_id.toString(),
      bookingType: row.booking_type,
      bookingRef: row.booking_ref,
      status: row.status,
      checkInDate: row.check_in_date,
      checkOutDate: row.check_out_date,
      bookingDate: row.booking_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

