import { Router } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { config } from '../config/env'

const router = Router()

// Admin routes proxy to various services
router.use(
  '/api/admin',
  createProxyMiddleware({
    target: config.adminServiceUrl || config.analyticsServiceUrl,
    changeOrigin: true,
    pathRewrite: { '^/api/admin': '/api/admin' }
  })
)

export default router

