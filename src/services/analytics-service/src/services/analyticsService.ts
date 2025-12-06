import { getMongoDb } from '@kayak/common/src/db/mongoClient'
import mysqlPool from '@kayak/common/src/db/mysqlPool'

export class AnalyticsService {
  // ============================================
  // PROVIDER ANALYTICS METHODS (Phase 1)
  // ============================================

  /**
   * Get top airlines by revenue
   */
  async getTopAirlinesByRevenue(year?: number, limit: number = 10): Promise<any[]> {
    const targetYear = year || new Date().getFullYear()
    
    const query = `
      SELECT 
        f.airline_name AS provider,
        COUNT(DISTINCT b.booking_id) AS total_bookings,
        SUM(bill.total_amount) AS total_revenue,
        AVG(f.rating) AS avg_rating,
        COUNT(DISTINCT f.flight_id) AS total_flights
      FROM flights f
      LEFT JOIN bookings b ON f.flight_id = b.booking_reference 
        AND b.booking_type = 'flight'
        AND YEAR(b.booking_date) = ?
      LEFT JOIN billing bill ON b.booking_id = bill.booking_id
        AND bill.transaction_status = 'completed'
      GROUP BY f.airline_name
      ORDER BY total_revenue DESC
      LIMIT ?
    `
    
    const [rows] = await mysqlPool.query(query, [targetYear, limit])
    return (rows as any[]).map(row => ({
      provider: row.provider,
      totalBookings: row.total_bookings || 0,
      totalRevenue: parseFloat(row.total_revenue) || 0,
      avgRating: parseFloat(row.avg_rating) || 0,
      totalFlights: row.total_flights || 0
    }))
  }

  /**
   * Get top hotel chains by bookings
   */
  async getTopHotelsByBookings(year?: number, limit: number = 10): Promise<any[]> {
    const targetYear = year || new Date().getFullYear()
    
    // Extract hotel chain from hotel_name (e.g., "Hilton San Jose" -> "Hilton")
    const query = `
      SELECT 
        SUBSTRING_INDEX(h.hotel_name, ' ', 1) AS provider,
        COUNT(DISTINCT b.booking_id) AS total_bookings,
        SUM(bill.total_amount) AS total_revenue,
        AVG(h.rating) AS avg_rating,
        COUNT(DISTINCT h.hotel_id) AS total_properties,
        AVG(h.star_rating) AS avg_stars
      FROM hotels h
      LEFT JOIN bookings b ON h.hotel_id = b.booking_reference 
        AND b.booking_type = 'hotel'
        AND YEAR(b.booking_date) = ?
      LEFT JOIN billing bill ON b.booking_id = bill.booking_id
        AND bill.transaction_status = 'completed'
      GROUP BY SUBSTRING_INDEX(h.hotel_name, ' ', 1)
      ORDER BY total_bookings DESC
      LIMIT ?
    `
    
    const [rows] = await mysqlPool.query(query, [targetYear, limit])
    return (rows as any[]).map(row => ({
      provider: row.provider,
      totalBookings: row.total_bookings || 0,
      totalRevenue: parseFloat(row.total_revenue) || 0,
      avgRating: parseFloat(row.avg_rating) || 0,
      totalProperties: row.total_properties || 0,
      avgStars: parseFloat(row.avg_stars) || 0
    }))
  }

  /**
   * Get top car rental companies by rentals
   */
  async getTopCarCompaniesByRentals(year?: number, limit: number = 10): Promise<any[]> {
    const targetYear = year || new Date().getFullYear()
    
    const query = `
      SELECT 
        c.company_name AS provider,
        COUNT(DISTINCT b.booking_id) AS total_rentals,
        SUM(bill.total_amount) AS total_revenue,
        AVG(c.rating) AS avg_rating,
        COUNT(DISTINCT c.car_id) AS total_vehicles
      FROM cars c
      LEFT JOIN bookings b ON c.car_id = b.booking_reference 
        AND b.booking_type = 'car'
        AND YEAR(b.booking_date) = ?
      LEFT JOIN billing bill ON b.booking_id = bill.booking_id
        AND bill.transaction_status = 'completed'
      GROUP BY c.company_name
      ORDER BY total_rentals DESC
      LIMIT ?
    `
    
    const [rows] = await mysqlPool.query(query, [targetYear, limit])
    return (rows as any[]).map(row => ({
      provider: row.provider,
      totalRentals: row.total_rentals || 0,
      totalRevenue: parseFloat(row.total_revenue) || 0,
      avgRating: parseFloat(row.avg_rating) || 0,
      totalVehicles: row.total_vehicles || 0
    }))
  }

