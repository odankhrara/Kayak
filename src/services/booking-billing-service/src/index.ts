import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from '@kayak/common/src/middleware/errorHandler'
import bookingController from './controllers/bookingController'
import billingController from './controllers/billingController'

dotenv.config()

const app = express()
const PORT = parseInt(process.env.PORT || '8003', 10)

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    service: 'booking-billing-service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      bookings: '/api/bookings',
      billing: '/api/billing'
    }
  })
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'booking-billing-service' })
})

app.use('/api/bookings', bookingController)
app.use('/api/billing', billingController)

app.use(errorHandler)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Booking-Billing Service running on port ${PORT}`)
})

