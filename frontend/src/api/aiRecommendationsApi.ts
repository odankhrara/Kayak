import axios from 'axios'

const API_BASE_URL = '/api/ai'

export interface Bundle {
  id?: number
  name: string
  description: string
  flights: any[]
  hotels: any[]
  cars?: any[]
  totalPrice: number
  savings: number
  tags: string[]
}

export interface Watch {
  id?: number
  userId: number
  origin?: string
  destination?: string
  city?: string
  maxPrice: number
  checkIn?: string
  checkOut?: string
  active: boolean
}

export const aiRecommendationsApi = {
  // HTTP endpoints
  getBundles: async (params?: { origin?: string; destination?: string; city?: string }): Promise<Bundle[]> => {
    const response = await axios.get(`${API_BASE_URL}/bundles`, { params })
    return response.data
  },

  getBundle: async (id: number): Promise<Bundle> => {
    const response = await axios.get(`${API_BASE_URL}/bundles/${id}`)
    return response.data
  },

  createWatch: async (watch: Omit<Watch, 'id'>): Promise<Watch> => {
    const response = await axios.post(`${API_BASE_URL}/watches`, watch)
    return response.data
  },

  getUserWatches: async (userId: number): Promise<Watch[]> => {
    const response = await axios.get(`${API_BASE_URL}/watches/user/${userId}`)
    return response.data
  },

  deleteWatch: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/watches/${id}`)
  },

  // WebSocket connection for real-time updates
  connectWebSocket: (url: string = 'ws://localhost:8005/events'): WebSocket => {
    return new WebSocket(url)
  },
}

