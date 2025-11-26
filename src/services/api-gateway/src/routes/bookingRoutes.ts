import { Router } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { config } from '../config/env'

const router = Router()

router.use(
  '/api/bookings',
  createProxyMiddleware({
    target: config.bookingBillingServiceUrl,
    changeOrigin: true,
    pathRewrite: { '^/api/bookings': '/api/bookings' }
  })
)

export default router

