import { BillingRepository } from '../repositories/billingRepository'
import { Billing } from '../models/Billing'

export class BillingService {
  private repository = new BillingRepository()

  async processPayment(billingData: Omit<Billing, 'billingId' | 'transactionDate' | 'createdAt' | 'updatedAt'>): Promise<Billing> {
    // Simulate payment processing
    const billing = await this.repository.create({
      ...billingData,
      transactionDate: new Date(),
      status: 'completed'
    })
    
    // Publish payment event to Kafka
    // TODO: Implement Kafka producer
    
    return billing
  }

  async getByBookingId(bookingId: string): Promise<Billing | null> {
    return this.repository.getByBookingId(bookingId)
  }
}

