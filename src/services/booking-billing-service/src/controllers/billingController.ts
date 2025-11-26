import { Router, Request, Response } from 'express'
import { requireAuth, requireAdmin } from '@kayak/common/src/middleware/auth'
import { BillingService } from '../services/billingService'

const router = Router()
const billingService = new BillingService()

/**
 * @route   GET /api/billing/:id
 * @desc    Get billing record by ID
 * @access  Private (own billing) or Admin
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const billing = await billingService.getById(req.params.id)
    
    // Check if user owns this billing record or is admin
    const requestingUserId = (req as any).user.userId
    const isAdmin = (req as any).user.isAdmin
    
    if (billing.userId !== requestingUserId && !isAdmin) {
      return res.status(403).json({ 
        error: 'You do not have permission to view this billing record' 
      })
    }

    res.json(billing)
  } catch (error: any) {
    console.error('Get billing error:', error.message)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
})

/**
 * @route   GET /api/billing/booking/:bookingId
 * @desc    Get billing records for a booking
 * @access  Private (own booking) or Admin
 */
router.get('/booking/:bookingId', requireAuth, async (req: Request, res: Response) => {
  try {
    const billings = await billingService.getByBookingId(req.params.bookingId)
    
    if (billings.length > 0) {
      const requestingUserId = (req as any).user.userId
      const isAdmin = (req as any).user.isAdmin
      
      if (billings[0].userId !== requestingUserId && !isAdmin) {
        return res.status(403).json({ 
          error: 'You do not have permission to view these billing records' 
        })
      }
    }

    res.json({
      bookingId: req.params.bookingId,
      count: billings.length,
      billings
    })
  } catch (error: any) {
    console.error('Get billing by booking error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

/**
 * @route   GET /api/billing/user/:userId
 * @desc    Get user's billing history
 * @access  Private (own billings) or Admin
 */
router.get('/user/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const requestingUserId = (req as any).user.userId
    const targetUserId = req.params.userId
    const isAdmin = (req as any).user.isAdmin

    // Users can only view their own billings unless they're admin
    if (requestingUserId !== targetUserId && !isAdmin) {
      return res.status(403).json({ 
        error: 'You do not have permission to view these billing records' 
      })
    }

    const billings = await billingService.getUserBillings(targetUserId)
    
    res.json({
      userId: targetUserId,
      count: billings.length,
      billings
    })
  } catch (error: any) {
    console.error('Get user billings error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

/**
 * @route   GET /api/billing/:id/invoice
 * @desc    Generate invoice for a billing record
 * @access  Private (own billing) or Admin
 */
router.get('/:id/invoice', requireAuth, async (req: Request, res: Response) => {
  try {
    const billing = await billingService.getById(req.params.id)
    
    // Check if user owns this billing record or is admin
    const requestingUserId = (req as any).user.userId
    const isAdmin = (req as any).user.isAdmin
    
    if (billing.userId !== requestingUserId && !isAdmin) {
      return res.status(403).json({ 
        error: 'You do not have permission to view this invoice' 
      })
    }

    const invoice = await billingService.generateInvoice(req.params.id)
    res.json(invoice)
  } catch (error: any) {
    console.error('Generate invoice error:', error.message)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
})

/**
 * @route   POST /api/billing/search
 * @desc    Search billing records with filters
 * @access  Admin only
 */
router.post('/search', requireAdmin, async (req: Request, res: Response) => {
  try {
    const filters = {
      userId: req.body.userId,
      bookingType: req.body.bookingType,
      status: req.body.status,
      paymentMethod: req.body.paymentMethod,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      minAmount: req.body.minAmount,
      maxAmount: req.body.maxAmount,
      limit: req.body.limit || 100
    }

    const billings = await billingService.searchBillings(filters)
    
    res.json({
      count: billings.length,
      filters,
      billings
    })
  } catch (error: any) {
    console.error('Search billings error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   GET /api/billing/analytics/revenue
 * @desc    Get revenue analytics
 * @access  Admin only
 */
router.get('/analytics/revenue', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Start date and end date are required' 
      })
    }

    const revenue = await billingService.getRevenue(
      startDate as string,
      endDate as string
    )
    
    res.json(revenue)
  } catch (error: any) {
    console.error('Get revenue error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   GET /api/billing/analytics/top-properties
 * @desc    Get top revenue generating properties
 * @access  Admin only
 */
router.get('/analytics/top-properties', requireAdmin, async (req: Request, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear()
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10

    const topProperties = await billingService.getTopProperties(year, limit)
    
    res.json({
      year,
      count: topProperties.length,
      properties: topProperties
    })
  } catch (error: any) {
    console.error('Get top properties error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   GET /api/billing/analytics/city-revenue
 * @desc    Get city-wise revenue
 * @access  Admin only
 */
router.get('/analytics/city-revenue', requireAdmin, async (req: Request, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear()

    const cityRevenue = await billingService.getCityRevenue(year)
    
    res.json({
      year,
      count: cityRevenue.length,
      cities: cityRevenue
    })
  } catch (error: any) {
    console.error('Get city revenue error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   GET /api/billing
 * @desc    Get all billing records
 * @access  Admin only
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100
    const billings = await billingService.getAllBillings(limit)
    
    res.json({
      count: billings.length,
      billings
    })
  } catch (error: any) {
    console.error('Get all billings error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

export default router
