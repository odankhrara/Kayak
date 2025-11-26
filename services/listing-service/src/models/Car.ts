export interface Car {
  carId: string
  carType: string
  companyProvider: string
  model: string
  year: number
  transmissionType: string
  numberOfSeats: number
  dailyPrice: number
  rating?: number
  availabilityStatus: boolean
  createdAt: Date
  updatedAt: Date
}

