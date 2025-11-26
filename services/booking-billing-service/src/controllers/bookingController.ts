import { Router, Request, Response } from 'express'
import { requireAuth } from '@kayak/common/src/middleware/auth'
import { BookingService } from '../services/bookingService'

const router = Router()
const bookingService = new BookingService()

router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.createBooking(req.body)
    res.status(201).json(booking)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/user/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const bookings = await bookingService.getUserBookings(req.params.userId)
    res.json(bookings)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.getById(req.params.id)
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }
    res.json(booking)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router

