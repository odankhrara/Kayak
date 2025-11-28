import { Router } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { config } from '../config/env'
import * as http from 'http'

const router = Router()

router.use(
  '/api/bookings',
  createProxyMiddleware({
    target: config.bookingBillingServiceUrl,
    changeOrigin: true,
    pathRewrite: { '^/api/bookings': '/api/bookings' },
    timeout: 120000,
    proxyTimeout: 120000,
    agent: new http.Agent({ keepAlive: true }),
    headers: {
      Connection: 'keep-alive'
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] ${req.method} ${req.url} -> ${config.bookingBillingServiceUrl}${req.url}`)
      if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
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

