import { getConsumer } from '../../../common/src/kafka/kafkaClient'
import { KAFKA_TOPICS } from '../../../common/src/kafka/topics'
import { messageDeduplicator } from '../../../common/src/kafka/messageDeduplicator'
import { redisCache } from '../../../common/src/cache/redisCache'

/**
 * Process booking created event
 */
async function processBookingCreated(event: any) {
  const today = getTodayKey()
  
  // Increment booking count
  await redisCache.incr(`analytics:bookings:count:${today}`)
  
  // Increment booking count by type
  await redisCache.incr(`analytics:bookings:type:${event.bookingType || 'unknown'}:${today}`)
  
  // Store total bookings (all time)
  await redisCache.incr('analytics:bookings:total')
  
  console.log(`📊 Analytics: Booking ${event.bookingId} counted (${event.bookingType || 'unknown'})`)
}

/**
 * Process booking updated event
 */
async function processBookingUpdated(event: any) {
  console.log(`📊 Analytics: Booking ${event.bookingId} updated to status: ${event.status}`)
  
  // Track status changes
  const today = getTodayKey()
  await redisCache.incr(`analytics:bookings:status:${event.status || 'unknown'}:${today}`)
}

/**
 * Process payment succeeded event
 */
async function processPaymentSucceeded(event: any) {
  const today = getTodayKey()
  const amount = parseFloat(event.amount || 0)
  
  // Increment revenue (use incrByFloat for decimal amounts)
  await redisCache.incrByFloat(`analytics:revenue:${today}`, amount)
  
  // Increment successful payment count
  await redisCache.incr(`analytics:payments:succeeded:${today}`)
  
  // Store total revenue (all time)
  await redisCache.incrByFloat('analytics:revenue:total', amount)
  
  console.log(`💰 Analytics: Revenue +$${amount.toFixed(2)} (Total today updated)`)
}

/**
 * Process payment failed event
 */
async function processPaymentFailed(event: any) {
  const today = getTodayKey()
  
  // Track failed payments
  await redisCache.incr(`analytics:payments:failed:${today}`)
  
  console.log(`❌ Analytics: Payment ${event.paymentId || 'unknown'} failed`)
}

/**
 * Get today's date key (YYYY-MM-DD)
 */
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Extract unique message ID from event
 */
function getMessageId(event: any, topic: string): string {
  if (topic === KAFKA_TOPICS.BOOKING_CREATED || topic === KAFKA_TOPICS.BOOKING_UPDATED) {
    return event.bookingId || event.booking_id || `unknown-${Date.now()}`
  }
  if (topic === KAFKA_TOPICS.PAYMENT_SUCCEEDED || topic === KAFKA_TOPICS.PAYMENT_FAILED) {
    return event.paymentId || event.billingId || event.payment_id || `unknown-${Date.now()}`
  }
  return `unknown-${topic}-${Date.now()}`
}

async function start() {
  // Connect to Redis
  await redisCache.connect()
  console.log('✅ Analytics service connected to Redis for aggregations')

  const consumer = await getConsumer('analytics-booking-billing')

  await consumer.subscribe({ topic: KAFKA_TOPICS.BOOKING_CREATED, fromBeginning: true })
  await consumer.subscribe({ topic: KAFKA_TOPICS.BOOKING_UPDATED, fromBeginning: true })
  await consumer.subscribe({ topic: KAFKA_TOPICS.PAYMENT_SUCCEEDED, fromBeginning: true })
  await consumer.subscribe({ topic: KAFKA_TOPICS.PAYMENT_FAILED, fromBeginning: true })

  console.log('✅ Analytics consumer listening on booking/payment topics...')
  console.log('🔒 Message deduplication enabled (exactly-once processing)')

  await consumer.run({
    eachMessage: async ({
      topic,
      partition,
      message
    }: {
      topic: string
      partition: number
      message: any
    }) => {
      try {
        const value = message.value?.toString() || '{}'
        const event = JSON.parse(value)
        
        // Extract unique message ID
        const messageId = getMessageId(event, topic)
        
        // Check for duplicates (idempotency layer)
        const isDuplicate = await messageDeduplicator.isProcessed(messageId)
        if (isDuplicate) {
          console.log(`⚠️  Skipping duplicate message: ${messageId} (topic=${topic})`)
          return
        }
        
        // Log event
        console.log(`[Analytics] topic=${topic} partition=${partition} offset=${message.offset}`)
        
        // Process event based on topic
        switch (topic) {
          case KAFKA_TOPICS.BOOKING_CREATED:
            await processBookingCreated(event)
            break
          case KAFKA_TOPICS.BOOKING_UPDATED:
            await processBookingUpdated(event)
            break
          case KAFKA_TOPICS.PAYMENT_SUCCEEDED:
            await processPaymentSucceeded(event)
            break
          case KAFKA_TOPICS.PAYMENT_FAILED:
            await processPaymentFailed(event)
            break
          default:
            console.log(`Unknown topic: ${topic}`)
        }
        
        // Mark as processed (exactly-once guarantee)
        await messageDeduplicator.markProcessed(messageId)
        
      } catch (error: any) {
        console.error(`Error processing message:`, error.message)
        // Don't throw - log and continue to next message
      }
    }
  })
}

start().catch((err) => {
  console.error('Analytics consumer failed:', err)
  process.exit(1)
})

start().catch((err) => {
  console.error('Analytics consumer failed:', err)
  process.exit(1)
})
