import axios from 'axios'

const API_BASE_URL = '/api/billing'

export interface Billing {
  id?: number
  bookingId: number
  userId: number
  amount: number
  currency: string
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer'
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded'
  transactionId?: string
  billingDate: string
  cardLast4?: string
  cardBrand?: string
}

export interface PaymentRequest {
  bookingId: number
  amount: number
  paymentMethod: Billing['paymentMethod']
  cardNumber?: string
  cardExpiry?: string
  cardCvv?: string
  cardholderName?: string
}

export const billingApi = {
  createPayment: async (payment: PaymentRequest): Promise<Billing> => {
    const response = await axios.post(`${API_BASE_URL}/pay`, payment)
    return response.data
  },

  getBilling: async (id: number): Promise<Billing> => {
    const response = await axios.get(`${API_BASE_URL}/${id}`)
    return response.data
  },

  getUserBillings: async (userId: number): Promise<Billing[]> => {
    const response = await axios.get(`${API_BASE_URL}/user/${userId}`)
    return response.data
  },

  getBookingBilling: async (bookingId: number): Promise<Billing> => {
    const response = await axios.get(`${API_BASE_URL}/booking/${bookingId}`)
    return response.data
  },

  refundPayment: async (id: number): Promise<Billing> => {
    const response = await axios.post(`${API_BASE_URL}/${id}/refund`)
    return response.data
  },
}

