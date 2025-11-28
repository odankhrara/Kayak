import { createConsumer } from '@kayak/common/src/kafka/kafkaClient'
import { KAFKA_TOPICS } from '@kayak/common/src/kafka/topics'
import { getMongoDb } from '@kayak/common/src/db/mongoClient'

/**
 * Kafka consumer for click events
 * Consumes click events and stores them in MongoDB logs collection
 */
export class ClickEventsConsumer {
  private consumer: ReturnType<typeof createConsumer>
  private running = false

  constructor() {
    this.consumer = createConsumer('analytics-click-events-group')
  }

  async start() {
    try {
      await this.consumer.connect()
      await this.consumer.subscribe({
        topics: [KAFKA_TOPICS.CLICK_EVENT],
        fromBeginning: false
      })

      this.running = true
      console.log('Click events consumer started')

      await this.consume()
    } catch (error) {
      console.error('Error starting click events consumer:', error)
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

          await logsCollection.insertOne({
            ...eventData,
            log_type: 'click',
            timestamp: eventData.timestamp ? new Date(eventData.timestamp) : new Date(),
            created_at: new Date()
          })

          console.log(`Click event stored: ${eventData.element_id || 'unknown'}`)
        } catch (error) {
          console.error('Error processing click event:', error)
        }
      }
    })
  }

  async stop() {
    this.running = false
    await this.consumer.disconnect()
    console.log('Click events consumer stopped')
  }
}

