import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from '@kayak/common/src/middleware/errorHandler'
import flightController from './controllers/flightController'
import hotelController from './controllers/hotelController'
import carController from './controllers/carController'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8002

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'listing-service' })
})

app.use('/api/listings/flights', flightController)
app.use('/api/listings/hotels', hotelController)
app.use('/api/listings/cars', carController)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Listing Service running on port ${PORT}`)
})

