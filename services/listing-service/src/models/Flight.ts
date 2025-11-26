export interface Flight {
  flightId: string
  airline: string
  departureAirport: string
  arrivalAirport: string
  departureDate: Date
  arrivalDate: Date
  duration: number
  flightClass: 'Economy' | 'Business' | 'First'
  price: number
  totalSeats: number
  availableSeats: number
  rating?: number
  createdAt: Date
  updatedAt: Date
}

