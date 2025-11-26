import axios from 'axios'

const API_BASE_URL = '/api/bookings'

export interface Booking {
  id?: number
  userId: number
  listingType: 'flight' | 'hotel' | 'car'
  listingId: number
  bookingDate: string
  checkInDate?: string
  checkOutDate?: string
  passengers?: number
  guests?: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
}

export const bookingApi = {
  createBooking: async (booking: Omit<Booking, 'id' | 'bookingDate'>): Promise<Booking> => {
    const response = await axios.post(API_BASE_URL, booking)
    return response.data
  },

  getBooking: async (id: number): Promise<Booking> => {
    const response = await axios.get(`${API_BASE_URL}/${id}`)
    return response.data
  },

  getUserBookings: async (userId: number): Promise<Booking[]> => {
    const response = await axios.get(`${API_BASE_URL}/user/${userId}`)
    return response.data
  },

  updateBooking: async (id: number, booking: Partial<Booking>): Promise<Booking> => {
    const response = await axios.put(`${API_BASE_URL}/${id}`, booking)
    return response.data
  },

  cancelBooking: async (id: number): Promise<Booking> => {
    const response = await axios.put(`${API_BASE_URL}/${id}`, { status: 'cancelled' })
    return response.data
  },

  deleteBooking: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/${id}`)
  },
}

