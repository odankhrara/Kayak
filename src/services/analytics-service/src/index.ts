import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from '@kayak/common/src/middleware/errorHandler'
import { requireAdmin } from '@kayak/common/src/middleware/auth'
import { AnalyticsService } from './services/analyticsService'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8004

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'analytics-service' })
})

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

app.listen(PORT, () => {
  console.log(`Analytics Service running on port ${PORT}`)
})

