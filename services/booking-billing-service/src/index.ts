import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from '@kayak/common/src/middleware/errorHandler'
import bookingController from './controllers/bookingController'
import billingController from './controllers/billingController'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8003

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'booking-billing-service' })
})

app.use('/api/bookings', bookingController)
app.use('/api/billing', billingController)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Booking-Billing Service running on port ${PORT}`)
})

