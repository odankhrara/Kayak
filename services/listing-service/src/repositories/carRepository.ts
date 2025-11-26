import mysqlPool from '@kayak/common/src/db/mysqlPool'
import { Car } from '../models/Car'

export class CarRepository {
  async search(filters: any): Promise<Car[]> {
    let query = 'SELECT * FROM cars WHERE availability_status = true'
    const params: any[] = []

    if (filters.carType) {
      query += ' AND car_type = ?'
      params.push(filters.carType)
    }
    if (filters.minPrice) {
      query += ' AND daily_price >= ?'
      params.push(filters.minPrice)
    }
    if (filters.maxPrice) {
      query += ' AND daily_price <= ?'
      params.push(filters.maxPrice)
    }

    const [rows] = await mysqlPool.execute(query, params)
    return (rows as any[]).map(row => this.mapRowToCar(row))
  }

  async getById(carId: string): Promise<Car | null> {
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM cars WHERE car_id = ?',
      [carId]
    )
    const cars = rows as any[]
    if (cars.length === 0) return null
    return this.mapRowToCar(cars[0])
  }

  private mapRowToCar(row: any): Car {
    return {
      carId: row.car_id,
      carType: row.car_type,
      companyProvider: row.company_provider,
      model: row.model,
      year: row.year,
      transmissionType: row.transmission_type,
      numberOfSeats: row.number_of_seats,
      dailyPrice: row.daily_price,
      rating: row.rating,
      availabilityStatus: row.availability_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

