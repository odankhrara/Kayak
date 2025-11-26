import { BookingRepository } from '../repositories/bookingRepository'
import { Booking } from '../models/Booking'
import mysqlPool from '@kayak/common/src/db/mysqlPool'

export class BookingService {
  private repository = new BookingRepository()

  async createBooking(bookingData: Omit<Booking, 'bookingId' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
    const connection = await mysqlPool.getConnection()
    try {
      await connection.beginTransaction()
      
      const booking = await this.repository.create(bookingData, connection)
      
      await connection.commit()
      return booking
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return this.repository.getByUserId(userId)
  }

  async getById(bookingId: string): Promise<Booking | null> {
    return this.repository.getById(bookingId)
  }
}

