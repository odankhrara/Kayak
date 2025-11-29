import axios from 'axios'

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8005'
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

  createWatch: async (watch: Omit<Watch, 'id'>, userId: number): Promise<Watch> => {
    const response = await axios.post(`${AI_SERVICE_URL}/watches`, watch, {
      params: { user_id: userId }
    })
    return response.data
  },

  getUserWatches: async (userId: number): Promise<Watch[]> => {
    const response = await axios.get(`${API_BASE_URL}/watches/user/${userId}`)
    return response.data
  },

  deleteWatch: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/watches/${id}`)
  },

  // Query bundles using natural language
  queryBundles: async (query: string, userId?: number): Promise<Bundle[]> => {
    const response = await axios.post(`${AI_SERVICE_URL}/bundles/query`, null, {
      params: { query, user_id: userId }
    })
    return response.data
  },

  // Chat message endpoint
  sendChatMessage: async (message: string, userId?: number, sessionId?: string): Promise<any> => {
    const response = await axios.post(`${AI_SERVICE_URL}/chat/message`, {
      message,
      user_id: userId,
      session_id: sessionId
    })
    return response.data
  },

  // WebSocket connection for real-time updates
  connectWebSocket: (userId: number, url?: string): WebSocket => {
    const wsUrl = url || `${AI_SERVICE_URL.replace('http', 'ws')}/events/${userId}`
    return new WebSocket(wsUrl)
  },

  // WebSocket connection for chat
  connectChatWebSocket: (userId: number, url?: string): WebSocket => {
    const wsUrl = url || `${AI_SERVICE_URL.replace('http', 'ws')}/chat/ws/${userId}`
    return new WebSocket(wsUrl)
  },
}

