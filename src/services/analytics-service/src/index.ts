import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from '@kayak/common/src/middleware/errorHandler'
import { requireAdmin } from '@kayak/common/src/middleware/auth'
import { AnalyticsService } from './services/analyticsService'
import { ClickEventsConsumer } from './consumers/clickEventsConsumer'
import { UserTrackingConsumer } from './consumers/userTrackingConsumer'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8004

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'analytics-service' })
})

const analyticsService = new AnalyticsService()

// Initialize Kafka consumers
const clickEventsConsumer = new ClickEventsConsumer()
const userTrackingConsumer = new UserTrackingConsumer()

// Start consumers
clickEventsConsumer.start().catch(err => {
  console.error('Failed to start click events consumer:', err)
})

userTrackingConsumer.start().catch(err => {
  console.error('Failed to start user tracking consumer:', err)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await clickEventsConsumer.stop()
  await userTrackingConsumer.stop()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...')
  await clickEventsConsumer.stop()
  await userTrackingConsumer.stop()
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
    const { startDate, endDate } = req.query
    const start = startDate ? new Date(startDate as string) : undefined
    const end = endDate ? new Date(endDate as string) : undefined
    const data = await analyticsService.getClicksPerPage(start, end)
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

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Analytics Service running on port ${PORT}`)
})

