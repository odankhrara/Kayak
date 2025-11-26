import { FlightRepository } from '../repositories/flightRepository'
import { Flight } from '../models/Flight'

export class FlightService {
  private repository = new FlightRepository()

  async search(filters: any): Promise<Flight[]> {
    return this.repository.search(filters)
  }

  async getById(flightId: string): Promise<Flight | null> {
    return this.repository.getById(flightId)
  }
}

