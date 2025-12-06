import { Router, Request, Response, NextFunction } from 'express'
import { createProxyMiddleware, Options } from 'http-proxy-middleware'
import { config } from '../config/env'

const router = Router()

// Proxy options for listing service
const listingProxyOptions: Options = {
  target: config.listingServiceUrl,
  changeOrigin: true,
  pathRewrite: { '^/api/listings': '/api/listings' },
  // Handle request body for POST/PUT/PATCH
  onProxyReq: (proxyReq, req: Request, res) => {
    // If body was already parsed, we need to restream it
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body)
      // Update content-length header
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData))
      proxyReq.setHeader('Content-Type', 'application/json')
      // Write body to proxy request
      proxyReq.write(bodyData)
    }
  },
  // Log proxy errors
  onError: (err, req, res) => {
    console.error('Listing proxy error:', err.message)
    if (!res.headersSent) {
      (res as Response).status(502).json({ 
        error: 'Proxy error', 
        message: 'Failed to connect to listing service' 
      })
    }
  },
  // Log successful proxying (optional, for debugging)
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Listing Proxy] ${req.method} ${req.url} -> ${proxyRes.statusCode}`)
  }
}

router.use('/api/listings', createProxyMiddleware(listingProxyOptions))

export default router

