import { getConsumer } from '@kayak/common'
import { KAFKA_TOPICS } from '@kayak/common'
import { getMongoDb } from '@kayak/common'
import { Consumer } from 'kafkajs'

/**
 * Kafka consumer for user tracking events
 * Consumes page views, searches, booking attempts and stores them in MongoDB logs collection
 * Uses fail-fast approach - no aggressive retries to prevent CPU overload
 */
export class UserTrackingConsumer {
  private consumer: Consumer | null = null
  private running = false

  async start() {
    try {
      this.consumer = await getConsumer('analytics-user-tracking-group')
      await this.consumer.subscribe({
        topics: [KAFKA_TOPICS.USER_TRACKING],
        fromBeginning: false
      })

      this.running = true
      console.log('User tracking consumer started')

      await this.consume()
    } catch (error: any) {
      // Fail fast - don't retry aggressively to prevent CPU overload
      console.error('Error starting user tracking consumer:', error.message)
      console.warn('⚠️  User tracking will be unavailable')
      throw error
    }
  }

  private async consume() {
    if (this.consumer) {
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            if (!message.value) return
  
            const eventData = JSON.parse(message.value.toString())
            
            // Store in MongoDB logs collection
            const db = await getMongoDb()
            const logsCollection = db.collection('logs')
  
            const logDocument = {
              ...eventData,
              timestamp: eventData.timestamp ? new Date(eventData.timestamp) : new Date(),
              created_at: new Date()
            }
  
            await logsCollection.insertOne(logDocument)
  
            const logType = eventData.log_type || 'unknown'
            console.log(`${logType} event stored: ${eventData.user_id || eventData.session_id || 'anonymous'}`)
          } catch (error) {
            console.error('Error processing user tracking event:', error)
          }
        }
      })
    }
  }

  async stop() {
    this.running = false
    if (this.consumer) {
      await this.consumer.disconnect()
    }
    console.log('User tracking consumer stopped')
  }
}

