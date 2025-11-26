export interface Billing {
  billingId: string
  userId: string
  bookingId: string
  bookingType: 'flight' | 'hotel' | 'car'
  amount: number
  paymentMethod: string
  status: 'pending' | 'completed' | 'failed'
  transactionDate: Date
  invoiceDetails?: any
  receiptDetails?: any
  createdAt: Date
  updatedAt: Date
}

