import mysqlPool from '@kayak/common/src/db/mysqlPool'
import { Hotel } from '../models/Hotel'

export class HotelRepository {
  /**
   * Get all unique city-state combinations for autocomplete
   */
  async getLocations(searchTerm?: string): Promise<{ city: string; state: string; hotelCount: number }[]> {
    let query = `
      SELECT city, state, COUNT(*) as hotel_count
      FROM hotels
      WHERE status = 'active'
    `
    const params: any[] = []

    if (searchTerm) {
      query += ` AND (LOWER(city) LIKE LOWER(?) OR LOWER(state) LIKE LOWER(?))`
      params.push(`%${searchTerm}%`, `%${searchTerm}%`)
    }

    query += ` GROUP BY city, state ORDER BY hotel_count DESC, city ASC LIMIT 50`

    const [rows] = await mysqlPool.query(query, params)
    return (rows as any[]).map(row => ({
      city: row.city,
      state: row.state,
      hotelCount: row.hotel_count
    }))
  }
  /**
   * Search hotels with comprehensive filters including room availability
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
    // Base query with hotels and min room price
    let query = `
      SELECT DISTINCT h.*,
             MIN(r.price_per_night) as min_price_per_night,
             MAX(r.price_per_night) as max_price_per_night
      FROM hotels h
      INNER JOIN hotel_rooms r ON h.hotel_id = r.hotel_id
      WHERE h.status = 'active' AND r.available_rooms > 0
    `
    const params: any[] = []

    // City filter - use LIKE for partial matching and case-insensitive
    // Also handle common city aliases (e.g., "New York" -> "NYC")
    if (filters.city) {
      const cityLower = filters.city.toLowerCase().trim()
      
      // City alias mapping for common cases
      const cityAliases: { [key: string]: string[] } = {
        'new york': ['nyc', 'new york', 'newyork'],
        'los angeles': ['la', 'los angeles'],
        'san francisco': ['sf', 'san francisco'],
        'mumbai': ['bombay', 'mumbai'],
        'delhi': ['new delhi', 'delhi']
      }
      
      // Get aliases for the search city
      let searchTerms = [cityLower]
      for (const [key, aliases] of Object.entries(cityAliases)) {
        if (cityLower.includes(key) || aliases.some(a => cityLower.includes(a))) {
          searchTerms = [...new Set([...searchTerms, ...aliases])]
          break
        }
      }
      
      // Build OR conditions for all search terms
      const conditions: string[] = []
      for (const term of searchTerms) {
        conditions.push('(LOWER(h.city) LIKE LOWER(?) OR LOWER(h.city) LIKE LOWER(?) OR LOWER(h.city) LIKE LOWER(?))')
        params.push(`%${term}%`)  // Contains
        params.push(`${term}%`)    // Starts with
        params.push(`%${term}`)    // Ends with
      }
      
      query += ` AND (${conditions.join(' OR ')})`
    }
    // State filter is optional - removed from required filters
    if (filters.state) {
      query += ' AND h.state = ?'
      params.push(filters.state)
    }

    // Guest/Room requirements
    if (filters.guests) {
      query += ' AND r.max_guests >= ?'
      params.push(filters.guests)
    }
    if (filters.rooms) {
      query += ' AND r.available_rooms >= ?'
      params.push(filters.rooms || 1)
    }

    // Star rating filters
    if (filters.minStars) {
      query += ' AND h.star_rating >= ?'
      params.push(filters.minStars)
    }
    if (filters.maxStars) {
      query += ' AND h.star_rating <= ?'
      params.push(filters.maxStars)
    }

    // Rating filter
    if (filters.minRating) {
      query += ' AND h.rating >= ?'
      params.push(filters.minRating)
    }

    // Amenity filters
    if (filters.amenities && filters.amenities.length > 0) {
      query += ` AND EXISTS (
        SELECT 1 FROM hotel_amenities a 
        WHERE a.hotel_id = h.hotel_id 
        AND a.amenity_name IN (${filters.amenities.map(() => '?').join(',')})
        GROUP BY a.hotel_id
        HAVING COUNT(DISTINCT a.amenity_name) = ?
      )`
      params.push(...filters.amenities, filters.amenities.length)
    }

    // Group by hotel
    query += ' GROUP BY h.hotel_id'

    // Price filters (applied after grouping)
    // Filter by the CHEAPEST available room price at each hotel
    // This way, if a hotel has a $125 room AND a $300 suite, 
    // filtering for $50-$150 will still show the hotel (for the $125 room)
    if (filters.minPrice || filters.maxPrice) {
      const havingConditions: string[] = []
      
      if (filters.minPrice) {
        havingConditions.push('MIN(r.price_per_night) >= ?')
        params.push(filters.minPrice)
      }
      if (filters.maxPrice) {
        // Use MIN price for maxPrice filter - show hotels that have at least one room <= maxPrice
        havingConditions.push('MIN(r.price_per_night) <= ?')
        params.push(filters.maxPrice)
      }
      
      if (havingConditions.length > 0) {
        query += ' HAVING ' + havingConditions.join(' AND ')
      }
    }

    // Sorting
    const sortBy = filters.sortBy === 'price' ? 'min_price_per_night' :
                   filters.sortBy === 'stars' ? 'h.star_rating' :
                   filters.sortBy === 'rating' ? 'h.rating' :
                   'h.rating'
    const sortOrder = filters.sortOrder || 'DESC'
    query += ` ORDER BY ${sortBy} ${sortOrder}`

    // Limit
    if (filters.limit && filters.limit > 0) {
      query += ` LIMIT ${parseInt(String(filters.limit))}`
    }

    const [rows] = await mysqlPool.query(query, params)
    
    // Fetch rooms and amenities for each hotel
    // Pass guest filter to only show rooms that can accommodate the requested guests
    const hotels = []
    for (const row of rows as any[]) {
      const hotel = await this.getHotelWithDetails(row.hotel_id, filters.guests)
      if (hotel) {
        hotels.push({
          ...hotel,
          minPricePerNight: parseFloat(row.min_price_per_night),
          maxPricePerNight: parseFloat(row.max_price_per_night)
        })
      }
    }

    return hotels
  }

  /**
   * Get hotel by ID with all rooms and amenities
   */
  async getById(hotelId: string): Promise<any | null> {
    return this.getHotelWithDetails(hotelId)
  }

