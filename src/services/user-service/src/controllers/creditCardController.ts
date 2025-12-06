import { Router, Request, Response, NextFunction } from 'express'
import { creditCardRepository } from '../repositories/creditCardRepository'
import { requireAuth } from '@kayak/common'

const router = Router()

/**
 * GET /api/users/:userId/credit-cards
 * Get all credit cards for a user
 */
router.get('/:userId/credit-cards', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params
    const authUserId = (req as any).user?.userId

    // Users can only view their own cards
    if (userId !== authUserId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const cards = await creditCardRepository.getByUserId(userId)
    res.json({ cards, count: cards.length })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/users/:userId/credit-cards
 * Add a new credit card
 */
router.post('/:userId/credit-cards', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params
    const authUserId = (req as any).user?.userId

    if (userId !== authUserId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const { cardNumber, cardHolderName, expiryMonth, expiryYear, cvv, cardType, isDefault } = req.body

    // Validate required fields
    if (!cardNumber || !cardHolderName || !expiryMonth || !expiryYear || !cvv) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['cardNumber', 'cardHolderName', 'expiryMonth', 'expiryYear', 'cvv']
      })
    }

    // Basic card number validation
    const cleanCardNumber = cardNumber.replace(/\s/g, '')
    if (!/^\d{13,19}$/.test(cleanCardNumber)) {
      return res.status(400).json({ error: 'Invalid card number' })
    }

    // Expiry validation
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      return res.status(400).json({ error: 'Card has expired' })
    }

    const card = await creditCardRepository.create({
      userId,
      cardNumber: cleanCardNumber,
      cardHolderName,
      expiryMonth: parseInt(expiryMonth),
      expiryYear: parseInt(expiryYear),
      cvv,
      cardType,
      isDefault
    })

    res.status(201).json({ 
      message: 'Card added successfully',
      card 
    })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/users/:userId/credit-cards/:cardId
 * Delete a credit card
 */
router.delete('/:userId/credit-cards/:cardId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, cardId } = req.params
    const authUserId = (req as any).user?.userId

    if (userId !== authUserId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const success = await creditCardRepository.delete(parseInt(cardId), userId)
    
    if (!success) {
      return res.status(404).json({ error: 'Card not found' })
    }

    res.json({ message: 'Card removed successfully' })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/users/:userId/credit-cards/:cardId/default
 * Set a card as default
 */
router.put('/:userId/credit-cards/:cardId/default', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, cardId } = req.params
    const authUserId = (req as any).user?.userId

    if (userId !== authUserId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const success = await creditCardRepository.setDefault(parseInt(cardId), userId)
    
    if (!success) {
      return res.status(404).json({ error: 'Card not found' })
    }

    res.json({ message: 'Default card updated' })
  } catch (error) {
    next(error)
  }
})

export default router

