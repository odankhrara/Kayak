import { Kafka, Producer, Consumer, KafkaConfig } from 'kafkajs'

const kafkaConfig: KafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'kayak-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
}

const kafka = new Kafka(kafkaConfig)

export function createProducer(): Producer {
  return kafka.producer()
}

export function createConsumer(groupId: string): Consumer {
  return kafka.consumer({ groupId })
}

export default kafka

