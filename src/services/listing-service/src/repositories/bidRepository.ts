import pool from '@kayak/common/src/db/mysqlPool'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export interface Bid {
  bidId: number
  userId: string
  itemType: 'flight' | 'hotel' | 'car'
  itemId: string
  originalPrice: number
  bidAmount: number
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'completed'
  notes?: string
  createdAt: Date
  expiresAt: Date
  respondedAt?: Date
  bookingId?: number
}

export interface BidWithDetails extends Bid {
  userName: string
  itemName?: string
  discountPercent: number
}

export interface CreateBidInput {
  userId: string
  itemType: 'flight' | 'hotel' | 'car'
  itemId: string
  originalPrice: number
  bidAmount: number
  notes?: string
  expiresInHours?: number
}

// Auto-accept threshold (bids at or above this % are auto-accepted)
const AUTO_ACCEPT_THRESHOLD = 85
// Maybe-accept threshold (bids between this and auto-accept have random chance)
const MAYBE_ACCEPT_THRESHOLD = 70

class BidRepository {
  /**
   * Create a new bid
   */
  async createBid(input: CreateBidInput): Promise<Bid> {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + (input.expiresInHours || 24))

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO bids (user_id, item_type, item_id, original_price, bid_amount, notes, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [input.userId, input.itemType, input.itemId, input.originalPrice, input.bidAmount, input.notes || null, expiresAt]
    )

    const bidId = result.insertId
    
    // Auto-process the bid
    await this.processBid(bidId)
    
