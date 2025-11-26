import { Router, Request, Response } from 'express'
import { requireAuth } from '@kayak/common/src/middleware/auth'
import { BillingService } from '../services/billingService'

const router = Router()
const billingService = new BillingService()

router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const billing = await billingService.processPayment(req.body)
    res.status(201).json(billing)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/booking/:bookingId', requireAuth, async (req: Request, res: Response) => {
  try {
    const billing = await billingService.getByBookingId(req.params.bookingId)
    if (!billing) {
      return res.status(404).json({ error: 'Billing not found' })
    }
    res.json(billing)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router

