import { Router, Request, Response } from 'express'
import { FlightService } from '../services/flightService'

const router = Router()
const flightService = new FlightService()

router.get('/search', async (req: Request, res: Response) => {
  try {
    const flights = await flightService.search(req.query as any)
    res.json(flights)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const flight = await flightService.getById(req.params.id)
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' })
    }
    res.json(flight)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router

