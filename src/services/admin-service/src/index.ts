import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { requireAdmin } from '@kayak/common/src/middleware/auth'
import { errorHandler } from '@kayak/common/src/middleware/errorHandler'
import mysqlPool from '@kayak/common/src/db/mysqlPool'

dotenv.config()

const PORT = parseInt(process.env.PORT || '8006', 10)

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'admin-service' })
})

// Revenue stats directly from MySQL (billing + bookings + listings)
app.get('/api/admin/revenue', requireAdmin, async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined
    const yearFilter = year ? 'YEAR(bill.transaction_date) = ?' : '1=1'
    const yearParams = year ? [year] : []

    // Total revenue
    const [totalRows] = await mysqlPool.execute(
      `SELECT COALESCE(SUM(bill.total_amount), 0) AS totalRevenue
       FROM billing bill
       WHERE bill.transaction_status IN ('completed', 'pending')
         AND ${yearFilter}`,
      yearParams
    )
    const totalRevenue = Number((totalRows as any)[0]?.totalRevenue || 0)

    // Revenue by city/location
    const [cityRows] = await mysqlPool.execute(
      `SELECT city, SUM(total_amount) AS revenue
       FROM (
         SELECT 
           bill.total_amount,
           COALESCE(
             CASE b.booking_type
               WHEN 'hotel' THEN h.city
               WHEN 'car' THEN c.location
               WHEN 'flight' THEN f.arrival_airport
             END,
             'Unknown'
           ) AS city
         FROM billing bill
         JOIN bookings b ON bill.booking_id = b.booking_id
         LEFT JOIN hotels h ON b.booking_type = 'hotel' AND b.booking_reference = h.hotel_id
         LEFT JOIN cars c ON b.booking_type = 'car' AND b.booking_reference = c.car_id
         LEFT JOIN flights f ON b.booking_type = 'flight' AND b.booking_reference = f.flight_id
         WHERE bill.transaction_status IN ('completed', 'pending')
           AND ${yearFilter}
       ) revenue_city
       GROUP BY city
       ORDER BY revenue DESC
       LIMIT 20`,
      yearParams
    )
    const revenueByCity = (cityRows as any[]).map((row) => ({
      city: row.city || 'Unknown',
      revenue: Number(row.revenue || 0)
    }))

    // Revenue by month
    const [monthRows] = await mysqlPool.execute(
      `SELECT DATE_FORMAT(bill.transaction_date, '%Y-%m') AS month,
              SUM(bill.total_amount) AS revenue
       FROM billing bill
       WHERE bill.transaction_status IN ('completed', 'pending')
         AND ${yearFilter}
       GROUP BY month
       ORDER BY month`,
      yearParams
    )
    const revenueByMonth = (monthRows as any[]).map((row) => ({
      month: row.month,
      revenue: Number(row.revenue || 0)
    }))

    // Top properties by revenue
    const [propRows] = await mysqlPool.execute(
      `SELECT 
          b.booking_type,
          b.booking_reference,
          SUM(bill.total_amount) AS revenue,
          COUNT(*) AS bookings,
          CASE b.booking_type
            WHEN 'hotel' THEN h.hotel_name
            WHEN 'car' THEN CONCAT(c.company_name, ' ', c.model)
            WHEN 'flight' THEN CONCAT(f.airline_name, ' ', f.flight_id)
          END AS name
        FROM billing bill
        JOIN bookings b ON bill.booking_id = b.booking_id
        LEFT JOIN hotels h ON b.booking_type = 'hotel' AND b.booking_reference = h.hotel_id
        LEFT JOIN cars c ON b.booking_type = 'car' AND b.booking_reference = c.car_id
        LEFT JOIN flights f ON b.booking_type = 'flight' AND b.booking_reference = f.flight_id
        WHERE bill.transaction_status IN ('completed', 'pending')
          AND ${yearFilter}
        GROUP BY b.booking_reference, b.booking_type, name
        ORDER BY revenue DESC
        LIMIT 10`,
      yearParams
    )
    const topProperties = (propRows as any[]).map((row) => ({
      name: row.name || row.booking_reference,
      revenue: Number(row.revenue || 0),
      bookings: Number(row.bookings || 0),
      bookingType: row.booking_type
    }))

    res.json({
      totalRevenue,
      revenueByCity,
      revenueByMonth,
      topProperties
    })
  } catch (error: any) {
    console.error('Revenue stats error:', error)
    res.status(500).json({ error: 'Failed to load revenue stats' })
  }
})

// Booking stats directly from MySQL
app.get('/api/admin/bookings', requireAdmin, async (req, res) => {
  try {
    const limitRaw = req.query.limit
    const limit = Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : 200
    const safeLimit = limit > 0 ? Math.min(limit, 1000) : 200
    // Fetch recent bookings list
    const [rows] = await mysqlPool.query(
      `SELECT * FROM bookings ORDER BY booking_date DESC LIMIT ${safeLimit}`
    )
    const bookings = rows as any[]

    // Aggregate counts (all rows, not limited)
    const [totalRows] = await mysqlPool.execute(
      `SELECT COUNT(*) AS totalBookings FROM bookings`
    )
    const totalBookings = Number((totalRows as any)[0]?.totalBookings || 0)

    const [statusRows] = await mysqlPool.execute(
      `SELECT status, COUNT(*) AS count FROM bookings GROUP BY status`
    )
    const [typeRows] = await mysqlPool.execute(
      `SELECT booking_type AS type, COUNT(*) AS count FROM bookings GROUP BY booking_type`
    )

    const bookingsByStatus: Record<string, number> = {}
    ;(statusRows as any[]).forEach((row) => {
      const status = row.status || 'unknown'
      bookingsByStatus[status] = Number(row.count || 0)
    })

    const bookingsByType: Record<string, number> = {}
    ;(typeRows as any[]).forEach((row) => {
      const type = row.type || 'unknown'
      bookingsByType[type] = Number(row.count || 0)
    })

    res.json({
      totalBookings,
      bookingsByStatus: Object.entries(bookingsByStatus).map(([status, count]) => ({ status, count })),
      bookingsByType: Object.entries(bookingsByType).map(([type, count]) => ({ type, count }))
    })
  } catch (error: any) {
    console.error('Booking stats error:', error)
    res.status(500).json({ error: 'Failed to load booking stats' })
  }
})

// Full bookings list passthrough
app.get('/api/admin/bookings/all', requireAdmin, async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 500
    const [rows] = await mysqlPool.execute(
      `SELECT * FROM bookings ORDER BY booking_date DESC LIMIT ?`,
      [limit]
    )
    res.json({ count: (rows as any[]).length, bookings: rows })
  } catch (error: any) {
    console.error('Booking list error:', error)
    res.status(500).json({ error: 'Failed to load bookings' })
  }
})

// Users list passthrough
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const [rows] = await mysqlPool.execute(
      `SELECT user_id as userId, first_name as firstName, last_name as lastName, email, phone, city, state, zip_code as zipCode, status, is_admin as isAdmin, created_at as createdAt, updated_at as updatedAt
       FROM users
       ORDER BY created_at DESC`
    )
    res.json({ count: (rows as any[]).length, users: rows })
  } catch (error: any) {
    console.error('Users list error:', error)
    res.status(500).json({ error: 'Failed to load users' })
  }
})

app.use(errorHandler)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Admin service running on port ${PORT}`)
})