  /**
   * Get all providers summary (airlines, hotels, car companies)
   */
  async getProvidersSummary(year?: number): Promise<any> {
    const [airlines, hotels, carCompanies] = await Promise.all([
      this.getTopAirlinesByRevenue(year, 10),
      this.getTopHotelsByBookings(year, 10),
      this.getTopCarCompaniesByRentals(year, 10)
    ])

    // Calculate totals
    const totalAirlineRevenue = airlines.reduce((sum, a) => sum + a.totalRevenue, 0)
    const totalHotelRevenue = hotels.reduce((sum, h) => sum + h.totalRevenue, 0)
    const totalCarRevenue = carCompanies.reduce((sum, c) => sum + c.totalRevenue, 0)

    return {
      airlines: {
        providers: airlines,
        totalRevenue: totalAirlineRevenue,
        totalProviders: airlines.length
      },
      hotels: {
        providers: hotels,
        totalRevenue: totalHotelRevenue,
        totalProviders: hotels.length
      },
      carCompanies: {
        providers: carCompanies,
        totalRevenue: totalCarRevenue,
        totalProviders: carCompanies.length
      },
      grandTotal: totalAirlineRevenue + totalHotelRevenue + totalCarRevenue
    }
  }

  /**
   * Get provider revenue over time (monthly breakdown)
   */
  async getProviderRevenueOverTime(providerType: 'airline' | 'hotel' | 'car', providerName?: string, year?: number): Promise<any[]> {
    const targetYear = year || new Date().getFullYear()
    
    let query = ''
    const params: any[] = [targetYear]
    
    if (providerType === 'airline') {
      query = `
        SELECT 
          MONTH(b.booking_date) AS month,
          f.airline_name AS provider,
          COUNT(DISTINCT b.booking_id) AS bookings,
          SUM(bill.total_amount) AS revenue
        FROM bookings b
        JOIN flights f ON f.flight_id = b.booking_reference AND b.booking_type = 'flight'
        JOIN billing bill ON b.booking_id = bill.booking_id AND bill.transaction_status = 'completed'
        WHERE YEAR(b.booking_date) = ?
        ${providerName ? 'AND f.airline_name = ?' : ''}
        GROUP BY MONTH(b.booking_date), f.airline_name
        ORDER BY month, provider
      `
    } else if (providerType === 'hotel') {
      query = `
        SELECT 
          MONTH(b.booking_date) AS month,
          SUBSTRING_INDEX(h.hotel_name, ' ', 1) AS provider,
          COUNT(DISTINCT b.booking_id) AS bookings,
          SUM(bill.total_amount) AS revenue
        FROM bookings b
        JOIN hotels h ON h.hotel_id = b.booking_reference AND b.booking_type = 'hotel'
        JOIN billing bill ON b.booking_id = bill.booking_id AND bill.transaction_status = 'completed'
        WHERE YEAR(b.booking_date) = ?
        ${providerName ? 'AND SUBSTRING_INDEX(h.hotel_name, \' \', 1) = ?' : ''}
        GROUP BY MONTH(b.booking_date), SUBSTRING_INDEX(h.hotel_name, ' ', 1)
        ORDER BY month, provider
      `
    } else {
      query = `
        SELECT 
          MONTH(b.booking_date) AS month,
          c.company_name AS provider,
          COUNT(DISTINCT b.booking_id) AS bookings,
          SUM(bill.total_amount) AS revenue
        FROM bookings b
        JOIN cars c ON c.car_id = b.booking_reference AND b.booking_type = 'car'
        JOIN billing bill ON b.booking_id = bill.booking_id AND bill.transaction_status = 'completed'
        WHERE YEAR(b.booking_date) = ?
        ${providerName ? 'AND c.company_name = ?' : ''}
        GROUP BY MONTH(b.booking_date), c.company_name
        ORDER BY month, provider
      `
    }
    
    if (providerName) {
      params.push(providerName)
    }
    
    const [rows] = await mysqlPool.query(query, params)
    return (rows as any[]).map(row => ({
      month: row.month,
      provider: row.provider,
      bookings: row.bookings || 0,
      revenue: parseFloat(row.revenue) || 0
    }))
  }

