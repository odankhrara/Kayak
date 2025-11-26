import axios from 'axios'

const API_BASE_URL = '/api/users'

export interface User {
  id?: number
  email: string
  password?: string
  firstName: string
  lastName: string
  phone?: string
  dateOfBirth?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  role?: 'user' | 'admin'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export const userApi = {
  register: async (userData: Omit<User, 'id'>): Promise<User> => {
    const response = await axios.post(`${API_BASE_URL}/register`, userData)
    return response.data
  },

  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await axios.post(`${API_BASE_URL}/login`, credentials)
    return response.data
  },

  getUser: async (id: number): Promise<User> => {
    const response = await axios.get(`${API_BASE_URL}/${id}`)
    return response.data
  },

  updateUser: async (id: number, userData: Partial<User>): Promise<User> => {
    const response = await axios.put(`${API_BASE_URL}/${id}`, userData)
    return response.data
  },

  deleteUser: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/${id}`)
  },

  searchUsers: async (query: string): Promise<User[]> => {
    const response = await axios.get(`${API_BASE_URL}/search`, { params: { q: query } })
    return response.data
  },
}

