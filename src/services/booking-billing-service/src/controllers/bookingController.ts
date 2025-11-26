import { Router, Request, Response } from 'express'
import { requireAuth, requireAdmin } from '@kayak/common/src/middleware/auth'
import { BookingService } from '../services/bookingService'

const router = Router()
const bookingService = new BookingService()

/**
 * @route   POST /api/bookings/create
 * @desc    Create a booking with payment (full transaction)
 * @access  Private
 */
router.post('/create', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId
    
    // Validate required fields
    const { 
      bookingType, 
      entityId, 
      quantity, 
      checkInDate, 
      checkOutDate, 
      totalAmount, 
      paymentMethod, 
      paymentDetails 
    } = req.body

    if (!bookingType || !entityId || !quantity || !checkInDate || !checkOutDate || !totalAmount || !paymentMethod || !paymentDetails) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['bookingType', 'entityId', 'quantity', 'checkInDate', 'checkOutDate', 'totalAmount', 'paymentMethod', 'paymentDetails']
      })
    }

    // Create booking with payment (full transaction with rollback)
    const result = await bookingService.createBookingWithPayment({
      userId,
      bookingType,
      entityId,
      quantity,
      checkInDate,
      checkOutDate,
      totalAmount,
      paymentMethod,
      paymentDetails
    })

    res.status(201).json(result)
  } catch (error: any) {
    console.error('Create booking error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.getById(req.params.id)
    
    // Check if user owns this booking or is admin
    const requestingUserId = (req as any).user.userId
    const isAdmin = (req as any).user.isAdmin
    
    if (booking.userId !== requestingUserId && !isAdmin) {
      return res.status(403).json({ 
        error: 'You do not have permission to view this booking' 
      })
    }

    res.json(booking)
  } catch (error: any) {
    console.error('Get booking error:', error.message)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
})

/**
 * @route   GET /api/bookings/user/:userId
 * @desc    Get user's booking history
 * @access  Private (own bookings) or Admin
 */
router.get('/user/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const requestingUserId = (req as any).user.userId
    const targetUserId = req.params.userId
    const isAdmin = (req as any).user.isAdmin

    // Users can only view their own bookings unless they're admin
    if (requestingUserId !== targetUserId && !isAdmin) {
      return res.status(403).json({ 
        error: 'You do not have permission to view these bookings' 
      })
    }

    const filter = req.query.filter as 'past' | 'current' | 'future' | undefined
    const bookings = await bookingService.getUserBookings(targetUserId, filter)
    
    res.json({
      userId: targetUserId,
      filter: filter || 'all',
      count: bookings.length,
      bookings
    })
  } catch (error: any) {
    console.error('Get user bookings error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

/**
 * @route   POST /api/bookings/:id/cancel
 * @desc    Cancel booking with refund
 * @access  Private (own booking) or Admin
 */
router.post('/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId
    const bookingId = req.params.id
    const reason = req.body.reason

    const result = await bookingService.cancelBooking(bookingId, userId, reason)
    
    res.json(result)
  } catch (error: any) {
    console.error('Cancel booking error:', error.message)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    if (error.message.includes('permission')) {
      return res.status(403).json({ error: error.message })
    }
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   PUT /api/bookings/:id/status
 * @desc    Update booking status
 * @access  Admin only
 */
router.put('/:id/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' })
    }

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      })
    }

    const booking = await bookingService.updateStatus(req.params.id, status)
    
    res.json({
      message: 'Booking status updated successfully',
      booking
    })
  } catch (error: any) {
    console.error('Update status error:', error.message)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings
 * @access  Admin only
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100
    const bookings = await bookingService.getAllBookings(limit)
    
    res.json({
      count: bookings.length,
      bookings
    })
  } catch (error: any) {
    console.error('Get all bookings error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

export default router

