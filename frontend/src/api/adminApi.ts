import axios from 'axios'
import api from '../services/api'

// Use environment variables for portability across different systems
// Default to localhost for local development
const ADMIN_SERVICE_URL = import.meta.env.VITE_ADMIN_SERVICE_URL || 'http://localhost:8006'
const ANALYTICS_SERVICE_URL = import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'http://localhost:8004'

const API_BASE_URL = `${ADMIN_SERVICE_URL}/api/admin`
const HOST_ANALYSIS_API_BASE_URL = `${ANALYTICS_SERVICE_URL}/api/admin`

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
    const response = await api.get(`${API_BASE_URL}/revenue`)
    return response.data
  },

  getBookingStats: async (): Promise<BookingStats> => {
    const response = await api.get(`${API_BASE_URL}/bookings`)
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


  ///////////////////////////////////////////////////////////////

  // Host/Provider Analysis APIs
  getClicksPerPage: async (startDate?: string, endDate?: string, propertyType?: 'hotel' | 'flight' | 'car'): Promise<any[]> => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    if (propertyType) params.append('propertyType', propertyType)
    const response = await api.get(`${HOST_ANALYSIS_API_BASE_URL}/host/clicks-per-page?${params}`)
    return response.data
  },

  getPropertyClicks: async (startDate?: string, endDate?: string): Promise<any[]> => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    const response = await api.get(`${HOST_ANALYSIS_API_BASE_URL}/host/property-clicks?${params}`)
    return response.data
  },

  getLeastSeenAreas: async (startDate?: string, endDate?: string): Promise<any[]> => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    const response = await api.get(`${HOST_ANALYSIS_API_BASE_URL}/host/least-seen-areas?${params}`)
    return response.data
  },

  getPropertyReviews: async (propertyType?: 'hotel' | 'flight' | 'car'): Promise<any[]> => {
    const params = new URLSearchParams()
    if (propertyType) params.append('propertyType', propertyType)
    const response = await axios.get(`${HOST_ANALYSIS_API_BASE_URL}/host/property-reviews?${params}`)
    return response.data
  },

  getUserTrace: async (userId?: string, city?: string, state?: string): Promise<any[]> => {
    const params = new URLSearchParams()
    if (userId) params.append('userId', userId)
    if (city) params.append('city', city)
    if (state) params.append('state', state)
    const response = await api.get(`${HOST_ANALYSIS_API_BASE_URL}/host/user-trace?${params}`)
    return response.data
  },

  getBiddingTrace: async (propertyId?: string): Promise<any[]> => {
    const params = new URLSearchParams()
    if (propertyId) params.append('propertyId', propertyId)
    const response = await api.get(`${HOST_ANALYSIS_API_BASE_URL}/host/bidding-trace?${params}`)
    return response.data
  },

  // ============================================
  // PROVIDER ANALYTICS APIs (Phase 1)
  // ============================================

  // Get all providers summary
  getProvidersSummary: async (year?: number): Promise<any> => {
    const params = new URLSearchParams()
    if (year) params.append('year', year.toString())
    const response = await api.get(`${HOST_ANALYSIS_API_BASE_URL}/providers/summary?${params}`)
    return response.data
  },

  // Get top airlines by revenue
  getTopAirlines: async (year?: number, limit?: number): Promise<any[]> => {
    const params = new URLSearchParams()
    if (year) params.append('year', year.toString())
    if (limit) params.append('limit', limit.toString())
    const response = await api.get(`${HOST_ANALYSIS_API_BASE_URL}/providers/airlines?${params}`)
    return response.data
  },

  // Get top hotels by bookings
  getTopHotels: async (year?: number, limit?: number): Promise<any[]> => {
    const params = new URLSearchParams()
    if (year) params.append('year', year.toString())
    if (limit) params.append('limit', limit.toString())
    const response = await api.get(`${HOST_ANALYSIS_API_BASE_URL}/providers/hotels?${params}`)
    return response.data
  },

  // Get top car companies by rentals
  getTopCarCompanies: async (year?: number, limit?: number): Promise<any[]> => {
    const params = new URLSearchParams()
    if (year) params.append('year', year.toString())
    if (limit) params.append('limit', limit.toString())
    const response = await api.get(`${HOST_ANALYSIS_API_BASE_URL}/providers/cars?${params}`)
    return response.data
  },

  // Get provider revenue over time
  getProviderRevenueTimeline: async (
    type: 'airline' | 'hotel' | 'car',
    provider?: string,
    year?: number
  ): Promise<any[]> => {
    const params = new URLSearchParams()
    params.append('type', type)
    if (provider) params.append('provider', provider)
    if (year) params.append('year', year.toString())
    const response = await api.get(`${HOST_ANALYSIS_API_BASE_URL}/providers/revenue-timeline?${params}`)
    return response.data
  },

  // Get list of all providers
  getProvidersList: async (): Promise<any> => {
    const response = await api.get(`${HOST_ANALYSIS_API_BASE_URL}/providers/list`)
    return response.data
  },
}
