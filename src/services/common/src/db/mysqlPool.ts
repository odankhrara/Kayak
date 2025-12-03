import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// ============================================
// CONFIGURATION (Reusable with standard defaults)
// ============================================
const MAX_RETRIES = 10
const RETRY_DELAY_MS = 3000

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),  // Standard MySQL port
  user: process.env.MYSQL_USER || 'root',            // Standard user
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'kayak',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
}

// ============================================
// CONNECTION POOL WITH RETRY LOGIC
// ============================================
let pool: mysql.Pool | null = null
let isInitialized = false

/**
 * Creates MySQL connection pool with automatic retry on failure
 * Industry-standard pattern for robust database connectivity
 */
async function createPoolWithRetry(attempt = 1): Promise<mysql.Pool> {
  try {
    const newPool = mysql.createPool(config)
    
    // Test the connection works
    const connection = await newPool.getConnection()
    connection.release()
    
    console.log(`✅ MySQL connected successfully (${config.host}:${config.port})`)
    return newPool
    
  } catch (error: any) {
    if (attempt < MAX_RETRIES) {
      console.log(
        `⚠️  MySQL connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`
      )
      console.log(`🔄 Retrying in ${RETRY_DELAY_MS / 1000}s...`)
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
      
      // Recursive retry
      return createPoolWithRetry(attempt + 1)
    } else {
      console.error(`❌ MySQL connection failed after ${MAX_RETRIES} attempts`)
      console.error(`   Host: ${config.host}:${config.port}`)
      console.error(`   User: ${config.user}`)
      console.error(`   Database: ${config.database}`)
      throw new Error(`MySQL connection failed: ${error.message}`)
    }
  }
}

/**
 * Gets the MySQL connection pool
 * Creates with retry logic on first call, reuses on subsequent calls
 */
export async function getPool(): Promise<mysql.Pool> {
  if (!pool && !isInitialized) {
    isInitialized = true
    pool = await createPoolWithRetry()
  }
  
  if (!pool) {
    throw new Error('MySQL pool not initialized')
  }
  
  return pool
}

/**
 * Gracefully close the connection pool
 * Call this on application shutdown
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    isInitialized = false
    console.log('✅ MySQL pool closed')
  }
}

// ============================================
// BACKWARD COMPATIBILITY
// ============================================
// Create pool synchronously for immediate export
// This maintains compatibility with existing code
const immediatePool = mysql.createPool(config)

// Test connection in background (non-blocking)
immediatePool.getConnection()
  .then(conn => {
    conn.release()
    console.log('✅ MySQL pool created (backward compatibility mode)')
  })
  .catch(err => {
    console.warn('⚠️  Initial MySQL connection failed, will retry on first query')
    console.warn('   Use getPool() for automatic retry behavior')
  })

// Default export for backward compatibility
export default immediatePool

