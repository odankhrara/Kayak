import api from './api'

export interface Review {
  reviewId: number
  userId: string
  itemType: 'flight' | 'hotel' | 'car'
  itemId: string
  bookingId?: number
  rating: number
  title?: string
  comment?: string
  helpfulCount: number
  createdAt: string
  updatedAt: string
  status: string
  userName?: string
  userCity?: string
  userState?: string
}

export interface ReviewStats {
  avgRating: number
  reviewCount: number
  distribution: Record<number, number>
}

export interface CreateReviewInput {
  userId: string
  itemType: 'flight' | 'hotel' | 'car'
  itemId: string
  bookingId?: number
  rating: number
  title?: string
  comment?: string
}

export const reviewService = {
  /**
   * Create a new review
   */
  async createReview(input: CreateReviewInput): Promise<Review> {
    const response = await api.post('/api/listings/reviews', input)
    return response.data
  },

  /**
   * Get reviews for an item (flight, hotel, car)
   */
  async getReviewsForItem(itemType: string, itemId: string): Promise<{ reviews: Review[]; stats: ReviewStats }> {
    const response = await api.get(`/api/listings/reviews/item/${itemType}/${itemId}`)
    return response.data
  },

  /**
   * Get reviews by user
   */
  async getReviewsByUser(userId: string): Promise<Review[]> {
    const response = await api.get(`/api/listings/reviews/user/${userId}`)
    return response.data
  },

  /**
   * Get review statistics (for analytics dashboard)
   */
  async getReviewStats(): Promise<{
    totalReviews: number
    avgRating: number
    reviewsByType: Record<string, number>
    ratingDistribution: Record<number, number>
  }> {
    const response = await api.get('/api/listings/reviews/stats')
    return response.data
  },

  /**
   * Get all reviews (for admin)
   */
  async getAllReviews(limit = 100, offset = 0): Promise<Review[]> {
    const response = await api.get(`/api/listings/reviews/all?limit=${limit}&offset=${offset}`)
    return response.data
  },

  /**
   * Mark a review as helpful
   */
  async markHelpful(reviewId: number): Promise<void> {
    await api.post(`/api/listings/reviews/${reviewId}/helpful`)
  },

  /**
   * Delete a review
   */
  async deleteReview(reviewId: number, userId: string): Promise<void> {
    await api.delete(`/api/listings/reviews/${reviewId}`, { data: { userId } })
  }
}