  /**
   * Get hotel with complete details (rooms and amenities)
   * @param hotelId - Hotel ID
   * @param minGuests - Optional minimum guest capacity filter for rooms
   */
  private async getHotelWithDetails(hotelId: string, minGuests?: number): Promise<any | null> {
    // Get hotel basic info
    const [hotelRows] = await mysqlPool.query(
      'SELECT * FROM hotels WHERE hotel_id = ?',
      [hotelId]
    )
    
    if ((hotelRows as any[]).length === 0) return null
    const hotel = (hotelRows as any[])[0]

    // Get rooms - filter by guest capacity if specified
    let roomQuery = 'SELECT * FROM hotel_rooms WHERE hotel_id = ?'
    const roomParams: any[] = [hotelId]
    
    if (minGuests && minGuests > 0) {
      roomQuery += ' AND max_guests >= ?'
      roomParams.push(minGuests)
    }
    roomQuery += ' ORDER BY price_per_night ASC'
    
    const [roomRows] = await mysqlPool.query(roomQuery, roomParams)

    // Get amenities
    const [amenityRows] = await mysqlPool.query(
      'SELECT amenity_name, is_free FROM hotel_amenities WHERE hotel_id = ?',
      [hotelId]
    )

    return {
      hotelId: hotel.hotel_id,
      hotelName: hotel.hotel_name,
      address: hotel.address,
      city: hotel.city,
      state: hotel.state,
      zipCode: hotel.zip_code,
      starRating: hotel.star_rating,
      description: hotel.description,
      totalRooms: hotel.total_rooms,
      rating: hotel.rating ? parseFloat(hotel.rating) : 0,
      reviewsCount: hotel.reviews_count || 0,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      status: hotel.status,
      rooms: (roomRows as any[]).map(r => ({
        roomId: r.room_id,
        roomType: r.room_type,
        pricePerNight: parseFloat(r.price_per_night),
        maxGuests: r.max_guests,
        totalRooms: r.total_rooms,
        availableRooms: r.available_rooms,
        description: r.description
      })),
      amenities: (amenityRows as any[]).map(a => ({
        name: a.amenity_name,
        isFree: a.is_free
      })),
      createdAt: hotel.created_at,
      updatedAt: hotel.updated_at
    }
  }

