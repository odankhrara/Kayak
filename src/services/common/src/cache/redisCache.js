"use strict";
/**
 * Redis Cache Wrapper - Singleton Pattern
 * Provides caching functionality for all microservices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisCache = void 0;
const redis_1 = require("redis");
class RedisCache {
    constructor() {
        this.isConnected = false;
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.client = (0, redis_1.createClient)({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.error('❌ Redis max reconnection attempts reached');
                        return new Error('Redis reconnection failed');
                    }
                    // Exponential backoff: 100ms, 200ms, 400ms, ...
                    return Math.min(retries * 100, 3000);
                }
            }
        });
        this.client.on('error', (err) => console.error('❌ Redis Error:', err.message));
        this.client.on('connect', () => console.log('🔄 Redis connecting...'));
        this.client.on('ready', () => {
            console.log('✅ Redis connected and ready');
            this.isConnected = true;
        });
        this.client.on('end', () => {
            console.log('⚠️  Redis connection closed');
            this.isConnected = false;
        });
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!RedisCache.instance) {
            RedisCache.instance = new RedisCache();
        }
        return RedisCache.instance;
    }
    /**
     * Connect to Redis (idempotent)
     */
    async connect() {
        if (!this.isConnected && !this.client.isOpen) {
            try {
                await this.client.connect();
            }
            catch (error) {
                console.error('Failed to connect to Redis:', error.message);
                throw error;
            }
        }
    }
    /**
     * Get value from cache
     * @param key Cache key
     * @returns Parsed value or null if not found
     */
    async get(key) {
        try {
            await this.connect();
            const data = await this.client.get(key);
            if (!data) {
                console.log(`❌ Cache MISS: ${key}`);
                return null;
            }
            console.log(`✅ Cache HIT: ${key}`);
            return JSON.parse(data);
        }
        catch (error) {
            console.error(`Redis GET error for key ${key}:`, error.message);
            return null; // Fail gracefully - don't crash app if Redis is down
        }
    }
    /**
     * Set value in cache with TTL
     * @param key Cache key
     * @param value Value to cache (will be JSON stringified)
     * @param ttl Time to live in seconds (default: 300 = 5 minutes)
     */
    async set(key, value, ttl = 300) {
        try {
            await this.connect();
            const serialized = JSON.stringify(value);
            await this.client.set(key, serialized, { EX: ttl });
            console.log(`💾 Cached: ${key} (TTL: ${ttl}s)`);
        }
        catch (error) {
            console.error(`Redis SET error for key ${key}:`, error.message);
            // Don't throw - caching failure shouldn't break the app
        }
    }
    /**
     * Delete a single key
     * @param key Cache key to delete
     */
    async del(key) {
        try {
            await this.connect();
            await this.client.del(key);
            console.log(`🗑️  Invalidated: ${key}`);
        }
        catch (error) {
            console.error(`Redis DEL error for key ${key}:`, error.message);
        }
    }
    /**
     * Delete all keys matching a pattern
     * @param pattern Pattern to match (e.g., "flights:search:*")
     */
    async delPattern(pattern) {
        try {
            await this.connect();
            const keys = await this.client.keys(pattern);
            if (keys.length === 0) {
                console.log(`ℹ️  No keys found matching pattern: ${pattern}`);
                return;
            }
            await this.client.del(keys);
            console.log(`🗑️  Invalidated ${keys.length} keys matching: ${pattern}`);
        }
        catch (error) {
            console.error(`Redis DEL pattern error for ${pattern}:`, error.message);
        }
    }
    /**
     * Check if Redis is connected and healthy
     */
    async healthCheck() {
        try {
            await this.connect();
            const pong = await this.client.ping();
            return pong === 'PONG';
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get cache statistics (for monitoring)
     */
    async getStats() {
        try {
            await this.connect();
            const info = await this.client.info('stats');
            const dbSize = await this.client.dbSize();
            const hitsMatch = info.match(/keyspace_hits:(\d+)/);
            const missesMatch = info.match(/keyspace_misses:(\d+)/);
            return {
                hits: hitsMatch ? parseInt(hitsMatch[1]) : 0,
                misses: missesMatch ? parseInt(missesMatch[1]) : 0,
                keys: dbSize
            };
        }
        catch (error) {
            console.error('Failed to get Redis stats:', error);
            return null;
        }
    }
    /**
     * Flush all cache (use with caution!)
     */
    async flushAll() {
        try {
            await this.connect();
            await this.client.flushAll();
            console.log('🧹 Flushed all Redis cache');
        }
        catch (error) {
            console.error('Redis FLUSHALL error:', error.message);
        }
    }
    /**
     * Increment a counter (for analytics)
     * @param key Cache key
     * @param amount Amount to increment (default: 1)
     * @returns New value after increment
     */
    async incr(key, amount = 1) {
        try {
            await this.connect();
            if (amount === 1) {
                return await this.client.incr(key);
            }
            else {
                return await this.client.incrBy(key, Math.floor(amount));
            }
        }
        catch (error) {
            console.error(`Redis INCR error for key ${key}:`, error.message);
            return 0;
        }
    }
    /**
     * Increment a floating point counter (for revenue tracking)
     * @param key Cache key
     * @param amount Amount to increment (can be decimal)
     * @returns New value after increment
     */
    async incrByFloat(key, amount) {
        try {
            await this.connect();
            const result = await this.client.incrByFloat(key, amount);
            return typeof result === 'string' ? parseFloat(result) : result;
        }
        catch (error) {
            console.error(`Redis INCRBYFLOAT error for key ${key}:`, error.message);
            return 0;
        }
    }
    /**
     * Get raw Redis client (for advanced operations)
     * Use with caution - prefer using wrapper methods
     */
    getClient() {
        return this.client;
    }
    /**
     * Disconnect from Redis
     */
    async disconnect() {
        if (this.isConnected && this.client.isOpen) {
            await this.client.quit();
            this.isConnected = false;
        }
    }
}
// Export singleton instance
exports.redisCache = RedisCache.getInstance();
// Export class for testing
exports.default = RedisCache;
