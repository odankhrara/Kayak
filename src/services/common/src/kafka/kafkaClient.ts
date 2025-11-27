import { Kafka, Producer, Consumer, KafkaConfig, ProducerRecord } from 'kafkajs'
import { KafkaTopic } from './topics'

const brokers = (process.env.KAFKA_BROKERS || 'kafka:9092,localhost:9092')
  .split(',')
  .map((b) => b.trim())
  .filter(Boolean)

const kafkaConfig: KafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'kayak-service',
  brokers
}

// Singleton Kafka instance shared across producers/consumers
const kafka = new Kafka(kafkaConfig)

let producerInstance: Producer | null = null
const consumerInstances: Map<string, Consumer> = new Map()

export async function getProducer(): Promise<Producer> {
  if (producerInstance) {
    return producerInstance
  }

  producerInstance = kafka.producer()
  try {
    await producerInstance.connect()
    console.log('✅ Kafka producer connected')
  } catch (err) {
    console.error('Kafka producer connection failed:', err)
    producerInstance = null
    throw err
  }

  return producerInstance
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
    console.error(`Kafka consumer connection failed (group: ${groupId}):`, err)
    throw err
  }

  return consumer
}

export async function sendKafkaMessage(topic: KafkaTopic, payload: unknown) {
  const producer = await getProducer()
  const record: ProducerRecord = {
    topic,
    messages: [{ value: JSON.stringify(payload) }]
  }

  try {
    await producer.send(record)
    console.log(`📨 Sent message to topic ${topic}`)
  } catch (err) {
    console.error(`Failed to send message to topic ${topic}:`, err)
    throw err
  }
}

export default kafka

