import mysqlPool from '@kayak/common/src/db/mysqlPool'
import { Flight } from '../models/Flight'

export class FlightRepository {
  async search(filters: any): Promise<Flight[]> {
    let query = 'SELECT * FROM flights WHERE 1=1'
    const params: any[] = []

    if (filters.departureAirport) {
      query += ' AND departure_airport = ?'
      params.push(filters.departureAirport)
    }
    if (filters.arrivalAirport) {
      query += ' AND arrival_airport = ?'
      params.push(filters.arrivalAirport)
    }
    if (filters.minPrice) {
      query += ' AND price >= ?'
      params.push(filters.minPrice)
    }
    if (filters.maxPrice) {
      query += ' AND price <= ?'
      params.push(filters.maxPrice)
    }

    const [rows] = await mysqlPool.execute(query, params)
    return (rows as any[]).map(row => this.mapRowToFlight(row))
  }

  async getById(flightId: string): Promise<Flight | null> {
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM flights WHERE flight_id = ?',
      [flightId]
    )
    const flights = rows as any[]
    if (flights.length === 0) return null
    return this.mapRowToFlight(flights[0])
  }

  private mapRowToFlight(row: any): Flight {
    return {
      flightId: row.flight_id,
      airline: row.airline,
      departureAirport: row.departure_airport,
      arrivalAirport: row.arrival_airport,
      departureDate: row.departure_date,
      arrivalDate: row.arrival_date,
      duration: row.duration,
      flightClass: row.flight_class,
      price: row.price,
      totalSeats: row.total_seats,
      availableSeats: row.available_seats,
      rating: row.rating,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

