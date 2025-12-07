import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from '@kayak/common/src/middleware/errorHandler'
import { requireAdmin } from '@kayak/common/src/middleware/auth'
import { AnalyticsService } from './services/analyticsService'
import analyticsController from './controllers/analyticsController'
import { ClickEventsConsumer } from './consumers/clickEventsConsumer'
import { UserTrackingConsumer } from './consumers/userTrackingConsumer'

dotenv.config()

const app = express()
const PORT = process.env.PORT || '8004'

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    service: 'analytics-service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      analytics: '/api/analytics',
      admin: {
        revenue: '/api/admin/revenue/by-city',
        topProperties: '/api/admin/properties/top',
        clicksPerPage: '/api/admin/host/clicks-per-page',
        propertyClicks: '/api/admin/host/property-clicks'
      },
      providers: {
        summary: '/api/admin/providers/summary',
        airlines: '/api/admin/providers/airlines',
        hotels: '/api/admin/providers/hotels',
        cars: '/api/admin/providers/cars',
        revenueTimeline: '/api/admin/providers/revenue-timeline',
        list: '/api/admin/providers/list'
      }
    }
  })
})

// Enhanced health check that verifies all dependencies
app.get('/health', async (req, res) => {
  const health: {
    status: 'ok' | 'degraded' | 'unhealthy';
    service: string;
    timestamp: string;
    dependencies: {
      mysql: { status: string; latency?: number };
      mongodb: { status: string; latency?: number };
      redis: { status: string; latency?: number };
      kafka: { status: string };
    };
  } = {
    status: 'ok',
    service: 'analytics-service',
    timestamp: new Date().toISOString(),
    dependencies: {
      mysql: { status: 'unknown' },
      mongodb: { status: 'unknown' },
      redis: { status: 'unknown' },
      kafka: { status: clickEventsConsumer || userTrackingConsumer ? 'connected' : 'disconnected' }
    }
  };

  // Check MySQL
  try {
    const mysqlStart = Date.now();
    const mysqlPool = (await import('@kayak/common/src/db/mysqlPool')).default;
    await mysqlPool.query('SELECT 1');
    health.dependencies.mysql = { status: 'healthy', latency: Date.now() - mysqlStart };
  } catch (err) {
    health.dependencies.mysql = { status: 'unhealthy' };
    health.status = 'degraded';
  }

  // Check MongoDB
  try {
    const mongoStart = Date.now();
    const { getMongoDb } = await import('@kayak/common/src/db/mongoClient');
    const db = await getMongoDb();
    await db.command({ ping: 1 });
    health.dependencies.mongodb = { status: 'healthy', latency: Date.now() - mongoStart };
  } catch (err) {
    health.dependencies.mongodb = { status: 'unhealthy' };
    health.status = 'degraded';
  }

  // Check Redis
  try {
    const redisStart = Date.now();
    const { redisCache } = await import('@kayak/common/src/cache/redisCache');
    await redisCache.get('health-check-test');
    health.dependencies.redis = { status: 'healthy', latency: Date.now() - redisStart };
  } catch (err) {
    health.dependencies.redis = { status: 'unhealthy' };
    health.status = 'degraded';
  }

  // Kafka status from consumer state
  if (!clickEventsConsumer && !userTrackingConsumer) {
    health.dependencies.kafka = { status: 'disconnected' };
    health.status = 'degraded';
  }

  // Return appropriate status code
  const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(health);
})

// Real-time analytics from Redis (updated by Kafka consumer)
app.use('/api/analytics', analyticsController)

// Legacy analytics from database
const analyticsService = new AnalyticsService()

// Initialize Kafka consumers (will start after server is up)
let clickEventsConsumer: ClickEventsConsumer | null = null
let userTrackingConsumer: UserTrackingConsumer | null = null

try {
  clickEventsConsumer = new ClickEventsConsumer()
  userTrackingConsumer = new UserTrackingConsumer()
} catch (err) {
  console.error('Failed to initialize Kafka consumers:', err)
  console.warn('⚠️  Continuing without Kafka consumers...')
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  if (clickEventsConsumer) await clickEventsConsumer.stop().catch(console.error)
  if (userTrackingConsumer) await userTrackingConsumer.stop().catch(console.error)
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...')
  if (clickEventsConsumer) await clickEventsConsumer.stop().catch(console.error)
  if (userTrackingConsumer) await userTrackingConsumer.stop().catch(console.error)
  process.exit(0)
})