  /**
   * Get distinct providers list
   */
  async getProvidersList(): Promise<any> {
    const [airlines] = await mysqlPool.query('SELECT DISTINCT airline_name FROM flights ORDER BY airline_name')
    const [hotels] = await mysqlPool.query('SELECT DISTINCT SUBSTRING_INDEX(hotel_name, \' \', 1) AS chain FROM hotels ORDER BY chain')
    const [carCompanies] = await mysqlPool.query('SELECT DISTINCT company_name FROM cars ORDER BY company_name')
    
    return {
      airlines: (airlines as any[]).map(r => r.airline_name),
      hotelChains: (hotels as any[]).map(r => r.chain),
      carCompanies: (carCompanies as any[]).map(r => r.company_name)
    }
  }
  async getRevenueByCity(year: number) {
    const db = await getMongoDb()
    const collection = db.collection('analytics_aggregates')
    
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year + 1, 0, 1)
    
    const results = await collection
      .find({
        type: 'revenue_by_city',
        date: { $gte: startDate, $lt: endDate }
      })
      .toArray()
    
    // Aggregate by city
    const cityRevenue: { [key: string]: { revenue: number; bookings: number } } = {}
    
    results.forEach((doc: any) => {
      const city = doc.city
      if (!cityRevenue[city]) {
        cityRevenue[city] = { revenue: 0, bookings: 0 }
      }
      cityRevenue[city].revenue += doc.revenue || 0
      cityRevenue[city].bookings += doc.bookings || 0
    })
    
