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

  // Host/Provider Analysis APIs
  getClicksPerPage: async (startDate?: string, endDate?: string): Promise<any[]> => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    const response = await axios.get(`${API_BASE_URL}/host/clicks-per-page?${params}`)
    return response.data
  },

  getPropertyClicks: async (startDate?: string, endDate?: string): Promise<any[]> => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    const response = await axios.get(`${API_BASE_URL}/host/property-clicks?${params}`)
    return response.data
  },

  getLeastSeenAreas: async (startDate?: string, endDate?: string): Promise<any[]> => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    const response = await axios.get(`${API_BASE_URL}/host/least-seen-areas?${params}`)
    return response.data
  },

  getPropertyReviews: async (propertyType?: 'hotel' | 'flight' | 'car'): Promise<any[]> => {
    const params = new URLSearchParams()
    if (propertyType) params.append('propertyType', propertyType)
    const response = await axios.get(`${API_BASE_URL}/host/property-reviews?${params}`)
    return response.data
  },

  getUserTrace: async (userId?: string, city?: string, state?: string): Promise<any[]> => {
    const params = new URLSearchParams()
    if (userId) params.append('userId', userId)
    if (city) params.append('city', city)
    if (state) params.append('state', state)
    const response = await axios.get(`${API_BASE_URL}/host/user-trace?${params}`)
    return response.data
  },

  getBiddingTrace: async (propertyId?: string): Promise<any[]> => {
    const params = new URLSearchParams()
    if (propertyId) params.append('propertyId', propertyId)
    const response = await axios.get(`${API_BASE_URL}/host/bidding-trace?${params}`)
    return response.data
  },
}

