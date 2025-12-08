import { Kafka, Producer, Consumer, KafkaConfig, ProducerRecord } from 'kafkajs'
import { KafkaTopic } from './topics'

// Use KAFKA_BROKERS env var, default to kafka:29092 for Docker (not localhost:9092)
// For local development outside Docker, set KAFKA_BROKERS=localhost:29092
const brokers = (process.env.KAFKA_BROKERS || 'kafka:29092')
  .split(',')
  .map((b) => b.trim())
  .filter(Boolean)

console.log('🔄 Kafka brokers configured:', brokers.join(', '))

const kafkaConfig: KafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'kayak-service',
  brokers,
  connectionTimeout: 10000,
  requestTimeout: 25000,
  retry: {
    initialRetryTime: 100,
    retries: 3,
    maxRetryTime: 30000,
    multiplier: 2
  }
}

// Singleton Kafka instance shared across producers/consumers
const kafka = new Kafka(kafkaConfig)

let producerInstance: Producer | null = null
let kafkaAvailable = true
const consumerInstances: Map<string, Consumer> = new Map()

export async function getProducer(): Promise<Producer> {
  if (producerInstance) {
    return producerInstance
  }

  producerInstance = kafka.producer()
  try {
    await producerInstance.connect()
    console.log('✅ Kafka producer connected')
    kafkaAvailable = true
  } catch (err) {
    console.error('⚠️  Kafka producer connection failed:', err)
    kafkaAvailable = false
    producerInstance = null
    // Return null producer instead of throwing
    return createNullProducer()
  }

  return producerInstance
}

/**
 * Create a null producer that silently ignores sends
 * Used when Kafka is unavailable
 */
function createNullProducer(): Producer {
  return {
    connect: async () => {},
    disconnect: async () => {},
    send: async () => {
      console.log('📨 Kafka unavailable - message skipped')
      return []
    },
    sendBatch: async () => ({
      results: []
    }),
    transaction: async () => ({
      commit: async () => {},
      abort: async () => {},
      isActive: () => false
    }),
    on: () => {},
    off: () => {},
    events: { CONNECT: 'producer.connect', DISCONNECT: 'producer.disconnect' },
    logger: () => {},
    utils: { defaultPartitioner: () => 0 }
  } as unknown as Producer
}

/**
 * Create a Kafka producer instance (synchronous, not connected)
 * Use this when you want to manage connection lifecycle yourself
 */
export function createProducer(): Producer {
  return kafka.producer()
}

/**
 * Create a Kafka consumer instance (synchronous, not connected)
 * Use this when you want to manage connection lifecycle yourself
 */
export function createConsumer(groupId: string): Consumer {
  return kafka.consumer({ groupId })
}

export async function getConsumer(groupId: string): Promise<Consumer> {
  if (consumerInstances.has(groupId)) {
    return consumerInstances.get(groupId)!
  }

  const consumer = kafka.consumer({ groupId })
  try {
    await consumer.connect()
    console.log(`✅ Kafka consumer connected (group: ${groupId})`)
    consumerInstances.set(groupId, consumer)
  } catch (err) {
    console.error(`⚠️  Kafka consumer connection failed (group: ${groupId}):`, err)
    kafkaAvailable = false
    // Don't throw - return a mock consumer
    return createNullConsumer()
  }

  return consumer
}

/**
 * Create a null consumer that silently ignores subscribes
 */
function createNullConsumer(): Consumer {
  return {
    connect: async () => {},
    disconnect: async () => {},
    subscribe: async () => {},
    run: async () => {},
    stop: async () => {},
    pause: async () => {},
    resume: async () => {},
    on: () => {},
    off: () => {},
    events: { CONNECT: 'consumer.connect', DISCONNECT: 'consumer.disconnect' },
    logger: () => {},
    seek: async () => {},
    describeGroup: async () => ({ groups: [] }),
    fetch: async () => ({ records: [] }),
    commitOffsets: async () => {},
    commitOffsetsIfNecessary: async () => {}
  } as unknown as Consumer
}

export async function sendKafkaMessage(topic: string, payload: unknown) {
  if (!kafkaAvailable) {
    console.log(`📨 Kafka unavailable - skipping message to topic ${topic}`)
    return
  }

  try {
    const producer = await getProducer()
    const record: ProducerRecord = {
      topic,
      messages: [{ value: JSON.stringify(payload) }]
    }

    await producer.send(record)
    console.log(`📨 Sent message to topic ${topic}`)
  } catch (err) {
    console.error(`⚠️  Failed to send message to topic ${topic}:`, err)
    kafkaAvailable = false
    // Don't throw - silently ignore
  }
}

export default kafka

