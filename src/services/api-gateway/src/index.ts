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
import { config } from './config/env'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

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

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`API Gateway running on port ${config.port}`)
})

