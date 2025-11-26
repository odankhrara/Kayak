import { Router } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { config } from '../config/env'

const router = Router()

router.use(
  '/api/users',
  createProxyMiddleware({
    target: config.userServiceUrl,
    changeOrigin: true,
    pathRewrite: { '^/api/users': '/api/users' }
  })
)

export default router