app.get('/api/admin/revenue/by-city', requireAdmin, async (req, res) => {
  try {
    const { year } = req.query
    const data = await analyticsService.getRevenueByCity(parseInt(year as string) || new Date().getFullYear())
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/admin/properties/top', requireAdmin, async (req, res) => {
  try {
    const { year, limit } = req.query
    const data = await analyticsService.getTopProperties(
      parseInt(year as string) || new Date().getFullYear(),
      parseInt(limit as string) || 10
    )
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Host/Provider Analysis Endpoints
app.get('/api/admin/host/clicks-per-page', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, propertyType } = req.query
    const start = startDate ? new Date(startDate as string) : undefined
    const end = endDate ? new Date(endDate as string) : undefined
    const data = await analyticsService.getClicksPerPage(start, end, propertyType as 'hotel' | 'flight' | 'car' | undefined)
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/admin/host/property-clicks', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const start = startDate ? new Date(startDate as string) : undefined
    const end = endDate ? new Date(endDate as string) : undefined
    const data = await analyticsService.getPropertyClicks(start, end)
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/admin/host/least-seen-areas', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const start = startDate ? new Date(startDate as string) : undefined
    const end = endDate ? new Date(endDate as string) : undefined
    const data = await analyticsService.getLeastSeenAreas(start, end)
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/admin/host/property-reviews', requireAdmin, async (req, res) => {
  try {
    const { propertyType } = req.query
    const data = await analyticsService.getPropertyReviews(propertyType as 'hotel' | 'flight' | 'car' | undefined)
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/admin/host/user-trace', requireAdmin, async (req, res) => {
  try {
    const { userId, city, state } = req.query
    const data = await analyticsService.getUserTrace(
      userId as string | undefined,
      city as string | undefined,
      state as string | undefined
    )
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/admin/host/bidding-trace', requireAdmin, async (req, res) => {
  try {
    const { propertyId } = req.query
    const data = await analyticsService.getBiddingTrace(propertyId as string | undefined)
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// PROVIDER ANALYTICS ENDPOINTS (Phase 1)
// ============================================

// Get all providers summary
app.get('/api/admin/providers/summary', requireAdmin, async (req, res) => {
  try {
    const { year } = req.query
    const data = await analyticsService.getProvidersSummary(
      year ? parseInt(year as string) : undefined
    )
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get top airlines by revenue
app.get('/api/admin/providers/airlines', requireAdmin, async (req, res) => {
  try {
    const { year, limit } = req.query
    const data = await analyticsService.getTopAirlinesByRevenue(
      year ? parseInt(year as string) : undefined,
      limit ? parseInt(limit as string) : 10
    )
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get top hotels by bookings
app.get('/api/admin/providers/hotels', requireAdmin, async (req, res) => {
  try {
    const { year, limit } = req.query
    const data = await analyticsService.getTopHotelsByBookings(
      year ? parseInt(year as string) : undefined,
      limit ? parseInt(limit as string) : 10
    )
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get top car companies by rentals
app.get('/api/admin/providers/cars', requireAdmin, async (req, res) => {
  try {
    const { year, limit } = req.query
    const data = await analyticsService.getTopCarCompaniesByRentals(
      year ? parseInt(year as string) : undefined,
      limit ? parseInt(limit as string) : 10
    )
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get provider revenue over time (monthly)
app.get('/api/admin/providers/revenue-timeline', requireAdmin, async (req, res) => {
  try {
    const { type, provider, year } = req.query
    if (!type || !['airline', 'hotel', 'car'].includes(type as string)) {
      return res.status(400).json({ error: 'Invalid provider type. Use: airline, hotel, or car' })
    }
    const data = await analyticsService.getProviderRevenueOverTime(
      type as 'airline' | 'hotel' | 'car',
      provider as string | undefined,
      year ? parseInt(year as string) : undefined
    )
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get list of all providers
app.get('/api/admin/providers/list', requireAdmin, async (req, res) => {
  try {
    const data = await analyticsService.getProvidersList()
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

app.use(errorHandler)

app.listen(parseInt(PORT, 10), '0.0.0.0', () => {
  console.log(`📊 Analytics Service running on port ${PORT}`)
  console.log(`✅ Real-time analytics API: http://localhost:${PORT}/api/analytics/today`)
  
  // Start Kafka consumers after server is up
  if (clickEventsConsumer) {
    clickEventsConsumer.start().catch(err => {
      console.error('Failed to start click events consumer:', err)
    })
  }
  
  if (userTrackingConsumer) {
    userTrackingConsumer.start().catch(err => {
      console.error('Failed to start user tracking consumer:', err)
    })
  }
})

// Start Kafka consumer in background
import('./kafka/bookingPaymentConsumer')
  .then(() => console.log('✅ Kafka consumer started'))
  .catch((err) => console.error('❌ Failed to start Kafka consumer:', err))

