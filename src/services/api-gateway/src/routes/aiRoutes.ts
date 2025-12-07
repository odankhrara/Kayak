import { Router } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { config } from '../config/env'

const router = Router()

// Log the AI service URL for debugging
console.log(`[AI Routes] Configuring proxy to: ${config.aiServiceUrl}`)

router.use(
  '/api/ai',
  createProxyMiddleware({
    target: config.aiServiceUrl,
    changeOrigin: true,
    secure: false,
    pathRewrite: { 
      '^/api/ai': ''  // Remove /api/ai prefix, AI service routes are at root level
    },
    timeout: 120000,
    proxyTimeout: 120000,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req: any, res) => {
      const targetPath = req.url.replace('/api/ai', '')
      console.log(`[AI Proxy] ${req.method} ${req.url} -> ${config.aiServiceUrl}${targetPath}`)
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[AI Proxy] Response: ${proxyRes.statusCode} for ${req.url}`)
    },
    onError: (err, req, res) => {
      console.error('[AI Proxy Error]:', err.message)
      console.error('[AI Proxy Error] Request URL:', req.url)
      console.error('[AI Proxy Error] Target:', config.aiServiceUrl)
      if (!res.headersSent) {
        (res as any).status(502).json({ 
          error: 'Proxy error', 
          message: 'Failed to connect to AI recommendation service',
          details: err.message
        })
      }
    }
  })
)

export default router

