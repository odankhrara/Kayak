import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from '@kayak/common/src/middleware/errorHandler'
import userController from './controllers/userController'

dotenv.config()

const app = express()
const PORT = parseInt(process.env.PORT || '8001', 10)

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' })
})

app.use('/api/users', userController)

app.use(errorHandler)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`User Service running on port ${PORT}`)
})

