import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from '@kayak/common/src/middleware/errorHandler'
import userRoutes from './routes/userRoutes'
import listingRoutes from './routes/listingRoutes'
import bookingRoutes from './routes/bookingRoutes'
import billingRoutes from './routes/billingRoutes'
import adminRoutes from './routes/adminRoutes'
import aiRoutes from './routes/aiRoutes'
import trackingRoutes from './routes/trackingRoutes'
import { config } from './config/env'

dotenv.config()

console.log(config)
const app = express()

app.use(cors())
app.use(express.json())

// Root route - API information
app.get('/', (req, res) => {
  res.json({
    service: 'Kayak API Gateway',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      users: '/api/users',
      listings: '/api/listings',
      bookings: '/api/bookings',
      billing: '/api/billing',
      admin: '/api/admin',
      ai: '/api/ai',
      tracking: '/api/tracking'
    },
    services: {
      userService: 'http://localhost:8001',
      listingService: 'http://localhost:8002',
      bookingService: 'http://localhost:8003',
      analyticsService: 'http://localhost:8004',
      aiRecommendation: 'http://localhost:8005',
      adminService: 'http://localhost:8006'
    }
  })
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' })
})

// Routes
app.use(userRoutes)
app.use(listingRoutes)
app.use(bookingRoutes)
app.use(billingRoutes)
app.use(adminRoutes)
app.use(aiRoutes)
app.use('/api/tracking', trackingRoutes)

app.use(errorHandler)

app.listen(config.port, '0.0.0.0', () => {
  console.log(`API Gateway running on port ${config.port}`)
})

