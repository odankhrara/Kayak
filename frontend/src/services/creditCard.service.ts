import api from './api'

export interface CreditCard {
  cardId: number
  userId: string
  cardNumberLast4: string
  cardHolderName: string
  expiryMonth: number
  expiryYear: number
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover'
  isDefault: boolean
  createdAt: string
}

export interface AddCardInput {
  cardNumber: string
  cardHolderName: string
  expiryMonth: number
  expiryYear: number
  cvv: string
  cardType?: 'visa' | 'mastercard' | 'amex' | 'discover'
  isDefault?: boolean
}

export const creditCardService = {
  /**
   * Get all credit cards for a user
   */
  async getCards(userId: string): Promise<CreditCard[]> {
    const response = await api.get(`/api/users/${userId}/credit-cards`)
    return response.data.cards
  },

  /**
   * Add a new credit card
   */
  async addCard(userId: string, input: AddCardInput): Promise<CreditCard> {
    const response = await api.post(`/api/users/${userId}/credit-cards`, input)
    return response.data.card
  },

  /**
   * Delete a credit card
   */
  async deleteCard(userId: string, cardId: number): Promise<void> {
    await api.delete(`/api/users/${userId}/credit-cards/${cardId}`)
  },

  /**
   * Set a card as default
   */
  async setDefaultCard(userId: string, cardId: number): Promise<void> {
    await api.put(`/api/users/${userId}/credit-cards/${cardId}/default`)
  }
}

