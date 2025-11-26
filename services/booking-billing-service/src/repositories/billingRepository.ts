import mysqlPool from '@kayak/common/src/db/mysqlPool'
import { Billing } from '../models/Billing'

export class BillingRepository {
  async create(billing: Omit<Billing, 'billingId' | 'createdAt' | 'updatedAt'>): Promise<Billing> {
    const [result] = await mysqlPool.execute(
      `INSERT INTO billing (user_id, booking_id, booking_type, amount, payment_method, status, transaction_date, invoice_details, receipt_details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        billing.userId,
        billing.bookingId,
        billing.bookingType,
        billing.amount,
        billing.paymentMethod,
        billing.status,
        billing.transactionDate,
        JSON.stringify(billing.invoiceDetails || {}),
        JSON.stringify(billing.receiptDetails || {})
      ]
    )
    const insertId = (result as any).insertId
    return this.getById(insertId.toString())
  }

  async getById(billingId: string): Promise<Billing> {
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM billing WHERE billing_id = ?',
      [billingId]
    )
    const billings = rows as any[]
    return this.mapRowToBilling(billings[0])
  }

  async getByBookingId(bookingId: string): Promise<Billing | null> {
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM billing WHERE booking_id = ?',
      [bookingId]
    )
    const billings = rows as any[]
    if (billings.length === 0) return null
    return this.mapRowToBilling(billings[0])
  }

  private mapRowToBilling(row: any): Billing {
    return {
      billingId: row.billing_id.toString(),
      userId: row.user_id.toString(),
      bookingId: row.booking_id.toString(),
      bookingType: row.booking_type,
      amount: parseFloat(row.amount),
      paymentMethod: row.payment_method,
      status: row.status,
      transactionDate: row.transaction_date,
      invoiceDetails: row.invoice_details ? JSON.parse(row.invoice_details) : undefined,
      receiptDetails: row.receipt_details ? JSON.parse(row.receipt_details) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

