import { Router, Request, Response, NextFunction } from 'express'
import { reviewRepository } from '../repositories/reviewRepository'

const router = Router()

/**
 * POST /api/listings/reviews - Create a new review
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, itemType, itemId, bookingId, rating, title, comment } = req.body

    if (!userId || !itemType || !itemId || !rating) {
      return res.status(400).json({ error: 'Missing required fields: userId, itemType, itemId, rating' })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' })
    }

    const review = await reviewRepository.createReview({
      userId,
      itemType,
      itemId,
      bookingId,
      rating,
      title,
      comment
    })

    res.status(201).json(review)
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/listings/reviews/item/:itemType/:itemId - Get reviews for an item
 */
router.get('/item/:itemType/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemType, itemId } = req.params
    const reviews = await reviewRepository.getReviewsByItem(itemType, itemId)
    const stats = await reviewRepository.getAverageRating(itemType, itemId)
    const distribution = await reviewRepository.getRatingDistribution(itemType, itemId)

    res.json({
      reviews,
      stats: {
        ...stats,
        distribution
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/listings/reviews/user/:userId - Get reviews by user
 */
router.get('/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params
    const reviews = await reviewRepository.getReviewsByUser(userId)
    res.json(reviews)
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/listings/reviews/stats - Get review statistics (for analytics)
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await reviewRepository.getReviewStats()
    res.json(stats)
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/listings/reviews/all - Get all reviews (admin)
 */
router.get('/all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100
    const offset = parseInt(req.query.offset as string) || 0
    const reviews = await reviewRepository.getAllReviews(limit, offset)
    res.json(reviews)
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/listings/reviews/:reviewId/helpful - Mark review as helpful
 */
router.post('/:reviewId/helpful', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviewId = parseInt(req.params.reviewId)
    await reviewRepository.markHelpful(reviewId)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/listings/reviews/:reviewId - Delete a review
 */
router.delete('/:reviewId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviewId = parseInt(req.params.reviewId)
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'userId required' })
    }

    const deleted = await reviewRepository.deleteReview(reviewId, userId)
    if (!deleted) {
      return res.status(404).json({ error: 'Review not found or not authorized' })
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/listings/reviews/:reviewId - Get a single review
 */
router.get('/:reviewId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviewId = parseInt(req.params.reviewId)
    const review = await reviewRepository.getReviewById(reviewId)
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' })
    }

    res.json(review)
  } catch (error) {
    next(error)
  }
})

export default router

