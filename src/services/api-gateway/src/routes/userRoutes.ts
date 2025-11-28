import { Router } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { config } from '../config/env'

const router = Router()

router.use(
  '/api/users',
  createProxyMiddleware({
    target: config.userServiceUrl,
    changeOrigin: true,
    pathRewrite: { '^/api/users': '/api/users' },
    timeout: 120000,
    proxyTimeout: 120000,
    onProxyReq: (proxyReq, req: any, res) => {
      console.log(`[Proxy] ${req.method} ${req.url} -> ${config.userServiceUrl}${req.url}`)
      
      // Fix: Forward the request body properly
      if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        const bodyData = JSON.stringify(req.body)
        proxyReq.setHeader('Content-Type', 'application/json')
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData))
        proxyReq.write(bodyData)
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[Proxy] Response: ${proxyRes.statusCode}`)
    },
    onError: (err, req, res) => {
      console.error('[Proxy Error]:', err.message)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Proxy error', details: err.message })
      }
    }
  })
)

export default router