    const bid = await this.getBidById(bidId)
    if (!bid) throw new Error('Failed to create bid')
    return bid
  }

  /**
   * Process bid - auto accept/reject based on business rules
   */
  async processBid(bidId: number): Promise<void> {
    const bid = await this.getBidById(bidId)
    if (!bid || bid.status !== 'pending') return

    const bidPercentage = (bid.bidAmount / bid.originalPrice) * 100
    let newStatus: 'accepted' | 'rejected' | 'pending' = 'pending'

    if (bidPercentage >= AUTO_ACCEPT_THRESHOLD) {
      // Auto-accept bids at 85%+ of listed price
      newStatus = 'accepted'
    } else if (bidPercentage >= MAYBE_ACCEPT_THRESHOLD) {
      // 50% chance to accept bids between 70-85%
      newStatus = Math.random() > 0.5 ? 'accepted' : 'rejected'
    } else {
      // Auto-reject bids below 70%
      newStatus = 'rejected'
    }

    await pool.execute(
      'UPDATE bids SET status = ?, responded_at = NOW() WHERE bid_id = ?',
      [newStatus, bidId]
    )
  }

  /**
   * Get a bid by ID
   */
  async getBidById(bidId: number): Promise<Bid | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM bids WHERE bid_id = ?',
      [bidId]
    )
    return rows.length > 0 ? this.mapRowToBid(rows[0]) : null
  }

  /**
   * Get bids by user
   */
  async getBidsByUser(userId: string): Promise<BidWithDetails[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT b.*, u.first_name, u.last_name,
        CASE 
          WHEN b.item_type = 'flight' THEN (SELECT CONCAT(airline_name, ' ', departure_airport, '->', arrival_airport) FROM flights WHERE flight_id = b.item_id)
          WHEN b.item_type = 'hotel' THEN (SELECT hotel_name FROM hotels WHERE hotel_id = b.item_id)
          WHEN b.item_type = 'car' THEN (SELECT CONCAT(company_name, ' ', model) FROM cars WHERE car_id = b.item_id)
        END as item_name
       FROM bids b
       JOIN users u ON b.user_id = u.user_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    )
    return rows.map(this.mapRowToBidWithDetails)
  }

  /**
   * Get bids for an item
   */
  async getBidsByItem(itemType: string, itemId: string): Promise<BidWithDetails[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT b.*, u.first_name, u.last_name
       FROM bids b
       JOIN users u ON b.user_id = u.user_id
       WHERE b.item_type = ? AND b.item_id = ?
       ORDER BY b.created_at DESC`,
      [itemType, itemId]
    )
    return rows.map(this.mapRowToBidWithDetails)
  }

  /**
   * Update bid status (for manual processing or completion)
   */
  async updateBidStatus(bidId: number, status: string, bookingId?: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE bids SET status = ?, responded_at = NOW(), booking_id = ?
       WHERE bid_id = ?`,
      [status, bookingId || null, bidId]
    )
    return result.affectedRows > 0
  }

  /**
   * Expire old pending bids
   */
  async expireOldBids(): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE bids SET status = 'expired', responded_at = NOW()
       WHERE status = 'pending' AND expires_at < NOW()`
    )
    return result.affectedRows
  }

  /**
   * Get bid statistics (for analytics)
   */
  async getBidStats(): Promise<{
    totalBids: number
    pendingBids: number
    acceptedBids: number
    rejectedBids: number
    completedBids: number
    acceptanceRate: number
    avgDiscount: number
    totalSavings: number
    bidsByType: Record<string, number>
  }> {
    // Overall stats
    const [statsRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        AVG(CASE WHEN status IN ('accepted', 'completed') THEN (original_price - bid_amount) / original_price * 100 ELSE NULL END) as avg_discount,
        SUM(CASE WHEN status = 'completed' THEN original_price - bid_amount ELSE 0 END) as total_savings
       FROM bids`
    )

    // By type
    const [typeRows] = await pool.query<RowDataPacket[]>(
      `SELECT item_type, COUNT(*) as count FROM bids GROUP BY item_type`
    )

    const stats = statsRows[0]
    const bidsByType: Record<string, number> = {}
    typeRows.forEach(row => {
      bidsByType[row.item_type] = row.count
    })

    const accepted = stats.accepted || 0
    const rejected = stats.rejected || 0
    const total = accepted + rejected

    return {
      totalBids: stats.total || 0,
      pendingBids: stats.pending || 0,
      acceptedBids: accepted,
      rejectedBids: rejected,
      completedBids: stats.completed || 0,
      acceptanceRate: total > 0 ? (accepted / total) * 100 : 0,
      avgDiscount: stats.avg_discount ? parseFloat(stats.avg_discount) : 0,
      totalSavings: stats.total_savings || 0,
      bidsByType
    }
  }

  /**
   * Get recent bid activity (for dashboard)
   */
  async getRecentBids(limit = 10): Promise<BidWithDetails[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT b.*, u.first_name, u.last_name,
        CASE 
          WHEN b.item_type = 'flight' THEN (SELECT CONCAT(airline_name, ' ', departure_airport, '->', arrival_airport) FROM flights WHERE flight_id = b.item_id)
          WHEN b.item_type = 'hotel' THEN (SELECT hotel_name FROM hotels WHERE hotel_id = b.item_id)
          WHEN b.item_type = 'car' THEN (SELECT CONCAT(company_name, ' ', model) FROM cars WHERE car_id = b.item_id)
        END as item_name
       FROM bids b
       JOIN users u ON b.user_id = u.user_id
       ORDER BY b.created_at DESC
       LIMIT ?`,
      [limit]
    )
    return rows.map(this.mapRowToBidWithDetails)
  }

  private mapRowToBid(row: RowDataPacket): Bid {
    return {
      bidId: row.bid_id,
      userId: row.user_id,
      itemType: row.item_type,
      itemId: row.item_id,
      originalPrice: parseFloat(row.original_price),
      bidAmount: parseFloat(row.bid_amount),
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      respondedAt: row.responded_at,
      bookingId: row.booking_id
    }
  }

  private mapRowToBidWithDetails(row: RowDataPacket): BidWithDetails {
    const originalPrice = parseFloat(row.original_price)
    const bidAmount = parseFloat(row.bid_amount)
    return {
      bidId: row.bid_id,
      userId: row.user_id,
      itemType: row.item_type,
      itemId: row.item_id,
      originalPrice,
      bidAmount,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      respondedAt: row.responded_at,
      bookingId: row.booking_id,
      userName: `${row.first_name} ${row.last_name}`,
      itemName: row.item_name,
      discountPercent: ((originalPrice - bidAmount) / originalPrice) * 100
    }
  }
}

export const bidRepository = new BidRepository()

