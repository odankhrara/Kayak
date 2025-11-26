import axios from 'axios'

const API_BASE_URL = '/api/listings'

export interface Flight {
  id?: number
  airline: string
  flightNumber: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  price: number
  availableSeats: number
  aircraftType?: string
}

export interface Hotel {
  id?: number
  name: string
  city: string
  state?: string
  country: string
  address: string
  pricePerNight: number
  rating?: number
  amenities?: string[]
  availableRooms?: number
  checkIn?: string
  checkOut?: string
}

export interface Car {
  id?: number
  make: string
  model: string
  year: number
  rentalCompany: string
  location: string
  pricePerDay: number
  available?: boolean
  features?: string[]
}

export interface SearchParams {
  origin?: string
  destination?: string
  departureDate?: string
  returnDate?: string
  passengers?: number
  city?: string
  checkIn?: string
  checkOut?: string
  guests?: number
  pickupLocation?: string
  pickupDate?: string
  returnDate?: string
}

export const listingApi = {
  // Flights
  searchFlights: async (params: SearchParams): Promise<Flight[]> => {
    const response = await axios.get(`${API_BASE_URL}/flights/search`, { params })
    return response.data
  },

  getFlight: async (id: number): Promise<Flight> => {
    const response = await axios.get(`${API_BASE_URL}/flights/${id}`)
    return response.data
  },

  createFlight: async (flight: Omit<Flight, 'id'>): Promise<Flight> => {
    const response = await axios.post(`${API_BASE_URL}/flights`, flight)
    return response.data
  },

  updateFlight: async (id: number, flight: Partial<Flight>): Promise<Flight> => {
    const response = await axios.put(`${API_BASE_URL}/flights/${id}`, flight)
    return response.data
  },

  deleteFlight: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/flights/${id}`)
  },

  // Hotels
  searchHotels: async (params: SearchParams): Promise<Hotel[]> => {
    const response = await axios.get(`${API_BASE_URL}/hotels/search`, { params })
    return response.data
  },

  getHotel: async (id: number): Promise<Hotel> => {
    const response = await axios.get(`${API_BASE_URL}/hotels/${id}`)
    return response.data
  },

  createHotel: async (hotel: Omit<Hotel, 'id'>): Promise<Hotel> => {
    const response = await axios.post(`${API_BASE_URL}/hotels`, hotel)
    return response.data
  },

  updateHotel: async (id: number, hotel: Partial<Hotel>): Promise<Hotel> => {
    const response = await axios.put(`${API_BASE_URL}/hotels/${id}`, hotel)
    return response.data
  },

  deleteHotel: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/hotels/${id}`)
  },

  // Cars
  searchCars: async (params: SearchParams): Promise<Car[]> => {
    const response = await axios.get(`${API_BASE_URL}/cars/search`, { params })
    return response.data
  },

  getCar: async (id: number): Promise<Car> => {
    const response = await axios.get(`${API_BASE_URL}/cars/${id}`)
    return response.data
  },

  createCar: async (car: Omit<Car, 'id'>): Promise<Car> => {
    const response = await axios.post(`${API_BASE_URL}/cars`, car)
    return response.data
  },

  updateCar: async (id: number, car: Partial<Car>): Promise<Car> => {
    const response = await axios.put(`${API_BASE_URL}/cars/${id}`, car)
    return response.data
  },

  deleteCar: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/cars/${id}`)
  },
}

