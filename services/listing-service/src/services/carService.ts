import { CarRepository } from '../repositories/carRepository'
import { Car } from '../models/Car'

export class CarService {
  private repository = new CarRepository()

  async search(filters: any): Promise<Car[]> {
    return this.repository.search(filters)
  }

  async getById(carId: string): Promise<Car | null> {
    return this.repository.getById(carId)
  }
}

