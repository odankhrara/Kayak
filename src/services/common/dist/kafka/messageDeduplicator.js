"use strict";
/**
 * Message Deduplicator - Ensures exactly-once processing semantics
 * Uses Redis as an idempotency layer to prevent duplicate message processing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageDeduplicator = exports.MessageDeduplicator = void 0;
const redisCache_1 = require("../cache/redisCache");
class MessageDeduplicator {
    /**
     * @param ttl Time to live in seconds (default: 7 days)
     * Should match or exceed Kafka retention period
     */
    constructor(ttl = 7 * 24 * 60 * 60) {
        this.ttl = ttl;
    }
    /**
     * Check if a message has already been processed
     * @param messageId Unique identifier for the message (e.g., bookingId, transactionId)
     * @returns true if already processed, false otherwise
     */
    async isProcessed(messageId) {
        try {
            const key = this.getKey(messageId);
            const value = await redisCache_1.redisCache.get(key);
            if (value !== null) {
                console.log(`⚠️  Duplicate message detected: ${messageId} (processed at ${new Date(value).toISOString()})`);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error(`Error checking deduplication for ${messageId}:`, error.message);
            // On Redis error, allow processing (fail open)
            return false;
        }
    }
    /**
     * Mark a message as processed
     * @param messageId Unique identifier for the message
     */
    async markProcessed(messageId) {
        try {
            const key = this.getKey(messageId);
            const timestamp = Date.now();
            await redisCache_1.redisCache.set(key, timestamp, this.ttl);
            console.log(`✅ Marked as processed: ${messageId}`);
        }
        catch (error) {
            console.error(`Error marking ${messageId} as processed:`, error.message);
            // Non-critical error - don't throw
        }
    }
    /**
     * Check and mark in a single operation (atomic-like)
     * @param messageId Unique identifier
     * @returns true if this is the first time processing, false if duplicate
     */
    async checkAndMark(messageId) {
        const isDuplicate = await this.isProcessed(messageId);
        if (isDuplicate) {
            return false;
        }
        await this.markProcessed(messageId);
        return true;
    }
    /**
     * Get statistics about processed messages
     */
    async getStats() {
        try {
            // This is expensive - use sparingly
            const keys = await redisCache_1.redisCache.client.keys(this.getKey('*'));
            return {
                totalProcessed: keys.length,
                keyPattern: this.getKey('*')
            };
        }
        catch (error) {
            return { totalProcessed: 0, keyPattern: this.getKey('*') };
        }
    }
    /**
     * Generate Redis key for message ID
     */
    getKey(messageId) {
        return `kafka:processed:${messageId}`;
    }
}
exports.MessageDeduplicator = MessageDeduplicator;
// Export singleton instance with default TTL (7 days)
exports.messageDeduplicator = new MessageDeduplicator();
//# sourceMappingURL=messageDeduplicator.js.map