import { Router } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { config } from '../config/env'

const router = Router()

router.use(
  '/api/billing',
  createProxyMiddleware({
    target: config.bookingBillingServiceUrl,
    changeOrigin: true,
    pathRewrite: { '^/api/billing': '/api/billing' }
  })
)

export default router