  /**
   * Create a new hotel (Admin only)
   */
  async create(hotelData: {
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
    await mysqlPool.query(
      `INSERT INTO hotels (
        hotel_id, hotel_name, address, city, state, zip_code,
        star_rating, description, total_rooms, latitude, longitude, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        hotelData.hotel_id,
        hotelData.hotel_name,
        hotelData.address,
        hotelData.city,
        hotelData.state,
        hotelData.zip_code,
        hotelData.star_rating,
        hotelData.description || null,
        hotelData.total_rooms,
        hotelData.latitude || null,
        hotelData.longitude || null
      ]
    )

    return this.getById(hotelData.hotel_id)
  }

  /**
   * Update hotel (Admin only)
   */
  async update(hotelId: string, updates: any): Promise<any> {
    const fields: string[] = []
    const values: any[] = []

    const fieldMap: any = {
      hotelName: 'hotel_name',
      address: 'address',
      city: 'city',
      state: 'state',
      zipCode: 'zip_code',
      starRating: 'star_rating',
      description: 'description',
      totalRooms: 'total_rooms',
      status: 'status'
    }

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'hotelId' && value !== undefined) {
        const dbField = fieldMap[key] || key
        fields.push(`${dbField} = ?`)
        values.push(value)
      }
    })

    if (fields.length === 0) {
      return this.getById(hotelId)
    }

    values.push(hotelId)
    await mysqlPool.query(
      `UPDATE hotels SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE hotel_id = ?`,
      values
    )

    return this.getById(hotelId)
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
    await mysqlPool.query(
      `INSERT INTO hotel_rooms (hotel_id, room_type, price_per_night, max_guests, total_rooms, available_rooms, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        roomData.hotel_id,
        roomData.room_type,
        roomData.price_per_night,
        roomData.max_guests,
        roomData.total_rooms,
        roomData.total_rooms, // Initially all available
        roomData.description || null
      ]
    )
  }

  /**
   * Add amenity to hotel (Admin only)
   */
  async addAmenity(hotelId: string, amenityName: string, isFree: boolean = true): Promise<void> {
    await mysqlPool.query(
      'INSERT INTO hotel_amenities (hotel_id, amenity_name, is_free) VALUES (?, ?, ?)',
      [hotelId, amenityName, isFree]
    )
  }

  /**
   * Decrease room availability when booking
   */
  async decreaseRoomAvailability(hotelId: string, roomType: string, roomCount: number, connection?: any): Promise<void> {
    const conn = connection || mysqlPool

    // Check availability
    const [rows] = await conn.execute(
      'SELECT available_rooms FROM hotel_rooms WHERE hotel_id = ? AND room_type = ? FOR UPDATE',
      [hotelId, roomType]
    )

    const room = (rows as any[])[0]
    if (!room) {
      throw new Error('Room type not found')
    }

    if (room.available_rooms < roomCount) {
      throw new Error(`Not enough rooms available. Only ${room.available_rooms} rooms left.`)
    }

    // Decrease availability
    await conn.execute(
      'UPDATE hotel_rooms SET available_rooms = available_rooms - ? WHERE hotel_id = ? AND room_type = ?',
      [roomCount, hotelId, roomType]
    )
  }

  /**
   * Increase room availability when booking cancelled
   */
  async increaseRoomAvailability(hotelId: string, roomType: string, roomCount: number, connection?: any): Promise<void> {
    const conn = connection || mysqlPool

    await conn.execute(
      'UPDATE hotel_rooms SET available_rooms = available_rooms + ? WHERE hotel_id = ? AND room_type = ? AND available_rooms < total_rooms',
      [roomCount, hotelId, roomType]
    )
  }

  /**
   * Get all hotels for admin
   */
  async getAll(limit: number = 100): Promise<any[]> {
    const [rows] = await mysqlPool.query(
      'SELECT * FROM hotels ORDER BY created_at DESC LIMIT ?',
      [limit]
    )

    const hotels = []
    for (const row of rows as any[]) {
      const hotel = await this.getHotelWithDetails(row.hotel_id)
      if (hotel) hotels.push(hotel)
    }

    return hotels
  }

  /**
   * Delete hotel (Admin only)
   */
  async delete(hotelId: string): Promise<void> {
    // CASCADE will delete rooms and amenities
    await mysqlPool.query('DELETE FROM hotels WHERE hotel_id = ?', [hotelId])
  }
}

