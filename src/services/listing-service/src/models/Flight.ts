export interface Flight {
  flightId: string
  airlineName: string
  departureAirport: string
  arrivalAirport: string
  departureDatetime: Date
  arrivalDatetime: Date
  durationMinutes: number
  flightClass: 'Economy' | 'Business' | 'First'
  pricePerTicket: number
  totalSeats: number
  availableSeats: number
  rating?: number
  reviewsCount: number,
  status: 'scheduled'| 'cancelled'| 'delayed'| 'completed',
  createdAt: Date
  updatedAt: Date
}

