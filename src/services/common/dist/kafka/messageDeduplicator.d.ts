/**
 * Message Deduplicator - Ensures exactly-once processing semantics
 * Uses Redis as an idempotency layer to prevent duplicate message processing
 */
export declare class MessageDeduplicator {
    private readonly ttl;
    /**
     * @param ttl Time to live in seconds (default: 7 days)
     * Should match or exceed Kafka retention period
     */
    constructor(ttl?: number);
    /**
     * Check if a message has already been processed
     * @param messageId Unique identifier for the message (e.g., bookingId, transactionId)
     * @returns true if already processed, false otherwise
     */
    isProcessed(messageId: string): Promise<boolean>;
    /**
     * Mark a message as processed
     * @param messageId Unique identifier for the message
     */
    markProcessed(messageId: string): Promise<void>;
    /**
     * Check and mark in a single operation (atomic-like)
     * @param messageId Unique identifier
     * @returns true if this is the first time processing, false if duplicate
     */
    checkAndMark(messageId: string): Promise<boolean>;
    /**
     * Get statistics about processed messages
     */
    getStats(): Promise<{
        totalProcessed: number;
        keyPattern: string;
    }>;
    /**
     * Generate Redis key for message ID
     */
    private getKey;
}
export declare const messageDeduplicator: MessageDeduplicator;
//# sourceMappingURL=messageDeduplicator.d.ts.map