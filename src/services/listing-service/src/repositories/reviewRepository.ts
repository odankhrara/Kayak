import pool from '@kayak/common/src/db/mysqlPool'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

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
  createdAt: Date
  updatedAt: Date
  status: 'pending' | 'approved' | 'rejected'
}

export interface ReviewWithUser extends Review {
  userName: string
  userCity?: string
  userState?: string
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

class ReviewRepository {
  /**
   * Create a new review
   */
  async createReview(input: CreateReviewInput): Promise<Review> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO reviews (user_id, item_type, item_id, booking_id, rating, title, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [input.userId, input.itemType, input.itemId, input.bookingId || null, input.rating, input.title || null, input.comment || null]
    )

    const reviewId = result.insertId
    const review = await this.getReviewById(reviewId)
    if (!review) throw new Error('Failed to create review')
    return review
  }

  /**
   * Get a review by ID
   */
  async getReviewById(reviewId: number): Promise<Review | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM reviews WHERE review_id = ?',
      [reviewId]
    )
    return rows.length > 0 ? this.mapRowToReview(rows[0]) : null
  }

  /**
   * Get reviews for an item (flight, hotel, car)
   */
  async getReviewsByItem(itemType: string, itemId: string): Promise<ReviewWithUser[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.*, u.first_name, u.last_name, u.city, u.state
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.item_type = ? AND r.item_id = ? AND r.status = 'approved'
       ORDER BY r.created_at DESC`,
      [itemType, itemId]
    )
    return rows.map(this.mapRowToReviewWithUser)
  }

  /**
   * Get reviews by user
   */
  async getReviewsByUser(userId: string): Promise<Review[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM reviews WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    )
    return rows.map(this.mapRowToReview)
  }

  /**
   * Get average rating for an item
   */
  async getAverageRating(itemType: string, itemId: string): Promise<{ avgRating: number; reviewCount: number }> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
       FROM reviews
       WHERE item_type = ? AND item_id = ? AND status = 'approved'`,
      [itemType, itemId]
    )
    return {
      avgRating: rows[0]?.avg_rating ? parseFloat(rows[0].avg_rating) : 0,
      reviewCount: rows[0]?.review_count || 0
    }
  }

  /**
   * Get rating distribution for an item
   */
  async getRatingDistribution(itemType: string, itemId: string): Promise<Record<number, number>> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT rating, COUNT(*) as count
       FROM reviews
       WHERE item_type = ? AND item_id = ? AND status = 'approved'
       GROUP BY rating
       ORDER BY rating DESC`,
      [itemType, itemId]
    )
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    rows.forEach(row => {
      distribution[row.rating] = row.count
    })
    return distribution
  }

  /**
   * Update helpful count
   */
  async markHelpful(reviewId: number): Promise<void> {
    await pool.execute(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE review_id = ?',
      [reviewId]
    )
  }

  /**
   * Delete a review (by owner or admin)
   */
  async deleteReview(reviewId: number, userId: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM reviews WHERE review_id = ? AND user_id = ?',
      [reviewId, userId]
    )
    return result.affectedRows > 0
  }

  /**
   * Get all reviews (for admin dashboard)
   */
  async getAllReviews(limit = 100, offset = 0): Promise<ReviewWithUser[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.*, u.first_name, u.last_name, u.city, u.state
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )
    return rows.map(this.mapRowToReviewWithUser)
  }

  /**
   * Get review statistics (for analytics)
   */
  async getReviewStats(): Promise<{
    totalReviews: number
    avgRating: number
    reviewsByType: Record<string, number>
    ratingDistribution: Record<number, number>
  }> {
    // Total and average
    const [totalRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total, AVG(rating) as avg_rating FROM reviews WHERE status = 'approved'`
    )

    // By type
    const [typeRows] = await pool.query<RowDataPacket[]>(
      `SELECT item_type, COUNT(*) as count FROM reviews WHERE status = 'approved' GROUP BY item_type`
    )

    // Rating distribution
    const [ratingRows] = await pool.query<RowDataPacket[]>(
      `SELECT rating, COUNT(*) as count FROM reviews WHERE status = 'approved' GROUP BY rating`
    )

    const reviewsByType: Record<string, number> = {}
    typeRows.forEach(row => {
      reviewsByType[row.item_type] = row.count
    })

    const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    ratingRows.forEach(row => {
      ratingDistribution[row.rating] = row.count
    })

    return {
      totalReviews: totalRows[0]?.total || 0,
      avgRating: totalRows[0]?.avg_rating ? parseFloat(totalRows[0].avg_rating) : 0,
      reviewsByType,
      ratingDistribution
    }
  }

  private mapRowToReview(row: RowDataPacket): Review {
    return {
      reviewId: row.review_id,
      userId: row.user_id,
      itemType: row.item_type,
      itemId: row.item_id,
      bookingId: row.booking_id,
      rating: row.rating,
      title: row.title,
      comment: row.comment,
      helpfulCount: row.helpful_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status
    }
  }

  private mapRowToReviewWithUser(row: RowDataPacket): ReviewWithUser {
    return {
      reviewId: row.review_id,
      userId: row.user_id,
      itemType: row.item_type,
      itemId: row.item_id,
      bookingId: row.booking_id,
      rating: row.rating,
      title: row.title,
      comment: row.comment,
      helpfulCount: row.helpful_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status,
      userName: `${row.first_name} ${row.last_name}`,
      userCity: row.city,
      userState: row.state
    }
  }
}

export const reviewRepository = new ReviewRepository()

