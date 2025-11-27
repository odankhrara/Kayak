import { getMongoDb } from '@kayak/common/src/db/mongoClient'

export class AnalyticsService {
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
  async getClicksPerPage(startDate?: Date, endDate?: Date) {
    const db = await getMongoDb()
    const logsCollection = db.collection('logs')
    
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: last 30 days
    const end = endDate || new Date()
    
    const pipeline = [
      {
        $match: {
          log_type: 'click',
          timestamp: { $gte: start, $lte: end }
        }
      },
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
    
    const pipeline = [
      {
        $match: {
          log_type: 'click',
          'element_type': { $in: ['card', 'listing', 'property'] },
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$element_id',
          clicks: { $sum: 1 },
          propertyName: { $first: '$element_text' },
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
    const db = await getMongoDb()
    const reviewsCollection = db.collection('reviews')
    
    const matchFilter: any = {}
    if (propertyType) {
      matchFilter.property_type = propertyType
    }
    
    const pipeline = [
      { $match: matchFilter },
      {
        $group: {
          _id: '$property_id',
          propertyName: { $first: '$property_name' },
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
          ratings: {
            $push: {
              rating: '$rating',
              comment: '$comment',
              date: '$review_date'
            }
          }
        }
      },
      {
        $project: {
          propertyId: '$_id',
          propertyName: 1,
          averageRating: { $round: ['$averageRating', 2] },
          reviewCount: 1,
          ratings: { $slice: ['$ratings', 5] } // Last 5 reviews
        }
      },
      {
        $sort: { reviewCount: -1 }
      },
      {
        $limit: 20
      }
    ]
    
    const results = await reviewsCollection.aggregate(pipeline).toArray()
    return results.map((r: any) => ({
      propertyId: r.propertyId,
      propertyName: r.propertyName || 'Unknown Property',
      averageRating: r.averageRating,
      reviewCount: r.reviewCount,
      ratings: r.ratings || []
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

