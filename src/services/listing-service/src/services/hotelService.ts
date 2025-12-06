import { HotelRepository } from '../repositories/hotelRepository'
import { Hotel } from '../models/Hotel'
import { redisCache } from '@kayak/common/src/cache/redisCache'

// Cache version - increment this when query logic changes to invalidate old cache
// This ensures old cached results don't interfere with new query behavior
// v3: Fixed room filtering to respect guest capacity in displayed prices
const CACHE_VERSION = 'v3'

export class HotelService {
  private repository = new HotelRepository()

  /**
   * Get all unique city-state combinations for autocomplete
   */
  async getLocations(searchTerm?: string): Promise<{ city: string; state: string; hotelCount: number }[]> {
    return this.repository.getLocations(searchTerm)
  }

  /**
   * Validate date format and order
   */
  private validateDates(checkIn: string, checkOut: string): void {
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (checkInDate < today) {
      throw new Error('Check-in date must be today or in the future')
    }

    if (checkOutDate <= checkInDate) {
      throw new Error('Check-out date must be after check-in date')
    }

    // Calculate nights
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    if (nights > 30) {
      throw new Error('Cannot book more than 30 nights at once')
    }
  }

  /**
   * Search hotels with validation
   */
  async search(filters: {
    city?: string;
    state?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    rooms?: number;
    minPrice?: number;
    maxPrice?: number;
    minStars?: number;
    maxStars?: number;
    amenities?: string[];
    minRating?: number;
    sortBy?: 'price' | 'rating' | 'stars';
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
  }): Promise<any[]> {
    try {
      // Validate required fields
      if (!filters.city && !filters.state) {
        throw new Error('City or state is required for hotel search')
      }

      // Validate dates if provided
      if (filters.checkIn && filters.checkOut) {
        this.validateDates(filters.checkIn, filters.checkOut)
      }

      // Validate guest count
      if (filters.guests && filters.guests < 1) {
        throw new Error('Number of guests must be at least 1')
      }
      if (filters.guests && filters.guests > 20) {
        throw new Error('Cannot book for more than 20 guests at once')
      }

      // Validate room count
      if (filters.rooms && filters.rooms < 1) {
        throw new Error('Number of rooms must be at least 1')
      }
      if (filters.rooms && filters.rooms > 10) {
        throw new Error('Cannot book more than 10 rooms at once')
      }

      // Validate price range
      if (filters.minPrice && filters.minPrice < 0) {
        throw new Error('Minimum price cannot be negative')
      }
      if (filters.maxPrice && filters.maxPrice < 0) {
        throw new Error('Maximum price cannot be negative')
      }
      if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
        throw new Error('Minimum price cannot be greater than maximum price')
      }

      // Validate star rating
      if (filters.minStars && (filters.minStars < 1 || filters.minStars > 5)) {
        throw new Error('Star rating must be between 1 and 5')
      }
      if (filters.maxStars && (filters.maxStars < 1 || filters.maxStars > 5)) {
        throw new Error('Star rating must be between 1 and 5')
      }

      // Validate rating
      if (filters.minRating && (filters.minRating < 0 || filters.minRating > 5)) {
        throw new Error('Rating must be between 0 and 5')
      }

      // Generate cache key from filters (versioned to invalidate on code changes)
      const cacheKey = `hotels:search:${CACHE_VERSION}:${JSON.stringify(filters)}`
      
      // Try cache first
      const cachedHotels = await redisCache.get<any[]>(cacheKey)
      if (cachedHotels) {
        console.log(`✅ Cache HIT: ${cacheKey}`)
        return cachedHotels
      }

      console.log(`❌ Cache MISS: ${cacheKey}`)
      
      // Cache miss - query database
      const hotels = await this.repository.search(filters)

      // Only cache successful results with data
      if (hotels && hotels.length > 0) {
        await redisCache.set(cacheKey, hotels, 300)
        console.log(`💾 Cached ${hotels.length} hotels (TTL: 300s)`)
      }

      return hotels
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Get hotel by ID with details (with caching)
   */
  async getById(hotelId: string): Promise<any> {
    if (!hotelId || hotelId.trim().length === 0) {
      throw new Error('Hotel ID is required')
    }

    // Try cache first (versioned)
    const cacheKey = `hotel:${CACHE_VERSION}:${hotelId}`
    const cachedHotel = await redisCache.get<any>(cacheKey)
    if (cachedHotel) {
      return cachedHotel
    }

    // Cache miss - query database
    const hotel = await this.repository.getById(hotelId)
    if (!hotel) {
      throw new Error(`Hotel ${hotelId} not found`)
    }

    // Store in cache (10 minutes TTL)
    await redisCache.set(cacheKey, hotel, 600)

    return hotel
  }

  /**
   * Create a new hotel (Admin only)
   */
  async createHotel(hotelData: {
    hotel_id: string;
    hotel_name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    star_rating: number;
    description?: string;
    total_rooms: number;
    latitude?: number;
    longitude?: number;
  }): Promise<any> {
    try {
      // Validate required fields
      if (!hotelData.hotel_name || hotelData.hotel_name.trim().length === 0) {
        throw new Error('Hotel name is required')
      }
      if (!hotelData.city || hotelData.city.trim().length === 0) {
        throw new Error('City is required')
      }

      // Validate star rating
      if (hotelData.star_rating < 1 || hotelData.star_rating > 5) {
        throw new Error('Star rating must be between 1 and 5')
      }

      // Validate total rooms
      if (hotelData.total_rooms < 1) {
        throw new Error('Total rooms must be at least 1')
      }

      return await this.repository.create(hotelData)
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Update hotel (Admin only) - with cache invalidation
   */
  async updateHotel(hotelId: string, updates: any): Promise<any> {
    const hotel = await this.repository.getById(hotelId)
    if (!hotel) {
      throw new Error(`Hotel ${hotelId} not found`)
    }

    // Validate updates
    if (updates.starRating && (updates.starRating < 1 || updates.starRating > 5)) {
      throw new Error('Star rating must be between 1 and 5')
    }
    if (updates.totalRooms && updates.totalRooms < 1) {
      throw new Error('Total rooms must be at least 1')
    }

    // Update in database
    const updatedHotel = await this.repository.update(hotelId, updates)

    // Invalidate caches (versioned keys)
    await redisCache.del(`hotel:${CACHE_VERSION}:${hotelId}`)
    await redisCache.delPattern(`hotels:search:${CACHE_VERSION}:*`)
    console.log(`🔄 Cache invalidated for hotel ${hotelId}`)

    return updatedHotel
  }

  /**
   * Add room type to hotel (Admin only)
   */
  async addRoom(roomData: {
    hotel_id: string;
    room_type: string;
    price_per_night: number;
    max_guests: number;
    total_rooms: number;
    description?: string;
  }): Promise<void> {
    const hotel = await this.repository.getById(roomData.hotel_id)
    if (!hotel) {
      throw new Error(`Hotel ${roomData.hotel_id} not found`)
    }

    if (roomData.price_per_night <= 0) {
      throw new Error('Price per night must be greater than 0')
    }
    if (roomData.max_guests < 1) {
      throw new Error('Max guests must be at least 1')
    }
    if (roomData.total_rooms < 1) {
      throw new Error('Total rooms must be at least 1')
    }

    await this.repository.addRoom(roomData)
  }

  /**
   * Add amenity to hotel (Admin only)
   */
  async addAmenity(hotelId: string, amenityName: string, isFree: boolean = true): Promise<void> {
    const hotel = await this.repository.getById(hotelId)
    if (!hotel) {
      throw new Error(`Hotel ${hotelId} not found`)
    }

    if (!amenityName || amenityName.trim().length === 0) {
      throw new Error('Amenity name is required')
    }

    await this.repository.addAmenity(hotelId, amenityName, isFree)
  }

  /**
   * Check room availability
   */
  async checkAvailability(hotelId: string, roomType: string, roomCount: number): Promise<{
    available: boolean;
    availableRooms: number;
    requestedRooms: number;
  }> {
    const hotel = await this.repository.getById(hotelId)
    if (!hotel) {
      throw new Error(`Hotel ${hotelId} not found`)
    }

    const room = hotel.rooms.find((r: any) => r.roomType === roomType)
    if (!room) {
      throw new Error(`Room type ${roomType} not found in this hotel`)
    }

    return {
      available: room.availableRooms >= roomCount,
      availableRooms: room.availableRooms,
      requestedRooms: roomCount
    }
  }

  /**
   * Get all hotels (Admin only)
   */
  async getAllHotels(limit: number = 100): Promise<any[]> {
    if (limit < 1 || limit > 1000) {
      throw new Error('Limit must be between 1 and 1000')
    }

    return await this.repository.getAll(limit)
  }

  /**
   * Delete hotel (Admin only) - with cache invalidation
   */
  async deleteHotel(hotelId: string): Promise<void> {
    const hotel = await this.repository.getById(hotelId)
    if (!hotel) {
      throw new Error(`Hotel ${hotelId} not found`)
    }

    // Delete from database
    await this.repository.delete(hotelId)

    // Invalidate caches (versioned keys)
    await redisCache.del(`hotel:${CACHE_VERSION}:${hotelId}`)
    await redisCache.delPattern(`hotels:search:${CACHE_VERSION}:*`)
    console.log(`🗑️  Cache invalidated for deleted hotel ${hotelId}`)
  }
}
