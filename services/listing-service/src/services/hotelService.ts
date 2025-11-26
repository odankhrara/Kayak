import { HotelRepository } from '../repositories/hotelRepository'
import { Hotel } from '../models/Hotel'

export class HotelService {
  private repository = new HotelRepository()

  async search(filters: any): Promise<Hotel[]> {
    return this.repository.search(filters)
  }

  async getById(hotelId: string): Promise<Hotel | null> {
    return this.repository.getById(hotelId)
  }
}

