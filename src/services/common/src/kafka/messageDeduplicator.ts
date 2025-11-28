/**
 * Message Deduplicator - Ensures exactly-once processing semantics
 * Uses Redis as an idempotency layer to prevent duplicate message processing
 */

import { redisCache } from '../cache/redisCache'

export class MessageDeduplicator {
  private readonly ttl: number

  /**
   * @param ttl Time to live in seconds (default: 7 days)
   * Should match or exceed Kafka retention period
   */
  constructor(ttl: number = 7 * 24 * 60 * 60) {
    this.ttl = ttl
  }

  /**
   * Check if a message has already been processed
   * @param messageId Unique identifier for the message (e.g., bookingId, transactionId)
   * @returns true if already processed, false otherwise
   */
  async isProcessed(messageId: string): Promise<boolean> {
    try {
      const key = this.getKey(messageId)
      const value = await redisCache.get<number>(key)
      
      if (value !== null) {
        console.log(`⚠️  Duplicate message detected: ${messageId} (processed at ${new Date(value).toISOString()})`)
        return true
      }
      
      return false
    } catch (error: any) {
      console.error(`Error checking deduplication for ${messageId}:`, error.message)
      // On Redis error, allow processing (fail open)
      return false
    }
  }

  /**
   * Mark a message as processed
   * @param messageId Unique identifier for the message
   */
  async markProcessed(messageId: string): Promise<void> {
    try {
      const key = this.getKey(messageId)
      const timestamp = Date.now()
      await redisCache.set(key, timestamp, this.ttl)
      console.log(`✅ Marked as processed: ${messageId}`)
    } catch (error: any) {
      console.error(`Error marking ${messageId} as processed:`, error.message)
      // Non-critical error - don't throw
    }
  }

  /**
   * Check and mark in a single operation (atomic-like)
   * @param messageId Unique identifier
   * @returns true if this is the first time processing, false if duplicate
   */
  async checkAndMark(messageId: string): Promise<boolean> {
    const isDuplicate = await this.isProcessed(messageId)
    if (isDuplicate) {
      return false
    }
    await this.markProcessed(messageId)
    return true
  }

  /**
   * Get statistics about processed messages
   */
  async getStats(): Promise<{ totalProcessed: number; keyPattern: string }> {
    try {
      // This is expensive - use sparingly
      const keys = await redisCache.client.keys(this.getKey('*'))
      return {
        totalProcessed: keys.length,
        keyPattern: this.getKey('*')
      }
    } catch (error) {
      return { totalProcessed: 0, keyPattern: this.getKey('*') }
    }
  }

  /**
   * Generate Redis key for message ID
   */
  private getKey(messageId: string): string {
    return `kafka:processed:${messageId}`
  }
}

// Export singleton instance with default TTL (7 days)
export const messageDeduplicator = new MessageDeduplicator()

