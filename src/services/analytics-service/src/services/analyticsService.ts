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
}

