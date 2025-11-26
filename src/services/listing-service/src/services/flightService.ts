import { FlightRepository } from '../repositories/flightRepository'
import { Flight } from '../models/Flight'

export class FlightService {
  private repository = new FlightRepository()

  /**
   * Validate airport code format (3 letters)
   */
  private validateAirportCode(code: string, fieldName: string): void {
    const airportRegex = /^[A-Z]{3}$/
    if (!airportRegex.test(code.toUpperCase())) {
      throw new Error(`Invalid ${fieldName}. Must be a 3-letter IATA code (e.g., SFO, JFK, LAX)`)
    }
  }

  /**
   * Validate date is in the future
   */
  private validateFutureDate(date: string, fieldName: string): void {
    const inputDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (inputDate < today) {
      throw new Error(`${fieldName} must be in the future`)
    }
  }

  /**
   * Search flights with validation
   */
  async search(filters: {
    origin?: string;
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    passengers?: number;
    class?: 'economy' | 'business' | 'first';
    minPrice?: number;
    maxPrice?: number;
    airline?: string;
    departureTimeMin?: string;
    departureTimeMax?: string;
    minRating?: number;
    sortBy?: 'price' | 'duration' | 'rating' | 'departure_time';
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
  }): Promise<any[]> {
    try {
      // Validate required fields
      if (!filters.origin || !filters.destination) {
        throw new Error('Origin and destination airports are required')
      }

      // Validate airport codes
      this.validateAirportCode(filters.origin, 'Origin airport')
      this.validateAirportCode(filters.destination, 'Destination airport')

      // Check origin !== destination
      if (filters.origin.toUpperCase() === filters.destination.toUpperCase()) {
        throw new Error('Origin and destination airports must be different')
      }

      // Validate departure date if provided
      if (filters.departureDate) {
        this.validateFutureDate(filters.departureDate, 'Departure date')
      }

      // Validate return date if provided
      if (filters.returnDate && filters.departureDate) {
        const departure = new Date(filters.departureDate)
        const returnDate = new Date(filters.returnDate)
        if (returnDate < departure) {
          throw new Error('Return date must be after departure date')
        }
      }

      // Validate passenger count
      if (filters.passengers && filters.passengers < 1) {
        throw new Error('Number of passengers must be at least 1')
      }
      if (filters.passengers && filters.passengers > 9) {
        throw new Error('Cannot book more than 9 passengers per search')
      }

      // Validate price range
      if (filters.minPrice && filters.minPrice < 0) {
        throw new Error('Minimum price cannot be negative')
      }
      if (filters.maxPrice && filters.maxPrice < 0) {
        throw new Error('Maximum price cannot be negative')
      }
      if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
        throw new Error('Minimum price cannot be greater than maximum price')
      }

      // Validate rating
      if (filters.minRating && (filters.minRating < 0 || filters.minRating > 5)) {
        throw new Error('Rating must be between 0 and 5')
      }

      // Search flights
      const flights = await this.repository.search(filters)

      if (flights.length === 0) {
        return []
      }

      return flights
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Get flight by ID
   */
  async getById(flightId: string): Promise<any> {
    if (!flightId || flightId.trim().length === 0) {
      throw new Error('Flight ID is required')
    }

    const flight = await this.repository.getById(flightId.toUpperCase())
    if (!flight) {
      throw new Error(`Flight ${flightId} not found`)
    }

    return flight
  }

  /**
   * Create a new flight (Admin only)
   */
  async createFlight(flightData: {
    flight_id: string;
    airline_name: string;
    departure_airport: string;
    arrival_airport: string;
    departure_datetime: Date;
    arrival_datetime: Date;
    duration_minutes: number;
    flight_class: 'economy' | 'business' | 'first';
    price_per_ticket: number;
    total_seats: number;
  }): Promise<any> {
    try {
      // Validate flight ID format
      if (!flightData.flight_id || flightData.flight_id.trim().length === 0) {
        throw new Error('Flight ID is required')
      }

      // Validate airport codes
      this.validateAirportCode(flightData.departure_airport, 'Departure airport')
      this.validateAirportCode(flightData.arrival_airport, 'Arrival airport')

      if (flightData.departure_airport === flightData.arrival_airport) {
        throw new Error('Departure and arrival airports must be different')
      }

      // Validate dates
      const departure = new Date(flightData.departure_datetime)
      const arrival = new Date(flightData.arrival_datetime)
      const now = new Date()

      if (departure < now) {
        throw new Error('Departure time must be in the future')
      }
      if (arrival <= departure) {
        throw new Error('Arrival time must be after departure time')
      }

      // Validate duration
      if (flightData.duration_minutes < 30) {
        throw new Error('Flight duration must be at least 30 minutes')
      }

      // Validate price
      if (flightData.price_per_ticket <= 0) {
        throw new Error('Price must be greater than 0')
      }

      // Validate seats
      if (flightData.total_seats < 1) {
        throw new Error('Total seats must be at least 1')
      }

      // Create flight
      return await this.repository.create(flightData)
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Update flight (Admin only)
   */
  async updateFlight(flightId: string, updates: any): Promise<any> {
    // Check if flight exists
    const existingFlight = await this.repository.getById(flightId)
    if (!existingFlight) {
      throw new Error(`Flight ${flightId} not found`)
    }

    // Validate updates
    if (updates.departure_airport) {
      this.validateAirportCode(updates.departure_airport, 'Departure airport')
    }
    if (updates.arrival_airport) {
      this.validateAirportCode(updates.arrival_airport, 'Arrival airport')
    }
    if (updates.pricePerTicket && updates.pricePerTicket <= 0) {
      throw new Error('Price must be greater than 0')
    }
    if (updates.totalSeats && updates.totalSeats < 1) {
      throw new Error('Total seats must be at least 1')
    }

    return await this.repository.update(flightId, updates)
  }

  /**
   * Delete flight (Admin only)
   */
  async deleteFlight(flightId: string): Promise<void> {
    const flight = await this.repository.getById(flightId)
    if (!flight) {
      throw new Error(`Flight ${flightId} not found`)
    }

    await this.repository.delete(flightId)
  }

  /**
   * Check flight availability
   */
  async checkAvailability(flightId: string, passengers: number): Promise<{
    available: boolean;
    availableSeats: number;
    requestedSeats: number;
  }> {
    const flight = await this.repository.getById(flightId)
    if (!flight) {
      throw new Error(`Flight ${flightId} not found`)
    }

    return {
      available: flight.availableSeats >= passengers,
      availableSeats: flight.availableSeats,
      requestedSeats: passengers
    }
  }

  /**
   * Get all flights (Admin only)
   */
  async getAllFlights(limit: number = 100): Promise<any[]> {
    if (limit < 1 || limit > 1000) {
      throw new Error('Limit must be between 1 and 1000')
    }

    return await this.repository.getAll(limit)
  }
}

