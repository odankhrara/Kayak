import { Router, Request, Response } from 'express'
import { HotelService } from '../services/hotelService'
import { requireAuth, requireAdmin } from '@kayak/common/src/middleware/auth'

const router = Router()
const hotelService = new HotelService()

/**
 * @route   GET /api/hotels/search
 * @desc    Search hotels with filters
 * @access  Public
 * @query   city, state, checkIn, checkOut, guests, rooms, minPrice, maxPrice, minStars, maxStars, amenities, sortBy
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const filters = {
      city: req.query.city as string,
      state: req.query.state as string,
      checkIn: req.query.checkIn as string,
      checkOut: req.query.checkOut as string,
      guests: req.query.guests ? parseInt(req.query.guests as string) : undefined,
      rooms: req.query.rooms ? parseInt(req.query.rooms as string) : undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      minStars: req.query.minStars ? parseInt(req.query.minStars as string) : undefined,
      maxStars: req.query.maxStars ? parseInt(req.query.maxStars as string) : undefined,
      amenities: req.query.amenities ? (req.query.amenities as string).split(',') : undefined,
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      sortBy: req.query.sortBy as 'price' | 'rating' | 'stars',
      sortOrder: req.query.sortOrder as 'ASC' | 'DESC',
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50
    }

    const hotels = await hotelService.search(filters)
    
    res.json({
      count: hotels.length,
      filters: {
        city: filters.city,
        state: filters.state,
        checkIn: filters.checkIn,
        checkOut: filters.checkOut,
        guests: filters.guests || 1,
        rooms: filters.rooms || 1
      },
      hotels
    })
  } catch (error: any) {
    console.error('Hotel search error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   GET /api/hotels/:id
 * @desc    Get hotel by ID with details
 * @access  Public
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const hotel = await hotelService.getById(req.params.id)
    res.json(hotel)
  } catch (error: any) {
    console.error('Get hotel error:', error.message)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
})

/**
 * @route   GET /api/hotels/:id/availability
 * @desc    Check hotel room availability
 * @access  Public
 */
router.get('/:id/availability', async (req: Request, res: Response) => {
  try {
    const roomType = req.query.roomType as string || 'Standard'
    const roomCount = parseInt(req.query.rooms as string) || 1
    
    const availability = await hotelService.checkAvailability(
      req.params.id,
      roomType,
      roomCount
    )
    
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
 * @route   POST /api/hotels
 * @desc    Create a new hotel
 * @access  Admin only
 */
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const hotel = await hotelService.createHotel(req.body)
    
    res.status(201).json({
      message: 'Hotel created successfully',
      hotel
    })
  } catch (error: any) {
    console.error('Create hotel error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   POST /api/hotels/:id/rooms
 * @desc    Add room type to hotel
 * @access  Admin only
 */
router.post('/:id/rooms', requireAdmin, async (req: Request, res: Response) => {
  try {
    await hotelService.addRoom({
      hotel_id: req.params.id,
      ...req.body
    })
    
    res.status(201).json({
      message: 'Room type added successfully'
    })
  } catch (error: any) {
    console.error('Add room error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   POST /api/hotels/:id/amenities
 * @desc    Add amenity to hotel
 * @access  Admin only
 */
router.post('/:id/amenities', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { amenityName, isFree } = req.body
    
    if (!amenityName) {
      return res.status(400).json({ error: 'Amenity name is required' })
    }
    
    await hotelService.addAmenity(req.params.id, amenityName, isFree !== false)
    
    res.status(201).json({
      message: 'Amenity added successfully'
    })
  } catch (error: any) {
    console.error('Add amenity error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   PUT /api/hotels/:id
 * @desc    Update hotel
 * @access  Admin only
 */
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const hotel = await hotelService.updateHotel(req.params.id, req.body)
    
    res.json({
      message: 'Hotel updated successfully',
      hotel
    })
  } catch (error: any) {
    console.error('Update hotel error:', error.message)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(400).json({ error: error.message })
  }
})

/**
 * @route   DELETE /api/hotels/:id
 * @desc    Delete hotel
 * @access  Admin only
 */
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    await hotelService.deleteHotel(req.params.id)
    
    res.json({ message: 'Hotel deleted successfully' })
  } catch (error: any) {
    console.error('Delete hotel error:', error.message)
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
})

/**
 * @route   GET /api/hotels
 * @desc    Get all hotels
 * @access  Admin only
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100
    const hotels = await hotelService.getAllHotels(limit)
    
    res.json({
      count: hotels.length,
      hotels
    })
  } catch (error: any) {
    console.error('Get all hotels error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

export default router
