import { Router, Request, Response } from 'express'
import { CarService } from '../services/carService'
import { requireAuth, requireAdmin } from '@kayak/common/src/middleware/auth'

const router = Router()
const carService = new CarService()

/**
 * @route   GET /api/cars/search
 * @desc    Search cars with filters
 * @access  Public
 * @query   location, pickupDate, returnDate, carType, transmission, minPrice, maxPrice, minSeats, company, sortBy
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const filters = {
      location: req.query.location as string,
      pickupDate: req.query.pickupDate as string,
      returnDate: req.query.returnDate as string,
      carType: req.query.carType as 'sedan' | 'suv' | 'compact' | 'luxury' | 'van' | 'truck',
      transmission: req.query.transmission as 'automatic' | 'manual',
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      minSeats: req.query.minSeats ? parseInt(req.query.minSeats as string) : undefined,
      company: req.query.company as string,
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      sortBy: req.query.sortBy as 'price' | 'rating',
      sortOrder: req.query.sortOrder as 'ASC' | 'DESC',
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50
    }

    const cars = await carService.search(filters)
    
    res.json({
      count: cars.length,
      filters: {
        location: filters.location,
        pickupDate: filters.pickupDate,
        returnDate: filters.returnDate,
        carType: filters.carType
      },
      cars
    })
  } catch (error: any) {
    console.error('Car search error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   GET /api/cars/:id
 * @desc    Get car by ID
 * @access  Public
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const car = await carService.getById(req.params.id)
    res.json(car)
  } catch (error: any) {
    console.error('Get car error:', error.message)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
})

/**
 * @route   GET /api/cars/:id/availability
 * @desc    Check car availability
 * @access  Public
 */
router.get('/:id/availability', async (req: Request, res: Response) => {
  try {
    const availability = await carService.checkAvailability(req.params.id)
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
 * @route   POST /api/cars/:id/calculate-cost
 * @desc    Calculate rental cost
 * @access  Public
 */
router.post('/:id/calculate-cost', async (req: Request, res: Response) => {
  try {
    const { pickupDate, returnDate } = req.body
    
    if (!pickupDate || !returnDate) {
      return res.status(400).json({ 
        error: 'Pickup date and return date are required' 
      })
    }

    const car = await carService.getById(req.params.id)
    const cost = carService.calculateRentalCost(
      car.dailyRentalPrice,
      pickupDate,
      returnDate
    )
    
    res.json({
      carId: req.params.id,
      pickupDate,
      returnDate,
      ...cost
    })
  } catch (error: any) {
    console.error('Calculate cost error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   POST /api/cars
 * @desc    Create a new car
 * @access  Admin only
 */
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const car = await carService.createCar(req.body)
    
    res.status(201).json({
      message: 'Car created successfully',
      car
    })
  } catch (error: any) {
    console.error('Create car error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   PUT /api/cars/:id
 * @desc    Update car
 * @access  Admin only
 */
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const car = await carService.updateCar(req.params.id, req.body)
    
    res.json({
      message: 'Car updated successfully',
      car
    })
  } catch (error: any) {
    console.error('Update car error:', error.message)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   DELETE /api/cars/:id
 * @desc    Delete car
 * @access  Admin only
 */
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    await carService.deleteCar(req.params.id)
    
    res.json({ message: 'Car deleted successfully' })
  } catch (error: any) {
    console.error('Delete car error:', error.message)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
})

/**
 * @route   GET /api/cars
 * @desc    Get all cars
 * @access  Admin only
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100
    const cars = await carService.getAllCars(limit)
    
    res.json({
      count: cars.length,
      cars
    })
  } catch (error: any) {
    console.error('Get all cars error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

export default router
