export interface Booking {
  bookingId: string
  userId: string
  bookingType: 'flight' | 'hotel' | 'car'
  bookingRef: string
  status: 'pending' | 'confirmed' | 'cancelled'
  checkInDate?: Date
  checkOutDate?: Date
  bookingDate: Date
  createdAt: Date
  updatedAt: Date
}

