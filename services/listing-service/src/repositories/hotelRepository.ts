import mysqlPool from '@kayak/common/src/db/mysqlPool'
import { Hotel } from '../models/Hotel'

export class HotelRepository {
  async search(filters: any): Promise<Hotel[]> {
    let query = 'SELECT * FROM hotels WHERE 1=1'
    const params: any[] = []

    if (filters.city) {
      query += ' AND city = ?'
      params.push(filters.city)
    }
    if (filters.minStars) {
      query += ' AND star_rating >= ?'
      params.push(filters.minStars)
    }
    if (filters.maxStars) {
      query += ' AND star_rating <= ?'
      params.push(filters.maxStars)
    }
    if (filters.minPrice) {
      query += ' AND price_per_night >= ?'
      params.push(filters.minPrice)
    }
    if (filters.maxPrice) {
      query += ' AND price_per_night <= ?'
      params.push(filters.maxPrice)
    }

    const [rows] = await mysqlPool.execute(query, params)
    return (rows as any[]).map(row => this.mapRowToHotel(row))
  }

  async getById(hotelId: string): Promise<Hotel | null> {
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM hotels WHERE hotel_id = ?',
      [hotelId]
    )
    const hotels = rows as any[]
    if (hotels.length === 0) return null
    return this.mapRowToHotel(hotels[0])
  }

  private mapRowToHotel(row: any): Hotel {
    return {
      hotelId: row.hotel_id,
      name: row.name,
      address: row.address,
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      starRating: row.star_rating,
      numberOfRooms: row.number_of_rooms,
      roomTypes: JSON.parse(row.room_types || '[]'),
      pricePerNight: row.price_per_night,
      amenities: JSON.parse(row.amenities || '[]'),
      rating: row.rating,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

