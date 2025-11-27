import { sendKafkaMessage } from './kafkaClient'
import { KAFKA_TOPICS } from './topics'

async function main() {
  const fakePayment = {
    paymentId: 'test-payment-1',
    bookingId: 'test-booking-1',
    userId: 'test-user-1',
    amount: 200.5,
    status: 'completed',
    paidAt: new Date().toISOString(),
  }

  console.log('Sending test payment_succeeded event...')
  await sendKafkaMessage(KAFKA_TOPICS.PAYMENT_SUCCEEDED, fakePayment)
  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Test payment producer failed:', err)
  process.exit(1)
})
