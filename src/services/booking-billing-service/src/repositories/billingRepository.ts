import { PoolConnection } from 'mysql2/promise'
import mysqlPool from '@kayak/common/src/db/mysqlPool'
import { Billing } from '../models/Billing'

export class BillingRepository {
  /**
   * Create a billing record (payment transaction)
   * Must be called within a transaction with booking creation
   */
  async create(billingData: {
    billing_id: string;
    user_id: string;
    booking_id: string;
    booking_type: 'flight' | 'hotel' | 'car';
    transaction_id: string;
    amount: number;
    tax: number;
    total_amount: number;
    payment_method: 'credit_card' | 'debit_card' | 'paypal' | 'apple_pay';
    transaction_status: 'pending' | 'completed' | 'failed' | 'refunded';
    invoice_id?: string;
  }, connection?: PoolConnection): Promise<any> {
    const conn = connection || mysqlPool

    await conn.execute(
      `INSERT INTO billing (
        billing_id, user_id, booking_id, booking_type, transaction_id,
        amount, tax, total_amount, payment_method, transaction_status, invoice_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        billingData.billing_id,
        billingData.user_id,
        billingData.booking_id,
        billingData.booking_type,
        billingData.transaction_id,
        billingData.amount,
        billingData.tax,
        billingData.total_amount,
        billingData.payment_method,
        billingData.transaction_status,
        billingData.invoice_id || null
      ]
    )

    return this.getById(billingData.billing_id, connection)
  }

  /**
   * Get billing by ID
   */
  async getById(billingId: string, connection?: PoolConnection): Promise<any | null> {
    const conn = connection || mysqlPool
    
    const [rows] = await conn.execute(
      `SELECT b.*, u.email as user_email, u.first_name, u.last_name
       FROM billing b
       LEFT JOIN users u ON b.user_id = u.user_id
       WHERE b.billing_id = ?`,
      [billingId]
    )

    if ((rows as any[]).length === 0) return null
    return this.mapRowToBilling((rows as any[])[0])
  }

  /**
   * Get billing by booking ID
   */
  async getByBookingId(bookingId: string): Promise<any | null> {
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM billing WHERE booking_id = ?',
      [bookingId]
    )

    if ((rows as any[]).length === 0) return null
    return this.mapRowToBilling((rows as any[])[0])
  }

  /**
   * Get all billings for a user
   */
  async getByUserId(userId: string): Promise<any[]> {
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM billing WHERE user_id = ? ORDER BY transaction_date DESC',
      [userId]
    )

    return (rows as any[]).map(row => this.mapRowToBilling(row))
  }

  /**
   * Update billing/transaction status
   */
  async updateStatus(billingId: string, status: 'pending' | 'completed' | 'failed' | 'refunded', connection?: PoolConnection): Promise<void> {
    const conn = connection || mysqlPool

    await conn.execute(
      'UPDATE billing SET transaction_status = ? WHERE billing_id = ?',
      [status, billingId]
    )
  }

  /**
   * Search billings (Admin only)
   */
  async search(filters: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    month?: string; // Format: YYYY-MM
    minAmount?: number;
    maxAmount?: number;
    status?: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentMethod?: string;
    bookingType?: 'flight' | 'hotel' | 'car';
    limit?: number;
  }): Promise<any[]> {
    let query = `
      SELECT b.*, u.email as user_email, u.first_name, u.last_name
      FROM billing b
      LEFT JOIN users u ON b.user_id = u.user_id
      WHERE 1=1
    `
    const params: any[] = []

    // User filter
    if (filters.userId) {
      query += ' AND b.user_id = ?'
      params.push(filters.userId)
    }

    // Date range filters
    if (filters.startDate) {
      query += ' AND DATE(b.transaction_date) >= ?'
      params.push(filters.startDate)
    }
    if (filters.endDate) {
      query += ' AND DATE(b.transaction_date) <= ?'
      params.push(filters.endDate)
    }

    // Month filter
    if (filters.month) {
      query += ' AND DATE_FORMAT(b.transaction_date, "%Y-%m") = ?'
      params.push(filters.month)
    }

    // Amount range filters
    if (filters.minAmount) {
      query += ' AND b.total_amount >= ?'
      params.push(filters.minAmount)
    }
    if (filters.maxAmount) {
      query += ' AND b.total_amount <= ?'
      params.push(filters.maxAmount)
    }

    // Status filter
    if (filters.status) {
      query += ' AND b.transaction_status = ?'
      params.push(filters.status)
    }

    // Payment method filter
    if (filters.paymentMethod) {
      query += ' AND b.payment_method = ?'
      params.push(filters.paymentMethod)
    }

    // Booking type filter
    if (filters.bookingType) {
      query += ' AND b.booking_type = ?'
      params.push(filters.bookingType)
    }

    query += ' ORDER BY b.transaction_date DESC'

    // Limit
    if (filters.limit) {
      query += ' LIMIT ?'
      params.push(filters.limit)
    }

    const [rows] = await mysqlPool.execute(query, params)
    return (rows as any[]).map(row => this.mapRowToBilling(row))
  }

  /**
   * Get revenue analytics (Admin)
   */
  async getRevenueByPeriod(startDate: string, endDate: string): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    byType: any[];
    byStatus: any[];
  }> {
    // Total revenue and count
    const [totals] = await mysqlPool.execute(
      `SELECT 
         COUNT(*) as total_transactions,
         SUM(total_amount) as total_revenue
       FROM billing
       WHERE DATE(transaction_date) BETWEEN ? AND ?`,
      [startDate, endDate]
    ) as any[]

    // Revenue by booking type
    const [byType] = await mysqlPool.execute(
      `SELECT 
         booking_type,
         COUNT(*) as count,
         SUM(total_amount) as revenue
       FROM billing
       WHERE DATE(transaction_date) BETWEEN ? AND ?
       GROUP BY booking_type`,
      [startDate, endDate]
    ) as any[]

    // Revenue by status
    const [byStatus] = await mysqlPool.execute(
      `SELECT 
         transaction_status as status,
         COUNT(*) as count,
         SUM(total_amount) as revenue
       FROM billing
       WHERE DATE(transaction_date) BETWEEN ? AND ?
       GROUP BY transaction_status`,
      [startDate, endDate]
    ) as any[]

    return {
      totalRevenue: parseFloat(totals[0]?.total_revenue || 0),
      totalTransactions: parseInt(totals[0]?.total_transactions || 0),
      byType: byType.map((row: any) => ({
        type: row.booking_type,
        count: row.count,
        revenue: parseFloat(row.revenue)
      })),
      byStatus: byStatus.map((row: any) => ({
        status: row.status,
        count: row.count,
        revenue: parseFloat(row.revenue)
      }))
    }
  }

  /**
   * Get top revenue generating properties (Admin)
   */
  async getTopPropertiesByRevenue(year: number, limit: number = 10): Promise<any[]> {
    const [rows] = await mysqlPool.execute(
      `SELECT 
         b.booking_type,
         b.booking_id,
         CASE 
           WHEN b.booking_type = 'flight' THEN f.airline_name
           WHEN b.booking_type = 'hotel' THEN h.hotel_name
           WHEN b.booking_type = 'car' THEN CONCAT(c.company_name, ' - ', c.model)
         END as property_name,
         COUNT(*) as total_bookings,
         SUM(bi.total_amount) as total_revenue
       FROM bookings b
       INNER JOIN billing bi ON b.booking_id = bi.booking_id
       LEFT JOIN flights f ON b.booking_type = 'flight' AND b.booking_reference = f.flight_id
       LEFT JOIN hotels h ON b.booking_type = 'hotel' AND b.booking_reference = h.hotel_id
       LEFT JOIN cars c ON b.booking_type = 'car' AND b.booking_reference = c.car_id
       WHERE YEAR(bi.transaction_date) = ? AND bi.transaction_status = 'completed'
       GROUP BY b.booking_type, b.booking_id, property_name
       ORDER BY total_revenue DESC
       LIMIT ?`,
      [year, limit]
    )

    return (rows as any[]).map((row, index) => ({
      rank: index + 1,
      type: row.booking_type,
      name: row.property_name,
      bookings: row.total_bookings,
      revenue: parseFloat(row.total_revenue)
    }))
  }

  /**
   * Get city-wise revenue (Admin)
   */
  async getCityWiseRevenue(year: number): Promise<any[]> {
    const [rows] = await mysqlPool.execute(
      `SELECT 
         CASE 
           WHEN b.booking_type = 'hotel' THEN h.city
           WHEN b.booking_type = 'car' THEN SUBSTRING_INDEX(c.location, ',', 1)
           ELSE 'N/A'
         END as city,
         COUNT(*) as total_bookings,
         SUM(bi.total_amount) as total_revenue
       FROM bookings b
       INNER JOIN billing bi ON b.booking_id = bi.booking_id
       LEFT JOIN hotels h ON b.booking_type = 'hotel' AND b.booking_reference = h.hotel_id
       LEFT JOIN cars c ON b.booking_type = 'car' AND b.booking_reference = c.car_id
       WHERE YEAR(bi.transaction_date) = ? 
         AND bi.transaction_status = 'completed'
         AND b.booking_type IN ('hotel', 'car')
       GROUP BY city
       ORDER BY total_revenue DESC`,
      [year]
    )

    return (rows as any[]).map(row => ({
      city: row.city,
      bookings: row.total_bookings,
      revenue: parseFloat(row.total_revenue)
    }))
  }

  /**
   * Get all billings for admin
   */
  async getAll(limit: number = 100): Promise<any[]> {
    const [rows] = await mysqlPool.execute(
      `SELECT b.*, u.email as user_email 
       FROM billing b
       LEFT JOIN users u ON b.user_id = u.user_id
       ORDER BY b.transaction_date DESC 
       LIMIT ?`,
      [limit]
    )

    return (rows as any[]).map(row => this.mapRowToBilling(row))
  }

  private mapRowToBilling(row: any): any {
    return {
      billingId: row.billing_id,
      userId: row.user_id,
      bookingId: row.booking_id,
      bookingType: row.booking_type,
      transactionId: row.transaction_id,
      amount: parseFloat(row.amount),
      tax: parseFloat(row.tax),
      totalAmount: parseFloat(row.total_amount),
      paymentMethod: row.payment_method,
      transactionStatus: row.transaction_status,
      transactionDate: row.transaction_date,
      invoiceId: row.invoice_id,
      userEmail: row.user_email,
      firstName: row.first_name,
      lastName: row.last_name
    }
  }
}


