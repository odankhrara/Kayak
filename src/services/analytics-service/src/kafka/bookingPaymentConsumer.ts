import { getConsumer } from '../../../common/src/kafka/kafkaClient'
import { KAFKA_TOPICS } from '../../../common/src/kafka/topics'

async function start() {
  const consumer = await getConsumer('analytics-booking-billing')

  await consumer.subscribe({ topic: KAFKA_TOPICS.BOOKING_CREATED, fromBeginning: true })
  await consumer.subscribe({ topic: KAFKA_TOPICS.BOOKING_UPDATED, fromBeginning: true })
  await consumer.subscribe({ topic: KAFKA_TOPICS.PAYMENT_SUCCEEDED, fromBeginning: true })
  await consumer.subscribe({ topic: KAFKA_TOPICS.PAYMENT_FAILED, fromBeginning: true })

  console.log('✅ Analytics consumer listening on booking/payment topics...')

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
      const value = message.value?.toString() || ''
      console.log(`[Analytics] topic=${topic} partition=${partition} offset=${message.offset} value=${value}`)
    }
  })
}

start().catch((err) => {
  console.error('Analytics consumer failed:', err)
  process.exit(1)
})
