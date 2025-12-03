import { MongoClient, Db } from 'mongodb'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// ============================================
// CONFIGURATION (Reusable with standard defaults)
// ============================================
const MAX_RETRIES = 10
const RETRY_DELAY_MS = 3000

const uri = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017'
const dbName = process.env.MONGO_DATABASE || process.env.MONGODB_DATABASE || 'kayak'

let client: MongoClient | null = null
let db: Db | null = null
let isConnecting = false

// ============================================
// MONGODB CLIENT WITH RETRY LOGIC
// ============================================

/**
 * Connects to MongoDB with automatic retry on failure
 * Industry-standard pattern for robust database connectivity
 */
async function connectWithRetry(attempt = 1): Promise<MongoClient> {
  try {
    const newClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,  // 5 second timeout
      connectTimeoutMS: 10000,          // 10 second connection timeout
    })
    
    await newClient.connect()
    
    // Test the connection works
    await newClient.db('admin').command({ ping: 1 })
    
    console.log(`✅ MongoDB connected successfully (${uri.replace(/\/\/.*@/, '//<credentials>@')})`)
    return newClient
    
  } catch (error: any) {
    if (attempt < MAX_RETRIES) {
      console.log(
        `⚠️  MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`
      )
      console.log(`🔄 Retrying in ${RETRY_DELAY_MS / 1000}s...`)
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
      
      // Recursive retry
      return connectWithRetry(attempt + 1)
    } else {
      console.error(`❌ MongoDB connection failed after ${MAX_RETRIES} attempts`)
      console.error(`   URI: ${uri.replace(/\/\/.*@/, '//<credentials>@')}`)
      console.error(`   Database: ${dbName}`)
      throw new Error(`MongoDB connection failed: ${error.message}`)
    }
  }
}

/**
 * Gets the MongoDB client
 * Creates with retry logic on first call, reuses on subsequent calls
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (!client && !isConnecting) {
    isConnecting = true
    try {
      client = await connectWithRetry()
    } finally {
      isConnecting = false
    }
  }
  
  // Wait if connection is in progress
  while (isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  if (!client) {
    throw new Error('MongoDB client not initialized')
  }
  
  return client
}

/**
 * Gets the MongoDB database instance
 * Automatically connects if not already connected
 */
export async function getMongoDb(): Promise<Db> {
  if (!db) {
    const mongoClient = await getMongoClient()
    db = mongoClient.db(dbName)
  }
  return db
}

/**
 * Gracefully close the MongoDB connection
 * Call this on application shutdown
 */
export async function closeMongoConnection(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    db = null
    isConnecting = false
    console.log('✅ MongoDB connection closed')
  }
}

