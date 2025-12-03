import { getConsumer } from '@kayak/common'
import { KAFKA_TOPICS } from '@kayak/common'
import { getMongoDb } from '@kayak/common'
import { Consumer } from 'kafkajs'

/**
 * Kafka consumer for click events
 * Consumes click events and stores them in MongoDB logs collection
 */
export class ClickEventsConsumer {
  private consumer: Consumer | null = null
  private running = false

  async start() {
    try {
      this.consumer = await getConsumer('analytics-click-events-group')
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
    if (this.consumer) {
      await this.consumer.disconnect()
    }
    console.log('Click events consumer stopped')
  }
}

