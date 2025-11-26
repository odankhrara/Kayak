export interface Hotel {
  hotelId: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  starRating: number
  numberOfRooms: number
  roomTypes: string[]
  pricePerNight: number
  amenities: string[]
  rating?: number
  createdAt: Date
  updatedAt: Date
}

