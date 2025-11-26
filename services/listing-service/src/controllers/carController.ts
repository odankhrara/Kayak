import { Router, Request, Response } from 'express'
import { CarService } from '../services/carService'

const router = Router()
const carService = new CarService()

router.get('/search', async (req: Request, res: Response) => {
  try {
    const cars = await carService.search(req.query as any)
    res.json(cars)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const car = await carService.getById(req.params.id)
    if (!car) {
      return res.status(404).json({ error: 'Car not found' })
    }
    res.json(car)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router

