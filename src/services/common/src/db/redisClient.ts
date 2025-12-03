import { createClient, RedisClientType } from 'redis'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// ============================================
// CONFIGURATION (Reusable with standard defaults)
// ============================================
const MAX_RECONNECT_ATTEMPTS = 10
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

let client: RedisClientType | null = null
let isConnected = false
let isConnecting = false
let reconnectAttempts = 0

// ============================================
// REDIS CLIENT WITH GRACEFUL DEGRADATION
// ============================================
// Redis is used for caching - if unavailable, app should still work

/**
 * Creates Redis client with automatic reconnection
 * Uses graceful degradation - app works without Redis
 */
function createRedisClient(): RedisClientType {
  const redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        reconnectAttempts = retries
        
        if (retries > MAX_RECONNECT_ATTEMPTS) {
          console.log(`❌ Redis max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`)
          console.log('⚠️  Application will continue WITHOUT caching')
          return new Error('Redis reconnection failed')
        }
        
        const delay = Math.min(retries * 100, 3000) // Exponential backoff, max 3s
        console.log(`🔄 Redis reconnecting (attempt ${retries}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms...`)
        return delay
      }
    }
  }) as RedisClientType

  // Event handlers for connection lifecycle
  redisClient.on('error', (err) => {
    console.error('❌ Redis Error:', err.message)
    isConnected = false
  })

  redisClient.on('connect', () => {
    console.log('🔄 Redis connecting...')
    isConnecting = true
  })

  redisClient.on('ready', () => {
    console.log(`✅ Redis ready (${redisUrl})`)
    isConnected = true
    isConnecting = false
    reconnectAttempts = 0
  })

  redisClient.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...')
    isConnecting = true
  })

  redisClient.on('end', () => {
    console.log('⚠️  Redis connection closed')
    isConnected = false
    isConnecting = false
  })

  return redisClient
}

/**
 * Gets the Redis client with graceful degradation
 * Returns null if Redis is unavailable (app continues without cache)
 */
export async function getRedisClient(): Promise<RedisClientType | null> {
  try {
    if (!client) {
      client = createRedisClient()
      await client.connect()
    }
    
    // Wait if connection is in progress
    if (isConnecting && !isConnected) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    if (isConnected) {
      return client
    }
    
    console.warn('⚠️  Redis not available, continuing without cache')
    return null
    
  } catch (error: any) {
    console.error('Failed to connect to Redis:', error.message)
    console.warn('⚠️  Application will continue WITHOUT caching')
    return null  // Graceful degradation - return null instead of crashing
  }
}

/**
 * Check if Redis is currently available
 * Use this to conditionally use caching features
 */
export function isRedisAvailable(): boolean {
  return isConnected
}

/**
 * Gracefully close the Redis connection
 * Call this on application shutdown
 */
export async function closeRedisConnection(): Promise<void> {
  if (client && isConnected) {
    try {
      await client.quit()
      console.log('✅ Redis connection closed')
    } catch (error) {
      console.warn('⚠️  Error closing Redis connection:', error)
    } finally {
      client = null
      isConnected = false
      isConnecting = false
      reconnectAttempts = 0
    }
  }
}

// ============================================
// HELPER FUNCTIONS FOR SAFE CACHE OPERATIONS
// ============================================

/**
 * Safely get value from Redis cache
 * Returns null if Redis unavailable or key not found
 */
export async function safeGet(key: string): Promise<string | null> {
  const redis = await getRedisClient()
  if (!redis) return null
  
  try {
    return await redis.get(key)
  } catch (error) {
    console.warn(`⚠️  Redis GET failed for key: ${key}`)
    return null
  }
}

/**
 * Safely set value in Redis cache
 * Silently fails if Redis unavailable (graceful degradation)
 */
export async function safeSet(key: string, value: string, expirySeconds?: number): Promise<boolean> {
  const redis = await getRedisClient()
  if (!redis) return false
  
  try {
    if (expirySeconds) {
      await redis.setEx(key, expirySeconds, value)
    } else {
      await redis.set(key, value)
    }
    return true
  } catch (error) {
    console.warn(`⚠️  Redis SET failed for key: ${key}`)
    return false
  }
}

/**
 * Safely delete key from Redis cache
 * Silently fails if Redis unavailable
 */
export async function safeDel(key: string): Promise<boolean> {
  const redis = await getRedisClient()
  if (!redis) return false
  
  try {
    await redis.del(key)
    return true
  } catch (error) {
    console.warn(`⚠️  Redis DEL failed for key: ${key}`)
    return false
  }
}

export default client

