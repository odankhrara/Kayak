import { Router } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { config } from '../config/env'

const router = Router()

router.use(
  '/api/ai',
  createProxyMiddleware({
    target: config.aiServiceUrl,
    changeOrigin: true,
    pathRewrite: { '^/api/ai': '' }
  })
)

export default router

