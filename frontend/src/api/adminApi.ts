import axios from 'axios'

const API_BASE_URL = '/api/admin'

export interface RevenueStats {
  totalRevenue: number
  revenueByCity: { city: string; revenue: number }[]
  revenueByMonth: { month: string; revenue: number }[]
  topProperties: { name: string; revenue: number }[]
}

export interface BookingStats {
  totalBookings: number
  bookingsByStatus: { status: string; count: number }[]
  bookingsByType: { type: string; count: number }[]
}

export const adminApi = {
  getRevenueStats: async (): Promise<RevenueStats> => {
    const response = await axios.get(`${API_BASE_URL}/revenue`)
    return response.data
  },

  getBookingStats: async (): Promise<BookingStats> => {
    const response = await axios.get(`${API_BASE_URL}/bookings`)
    return response.data
  },

  getAllUsers: async (): Promise<any[]> => {
    const response = await axios.get(`${API_BASE_URL}/users`)
    return response.data
  },

  getAllBookings: async (): Promise<any[]> => {
    const response = await axios.get(`${API_BASE_URL}/bookings/all`)
    return response.data
  },
}

