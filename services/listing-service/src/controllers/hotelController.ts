import { Router, Request, Response } from 'express'
import { HotelService } from '../services/hotelService'

const router = Router()
const hotelService = new HotelService()

router.get('/search', async (req: Request, res: Response) => {
  try {
    const hotels = await hotelService.search(req.query as any)
    res.json(hotels)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const hotel = await hotelService.getById(req.params.id)
    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found' })
    }
    res.json(hotel)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router

