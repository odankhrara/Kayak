/**
 * Redis Cache Wrapper - Singleton Pattern
 * Provides caching functionality for all microservices
 */
import { RedisClientType } from 'redis';
declare class RedisCache {
    client: RedisClientType;
    private static instance;
    private isConnected;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): RedisCache;
    /**
     * Connect to Redis (idempotent)
     */
    connect(): Promise<void>;
    /**
     * Get value from cache
     * @param key Cache key
     * @returns Parsed value or null if not found
     */
    get<T = any>(key: string): Promise<T | null>;
    /**
     * Set value in cache with TTL
     * @param key Cache key
     * @param value Value to cache (will be JSON stringified)
     * @param ttl Time to live in seconds (default: 300 = 5 minutes)
     */
    set(key: string, value: any, ttl?: number): Promise<void>;
    /**
     * Delete a single key
     * @param key Cache key to delete
     */
    del(key: string): Promise<void>;
    /**
     * Delete all keys matching a pattern
     * @param pattern Pattern to match (e.g., "flights:search:*")
     */
    delPattern(pattern: string): Promise<void>;
    /**
     * Check if Redis is connected and healthy
     */
    healthCheck(): Promise<boolean>;
    /**
     * Get cache statistics (for monitoring)
     */
    getStats(): Promise<{
        hits: number;
        misses: number;
        keys: number;
    } | null>;
    /**
     * Flush all cache (use with caution!)
     */
    flushAll(): Promise<void>;
    /**
     * Increment a counter (for analytics)
     * @param key Cache key
     * @param amount Amount to increment (default: 1)
     * @returns New value after increment
     */
    incr(key: string, amount?: number): Promise<number>;
    /**
     * Increment a floating point counter (for revenue tracking)
     * @param key Cache key
     * @param amount Amount to increment (can be decimal)
     * @returns New value after increment
     */
    incrByFloat(key: string, amount: number): Promise<number>;
    /**
     * Get raw Redis client (for advanced operations)
     * Use with caution - prefer using wrapper methods
     */
    getClient(): RedisClientType;
    /**
     * Disconnect from Redis
     */
    disconnect(): Promise<void>;
}
export declare const redisCache: RedisCache;
export default RedisCache;
//# sourceMappingURL=redisCache.d.ts.map