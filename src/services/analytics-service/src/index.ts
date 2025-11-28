import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from '@kayak/common/src/middleware/errorHandler'
import { requireAdmin } from '@kayak/common/src/middleware/auth'
import { AnalyticsService } from './services/analyticsService'
import analyticsController from './controllers/analyticsController'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8004

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'analytics-service' })
})

// Real-time analytics from Redis (updated by Kafka consumer)
app.use('/api/analytics', analyticsController)

// Legacy analytics from database
const analyticsService = new AnalyticsService()

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

app.use(errorHandler)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`📊 Analytics Service running on port ${PORT}`)
  console.log(`✅ Real-time analytics API: http://localhost:${PORT}/api/analytics/today`)
})

// Start Kafka consumer in background
import('./kafka/bookingPaymentConsumer')
  .then(() => console.log('✅ Kafka consumer started'))
  .catch((err) => console.error('❌ Failed to start Kafka consumer:', err))