    return Object.entries(cityRevenue).map(([city, data]) => ({
      city,
      ...data
    }))
  }

  async getTopProperties(year: number, limit: number = 10) {
    const db = await getMongoDb()
    const collection = db.collection('analytics_aggregates')
    
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year + 1, 0, 1)
    
    const results = await collection
      .find({
        type: 'top_properties',
        date: { $gte: startDate, $lt: endDate }
      })
      .toArray()
    
    // Aggregate by property
    const propertyRevenue: { [key: string]: { revenue: number; bookings: number } } = {}
    
    results.forEach((doc: any) => {
      const propertyId = doc.property_id
      if (!propertyRevenue[propertyId]) {
        propertyRevenue[propertyId] = { revenue: 0, bookings: 0 }
      }
      propertyRevenue[propertyId].revenue += doc.revenue || 0
      propertyRevenue[propertyId].bookings += doc.bookings || 0
    })
    
    return Object.entries(propertyRevenue)
      .map(([property_id, data]) => ({
        property_id,
        ...data
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
  }

  // Host/Provider Analysis Methods
  async getClicksPerPage(startDate?: Date, endDate?: Date, propertyType?: 'hotel' | 'flight' | 'car') {
    const db = await getMongoDb()
    const logsCollection = db.collection('logs')
    
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: last 30 days
    const end = endDate || new Date()
    
    // Build match filter
    const matchFilter: any = {
      log_type: 'click',
      timestamp: { $gte: start, $lte: end }
    }
    
    // Filter by property type if specified
    if (propertyType) {
      matchFilter.page_url = { $regex: new RegExp(`/${propertyType}s?(/|$)`, 'i') }
    }
    
    const pipeline = [
      { $match: matchFilter },
      {
        $group: {
          _id: '$page_url',
          clicks: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user_id' }
        }
      },
      {
        $project: {
          page: '$_id',
          clicks: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      {
        $sort: { clicks: -1 }
      },
      {
        $limit: 20
      }
    ]
    
    const results = await logsCollection.aggregate(pipeline).toArray()
    return results.map((r: any) => ({
      page: r.page || 'Unknown',
      clicks: r.clicks,
      uniqueUsers: r.uniqueUsers
    }))
  }

  async getPropertyClicks(startDate?: Date, endDate?: Date) {
    const db = await getMongoDb()
    const logsCollection = db.collection('logs')
    
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate || new Date()
    
    // First try to get clicks on property pages (flights/hotels/cars detail pages)
    const pipeline = [
      {
        $match: {
          log_type: 'click',
          timestamp: { $gte: start, $lte: end },
          // Look for clicks on property detail pages or booking actions
          $or: [
            { page_url: { $regex: /^\/(flights|hotels|cars)\/[^/]+/ } },
            { element_type: { $in: ['card', 'listing', 'property', 'link'] } },
            { element_id: { $regex: /^(flight|hotel|car|book|favorite)/ } }
          ]
        }
      },
      {
        $group: {
          _id: {
            // Group by page URL for property pages, or element_id for other clicks
            $cond: [
              { $regexMatch: { input: '$page_url', regex: /^\/(flights|hotels|cars)\/[^/]+/ } },
              '$page_url',
              '$element_id'
            ]
          },
          clicks: { $sum: 1 },
          propertyName: { $first: { $ifNull: ['$element_text', '$page_title'] } },
          pageUrl: { $first: '$page_url' }
        }
      },
      {
        $project: {
          propertyId: '$_id',
          propertyName: 1,
          clicks: 1,
          pageUrl: 1
        }
      },
      {
        $sort: { clicks: -1 }
      },
      {
        $limit: 20
      }
    ]
    
    const results = await logsCollection.aggregate(pipeline).toArray()
    return results.map((r: any) => ({
      propertyId: r.propertyId || 'Unknown',
      propertyName: r.propertyName || 'Unknown Property',
      clicks: r.clicks,
      pageUrl: r.pageUrl
    }))
  }

  async getLeastSeenAreas(startDate?: Date, endDate?: Date) {
    const db = await getMongoDb()
    const logsCollection = db.collection('logs')
    
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate || new Date()
    
    // Get all pages and their view counts
    const allPages = await logsCollection.distinct('page_url', {
      log_type: 'page_view',
      timestamp: { $gte: start, $lte: end }
    })
    
    const pageViews = await logsCollection.aggregate([
      {
        $match: {
          log_type: 'page_view',
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$page_url',
          views: { $sum: 1 }
        }
      }
    ]).toArray()
    
    const viewMap = new Map(pageViews.map((p: any) => [p._id, p.views]))
    
    // Find pages with least views
    const leastSeen = allPages
      .map((page: string) => ({
        page,
        views: viewMap.get(page) || 0
      }))
      .sort((a, b) => a.views - b.views)
      .slice(0, 10)
    
    return leastSeen
  }

  async getPropertyReviews(propertyType?: 'hotel' | 'flight' | 'car') {
    // Query reviews from MySQL (where they are actually stored)
    let query = `
      SELECT 
        r.item_id AS property_id,
        r.item_type AS property_type,
        CASE 
          WHEN r.item_type = 'hotel' THEN h.hotel_name
          WHEN r.item_type = 'car' THEN CONCAT(c.model, ' (', c.company_name, ')')
          WHEN r.item_type = 'flight' THEN f.airline_name
          ELSE 'Unknown'
        END AS property_name,
        ROUND(AVG(r.rating), 2) AS average_rating,
        COUNT(*) AS review_count
      FROM reviews r
      LEFT JOIN hotels h ON r.item_type = 'hotel' AND r.item_id = h.hotel_id
      LEFT JOIN cars c ON r.item_type = 'car' AND r.item_id = c.car_id
      LEFT JOIN flights f ON r.item_type = 'flight' AND r.item_id = f.flight_id
      WHERE r.status = 'approved'
    `
    
    const params: any[] = []
    if (propertyType) {
      query += ` AND r.item_type = ?`
      params.push(propertyType)
    }
    
    query += `
      GROUP BY r.item_id, r.item_type, property_name
      ORDER BY review_count DESC, average_rating DESC
      LIMIT 20
    `
    
    const [rows] = await mysqlPool.query(query, params)
    
    return (rows as any[]).map(row => ({
      propertyId: row.property_id,
      propertyType: row.property_type,
      propertyName: row.property_name || 'Unknown Property',
      averageRating: parseFloat(row.average_rating) || 0,
      reviewCount: row.review_count
    }))
  }

  async getUserTrace(userId?: string, city?: string, state?: string) {
    const db = await getMongoDb()
    const logsCollection = db.collection('logs')
    
    const matchFilter: any = {}
    
    if (userId) {
      matchFilter.user_id = userId
    }
    
    if (city && state) {
      matchFilter['location.city'] = city
      matchFilter['location.state'] = state
    }
    
    const pipeline = [
      { $match: matchFilter },
      {
        $sort: { timestamp: 1 }
      },
      {
        $group: {
          _id: '$session_id',
          userId: { $first: '$user_id' },
          location: { $first: '$location' },
          events: {
            $push: {
              type: '$log_type',
              page: '$page_url',
              timestamp: '$timestamp',
              element: '$element_id',
              action: '$element_text'
            }
          },
          startTime: { $min: '$timestamp' },
          endTime: { $max: '$timestamp' }
        }
      },
      {
        $project: {
          sessionId: '$_id',
          userId: 1,
          location: 1,
          events: 1,
          duration: {
            $subtract: ['$endTime', '$startTime']
          },
          startTime: 1,
          endTime: 1
        }
      },
      {
        $limit: 50
      }
    ]
    
    const results = await logsCollection.aggregate(pipeline).toArray()
    return results.map((r: any) => ({
      sessionId: r.sessionId,
      userId: r.userId,
      location: r.location,
      events: r.events,
      duration: r.duration,
      startTime: r.startTime,
      endTime: r.endTime
    }))
  }

  async getBiddingTrace(propertyId?: string) {
    const db = await getMongoDb()
    const logsCollection = db.collection('logs')
    
    const matchFilter: any = {
      log_type: { $in: ['click', 'search', 'booking_attempt'] },
      'search_params.type': { $exists: true }
    }
    
    if (propertyId) {
      matchFilter['element_id'] = propertyId
    }
    
    const pipeline = [
      { $match: matchFilter },
      {
        $sort: { timestamp: 1 }
      },
      {
        $group: {
          _id: '$element_id',
          propertyId: { $first: '$element_id' },
          propertyName: { $first: '$element_text' },
          events: {
            $push: {
              type: '$log_type',
              userId: '$user_id',
              timestamp: '$timestamp',
              searchParams: '$search_params',
              price: '$metadata.price'
            }
          },
          clickCount: {
            $sum: { $cond: [{ $eq: ['$log_type', 'click'] }, 1, 0] }
          },
          searchCount: {
            $sum: { $cond: [{ $eq: ['$log_type', 'search'] }, 1, 0] }
          },
          bookingAttempts: {
            $sum: { $cond: [{ $eq: ['$log_type', 'booking_attempt'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          propertyId: 1,
          propertyName: 1,
          events: 1,
          clickCount: 1,
          searchCount: 1,
          bookingAttempts: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$clickCount', 0] },
              { $multiply: [{ $divide: ['$bookingAttempts', '$clickCount'] }, 100] },
              0
            ]
          }
        }
      },
      {
        $sort: { clickCount: -1 }
      },
      {
        $limit: 20
      }
    ]
    
    const results = await logsCollection.aggregate(pipeline).toArray()
    return results.map((r: any) => ({
      propertyId: r.propertyId,
      propertyName: r.propertyName || 'Unknown',
      events: r.events,
      clickCount: r.clickCount,
      searchCount: r.searchCount,
      bookingAttempts: r.bookingAttempts,
      conversionRate: r.conversionRate
    }))
  }
}

