import { Router } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { config } from '../config/env'

const router = Router()

router.use(
  '/api/listings',
  createProxyMiddleware({
    target: config.listingServiceUrl,
    changeOrigin: true,
    pathRewrite: { '^/api/listings': '/api/listings' }
  })
)

export default router

