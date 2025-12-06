import { Router, Request, Response, NextFunction } from 'express'
import { bidRepository } from '../repositories/bidRepository'
import { sendKafkaMessage } from '@kayak/common/src/kafka/kafkaClient'
import { KAFKA_TOPICS } from '@kayak/common/src/kafka/topics'

const router = Router()

/**
 * POST /api/listings/bids - Create a new bid (Name Your Own Price)
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, itemType, itemId, originalPrice, bidAmount, notes, roomSelections, nights } = req.body

    if (!userId || !itemType || !itemId || !originalPrice || !bidAmount) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, itemType, itemId, originalPrice, bidAmount' 
      })
    }

    if (bidAmount <= 0 || bidAmount > originalPrice) {
      return res.status(400).json({ 
        error: 'Bid amount must be greater than 0 and less than or equal to the original price' 
      })
    }

    const bid = await bidRepository.createBid({
      userId,
      itemType,
      itemId,
      originalPrice: parseFloat(originalPrice),
      bidAmount: parseFloat(bidAmount),
      notes,
      roomSelections,
      nights
    })

    // Track bid event for analytics
    try {
      await sendKafkaMessage(KAFKA_TOPICS.USER_TRACKING, {
        log_type: 'bid_submitted',
        user_id: userId,
        item_type: itemType,
        item_id: itemId,
        original_price: originalPrice,
        bid_amount: bidAmount,
        bid_id: bid.bidId,
        discount_percent: ((originalPrice - bidAmount) / originalPrice * 100).toFixed(2),
        status: bid.status,
        timestamp: new Date().toISOString()
      })
    } catch (kafkaErr) {
      console.error('Failed to send bid tracking event:', kafkaErr)
    }

    res.status(201).json(bid)
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/listings/bids/my-bids - Get current user's bids
 */
router.get('/my-bids', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.query.userId as string
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' })
    }

    const bids = await bidRepository.getBidsByUser(userId)
    res.json(bids)
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/listings/bids/completable - Get user's accepted bids ready for booking
 */
router.get('/completable', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.query.userId as string
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' })
    }

    const bids = await bidRepository.getCompletableBidsByUser(userId)
    res.json(bids)
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/listings/bids/:bidId/validate - Validate a bid can be completed
 */
router.get('/:bidId/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bidId = parseInt(req.params.bidId)
    const userId = req.query.userId as string
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' })
    }

    const bid = await bidRepository.getAcceptedBidForCompletion(bidId, userId)
    
    if (!bid) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Bid not found, not accepted, expired, or already completed' 
      })
    }

    res.json({ 
      valid: true, 
      bid,
      message: 'Bid is valid for booking completion'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/listings/bids/item/:itemType/:itemId - Get bids for an item
 */
router.get('/item/:itemType/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemType, itemId } = req.params
    const bids = await bidRepository.getBidsByItem(itemType, itemId)
    res.json(bids)
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/listings/bids/stats - Get bid statistics (for analytics)
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await bidRepository.getBidStats()
    res.json(stats)
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/listings/bids/recent - Get recent bids (for dashboard)
 */
router.get('/recent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10
    const bids = await bidRepository.getRecentBids(limit)
    res.json(bids)
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/listings/bids/:bidId/complete - Mark bid as completed (after booking)
 */
router.put('/:bidId/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bidId = parseInt(req.params.bidId)
    const { bookingId } = req.body

    const bid = await bidRepository.getBidById(bidId)
    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' })
    }

    if (bid.status !== 'accepted') {
      return res.status(400).json({ error: 'Only accepted bids can be completed' })
    }

    await bidRepository.updateBidStatus(bidId, 'completed', bookingId)

    // Track completion event
    try {
      await sendKafkaMessage(KAFKA_TOPICS.USER_TRACKING, {
        log_type: 'bid_completed',
        user_id: bid.userId,
        bid_id: bidId,
        booking_id: bookingId,
        item_type: bid.itemType,
        item_id: bid.itemId,
        final_price: bid.bidAmount,
        savings: bid.originalPrice - bid.bidAmount,
        timestamp: new Date().toISOString()
      })
    } catch (kafkaErr) {
      console.error('Failed to send bid completion event:', kafkaErr)
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/listings/bids/expire - Expire old pending bids (called by cron/scheduler)
 */
router.post('/expire', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expiredCount = await bidRepository.expireOldBids()
    res.json({ expiredCount })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/listings/bids/:bidId - Get a single bid
 */
router.get('/:bidId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bidId = parseInt(req.params.bidId)
    const bid = await bidRepository.getBidById(bidId)
    
    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' })
    }

    res.json(bid)
  } catch (error) {
    next(error)
  }
})

export default router

