import { Router, Request, Response } from 'express'
import { FlightService } from '../services/flightService'
import { requireAuth, requireAdmin } from '@kayak/common/src/middleware/auth'

const router = Router()
const flightService = new FlightService()

/**
 * @route   GET /api/flights/search
 * @desc    Search flights with filters
 * @access  Public
 * @query   origin, destination, departureDate, returnDate, passengers, class, minPrice, maxPrice, airline, sortBy, sortOrder
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const filters = {
      origin: req.query.origin as string,
      destination: req.query.destination as string,
      departureDate: req.query.departureDate as string,
      returnDate: req.query.returnDate as string,
      passengers: req.query.passengers ? parseInt(req.query.passengers as string) : undefined,
      class: req.query.class as 'economy' | 'business' | 'first',
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      airline: req.query.airline as string,
      departureTimeMin: req.query.departureTimeMin as string,
      departureTimeMax: req.query.departureTimeMax as string,
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      sortBy: req.query.sortBy as 'price' | 'duration' | 'rating' | 'departure_time',
      sortOrder: req.query.sortOrder as 'ASC' | 'DESC',
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50
    }

    const flights = await flightService.search(filters)
    
    res.json({
      count: flights.length,
      filters: {
        origin: filters.origin,
        destination: filters.destination,
        departureDate: filters.departureDate,
        passengers: filters.passengers || 1,
        class: filters.class || 'economy'
      },
      flights
    })
  } catch (error: any) {
    console.error('Flight search error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   GET /api/flights/:id
 * @desc    Get flight by ID
 * @access  Public
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const flight = await flightService.getById(req.params.id)
    res.json(flight)
  } catch (error: any) {
    console.error('Get flight error:', error.message)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
})

/**
 * @route   GET /api/flights/:id/availability
 * @desc    Check flight availability
 * @access  Public
 */
router.get('/:id/availability', async (req: Request, res: Response) => {
  try {
    const passengers = parseInt(req.query.passengers as string) || 1
    const availability = await flightService.checkAvailability(req.params.id, passengers)
    
    res.json(availability)
  } catch (error: any) {
    console.error('Check availability error:', error.message)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   POST /api/flights
 * @desc    Create a new flight
 * @access  Admin only
 */
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const flight = await flightService.createFlight(req.body)
    
    res.status(201).json({
      message: 'Flight created successfully',
      flight
    })
  } catch (error: any) {
    console.error('Create flight error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   PUT /api/flights/:id
 * @desc    Update flight
 * @access  Admin only
 */
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const flight = await flightService.updateFlight(req.params.id, req.body)
    
    res.json({
      message: 'Flight updated successfully',
      flight
    })
  } catch (error: any) {
    console.error('Update flight error:', error.message)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   DELETE /api/flights/:id
 * @desc    Delete flight
 * @access  Admin only
 */
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    await flightService.deleteFlight(req.params.id)
    
    res.json({ message: 'Flight deleted successfully' })
  } catch (error: any) {
    console.error('Delete flight error:', error.message)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
})

/**
 * @route   GET /api/flights
 * @desc    Get all flights
 * @access  Admin only
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100
    const flights = await flightService.getAllFlights(limit)
    
    res.json({
      count: flights.length,
      flights
    })
  } catch (error: any) {
    console.error('Get all flights error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

export default router

