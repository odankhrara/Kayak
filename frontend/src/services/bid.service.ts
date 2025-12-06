import api from './api'

export interface RoomSelectionData {
  roomType: string
  quantity: number
  pricePerNight: number
  maxGuests: number
}

export interface Bid {
  bidId: number
  userId: string
  itemType: 'flight' | 'hotel' | 'car'
  itemId: string
  originalPrice: number
  bidAmount: number
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'completed'
  notes?: string
  createdAt: string
  expiresAt: string
  respondedAt?: string
  bookingId?: number
  userName?: string
  itemName?: string
  discountPercent?: number
  roomSelections?: RoomSelectionData[]
  nights?: number
}

export interface CreateBidInput {
  userId: string
  itemType: 'flight' | 'hotel' | 'car'
  itemId: string
  originalPrice: number
  bidAmount: number
  notes?: string
  roomSelections?: RoomSelectionData[]
  nights?: number
}

export interface BidStats {
  totalBids: number
  pendingBids: number
  acceptedBids: number
  rejectedBids: number
  completedBids: number
  acceptanceRate: number
  avgDiscount: number
  totalSavings: number
  bidsByType: Record<string, number>
}

export const bidService = {
  /**
   * Create a new bid (Name Your Own Price)
   */
  async createBid(input: CreateBidInput): Promise<Bid> {
    const response = await api.post('/api/listings/bids', input)
    return response.data
  },

  /**
   * Get current user's bids
   */
  async getMyBids(userId: string): Promise<Bid[]> {
    const response = await api.get(`/api/listings/bids/my-bids?userId=${userId}`)
    return response.data
  },

  /**
   * Get a single bid by ID
   */
  async getBidById(bidId: number): Promise<Bid> {
    const response = await api.get(`/api/listings/bids/${bidId}`)
    return response.data
  },

  /**
   * Get bids for an item
   */
  async getBidsForItem(itemType: string, itemId: string): Promise<Bid[]> {
    const response = await api.get(`/api/listings/bids/item/${itemType}/${itemId}`)
    return response.data
  },

  /**
   * Get bid statistics (for analytics dashboard)
   */
  async getBidStats(): Promise<BidStats> {
    const response = await api.get('/api/listings/bids/stats')
    return response.data
  },

  /**
   * Get recent bids (for dashboard)
   */
  async getRecentBids(limit = 10): Promise<Bid[]> {
    const response = await api.get(`/api/listings/bids/recent?limit=${limit}`)
    return response.data
  },

  /**
   * Mark bid as completed after booking
   */
  async completeBid(bidId: number, bookingId: number): Promise<void> {
    await api.put(`/api/listings/bids/${bidId}/complete`, { bookingId })
  },

  /**
   * Get user's accepted bids that can be completed (not expired)
   */
  async getCompletableBids(userId: string): Promise<Bid[]> {
    const response = await api.get(`/api/listings/bids/completable?userId=${userId}`)
    return response.data
  },

  /**
   * Validate if a bid can be completed
   */
  async validateBidForCompletion(bidId: number, userId: string): Promise<{ valid: boolean; bid?: Bid; error?: string }> {
    const response = await api.get(`/api/listings/bids/${bidId}/validate?userId=${userId}`)
    return response.data
  }
}

