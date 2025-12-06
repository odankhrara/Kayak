import mysqlPool from '@kayak/common/src/db/mysqlPool'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export interface CreditCard {
  cardId: number
  userId: string
  cardNumberLast4: string
  cardHolderName: string
  expiryMonth: number
  expiryYear: number
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover'
  isDefault: boolean
  createdAt: Date
}

export interface CreateCreditCardInput {
  userId: string
  cardNumber: string
  cardHolderName: string
  expiryMonth: number
  expiryYear: number
  cvv: string
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover'
  isDefault?: boolean
}

class CreditCardRepository {
  /**
   * Get all credit cards for a user (masked)
   */
  async getByUserId(userId: string): Promise<CreditCard[]> {
    const [rows] = await mysqlPool.query<RowDataPacket[]>(
      `SELECT 
        card_id, user_id, 
        RIGHT(card_number_encrypted, 4) as card_number_last4,
        card_holder_name, expiry_month, expiry_year, 
        card_type, is_default, created_at
       FROM credit_cards 
       WHERE user_id = ?
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    )
    return rows.map(this.mapRowToCard)
  }

  /**
   * Add a new credit card
   */
  async create(input: CreateCreditCardInput): Promise<CreditCard> {
    // If this is set as default, unset other defaults first
    if (input.isDefault) {
      await mysqlPool.execute(
        'UPDATE credit_cards SET is_default = FALSE WHERE user_id = ?',
        [input.userId]
      )
    }

    // Detect card type from number if not provided
    const cardType = input.cardType || this.detectCardType(input.cardNumber)

    // Store card number (in production, this would be encrypted)
    // For demo purposes, we're storing it as-is but only returning last 4
    const [result] = await mysqlPool.execute<ResultSetHeader>(
      `INSERT INTO credit_cards 
        (user_id, card_number_encrypted, card_holder_name, expiry_month, expiry_year, cvv_encrypted, card_type, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.userId,
        input.cardNumber.replace(/\s/g, ''), // Store without spaces
        input.cardHolderName,
        input.expiryMonth,
        input.expiryYear,
        input.cvv,
        cardType,
        input.isDefault || false
      ]
    )

    const card = await this.getById(result.insertId)
    if (!card) throw new Error('Failed to create credit card')
    return card
  }

  /**
   * Get a card by ID
   */
  async getById(cardId: number): Promise<CreditCard | null> {
    const [rows] = await mysqlPool.query<RowDataPacket[]>(
      `SELECT 
        card_id, user_id, 
        RIGHT(card_number_encrypted, 4) as card_number_last4,
        card_holder_name, expiry_month, expiry_year, 
        card_type, is_default, created_at
       FROM credit_cards 
       WHERE card_id = ?`,
      [cardId]
    )
    return rows.length > 0 ? this.mapRowToCard(rows[0]) : null
  }

  /**
   * Delete a credit card
   */
  async delete(cardId: number, userId: string): Promise<boolean> {
    const [result] = await mysqlPool.execute<ResultSetHeader>(
      'DELETE FROM credit_cards WHERE card_id = ? AND user_id = ?',
      [cardId, userId]
    )
    return result.affectedRows > 0
  }

  /**
   * Set a card as default
   */
  async setDefault(cardId: number, userId: string): Promise<boolean> {
    // Unset all defaults first
    await mysqlPool.execute(
      'UPDATE credit_cards SET is_default = FALSE WHERE user_id = ?',
      [userId]
    )

    // Set new default
    const [result] = await mysqlPool.execute<ResultSetHeader>(
      'UPDATE credit_cards SET is_default = TRUE WHERE card_id = ? AND user_id = ?',
      [cardId, userId]
    )
    return result.affectedRows > 0
  }

  /**
   * Detect card type from number
   */
  private detectCardType(cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'discover' {
    const num = cardNumber.replace(/\s/g, '')
    if (/^4/.test(num)) return 'visa'
    if (/^5[1-5]/.test(num)) return 'mastercard'
    if (/^3[47]/.test(num)) return 'amex'
    if (/^6(?:011|5)/.test(num)) return 'discover'
    return 'visa' // default
  }

  private mapRowToCard(row: RowDataPacket): CreditCard {
    return {
      cardId: row.card_id,
      userId: row.user_id,
      cardNumberLast4: row.card_number_last4,
      cardHolderName: row.card_holder_name,
      expiryMonth: row.expiry_month,
      expiryYear: row.expiry_year,
      cardType: row.card_type,
      isDefault: row.is_default === 1 || row.is_default === true,
      createdAt: row.created_at
    }
  }
}

export const creditCardRepository = new CreditCardRepository()

