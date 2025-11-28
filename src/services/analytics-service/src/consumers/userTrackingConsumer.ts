import { createConsumer } from '@kayak/common/src/kafka/kafkaClient'
import { KAFKA_TOPICS } from '@kayak/common/src/kafka/topics'
import { getMongoDb } from '@kayak/common/src/db/mongoClient'

/**
 * Kafka consumer for user tracking events
 * Consumes page views, searches, booking attempts and stores them in MongoDB logs collection
 */
export class UserTrackingConsumer {
  private consumer: ReturnType<typeof createConsumer>
  private running = false

  constructor() {
    this.consumer = createConsumer('analytics-user-tracking-group')
  }

  async start() {
    try {
      await this.consumer.connect()
      await this.consumer.subscribe({
        topics: [KAFKA_TOPICS.USER_TRACKING],
        fromBeginning: false
      })

      this.running = true
      console.log('User tracking consumer started')

      await this.consume()
    } catch (error) {
      console.error('Error starting user tracking consumer:', error)
      throw error
    }
  }

  private async consume() {
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

  async stop() {
    this.running = false
    await this.consumer.disconnect()
    console.log('User tracking consumer stopped')
  }
}

