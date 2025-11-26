// Database connections
export { default as mysqlPool } from './db/mysqlPool'
export { getMongoClient, getMongoDb, closeMongoConnection } from './db/mongoClient'
export { getRedisClient, closeRedisConnection } from './db/redisClient'

// Kafka
export { createProducer, createConsumer } from './kafka/kafkaClient'
export { KAFKA_TOPICS } from './kafka/topics'

// Middleware
export { requireAuth, requireAdmin, type AuthRequest } from './middleware/auth'
export { errorHandler, AppError } from './middleware/errorHandler'
export { validate } from './middleware/validation'

// Utils
export * from './utils'

