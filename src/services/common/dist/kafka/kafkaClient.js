"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProducer = getProducer;
exports.getConsumer = getConsumer;
exports.sendKafkaMessage = sendKafkaMessage;
const kafkajs_1 = require("kafkajs");
const brokers = (process.env.KAFKA_BROKERS || 'kafka:9092,localhost:9092')
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);
const kafkaConfig = {
    clientId: process.env.KAFKA_CLIENT_ID || 'kayak-service',
    brokers
};
// Singleton Kafka instance shared across producers/consumers
const kafka = new kafkajs_1.Kafka(kafkaConfig);
let producerInstance = null;
const consumerInstances = new Map();
async function getProducer() {
    if (producerInstance) {
        return producerInstance;
    }
    producerInstance = kafka.producer();
    try {
        await producerInstance.connect();
        console.log('✅ Kafka producer connected');
    }
    catch (err) {
        console.error('Kafka producer connection failed:', err);
        producerInstance = null;
        throw err;
    }
    return producerInstance;
}
async function getConsumer(groupId) {
    if (consumerInstances.has(groupId)) {
        return consumerInstances.get(groupId);
    }
    const consumer = kafka.consumer({ groupId });
    try {
        await consumer.connect();
        console.log(`✅ Kafka consumer connected (group: ${groupId})`);
        consumerInstances.set(groupId, consumer);
    }
    catch (err) {
        console.error(`Kafka consumer connection failed (group: ${groupId}):`, err);
        throw err;
    }
    return consumer;
}
async function sendKafkaMessage(topic, payload) {
    const producer = await getProducer();
    const record = {
        topic,
        messages: [{ value: JSON.stringify(payload) }]
    };
    try {
        await producer.send(record);
        console.log(`📨 Sent message to topic ${topic}`);
    }
    catch (err) {
        console.error(`Failed to send message to topic ${topic}:`, err);
        throw err;
    }
}
exports.default = kafka;
//# sourceMappingURL=kafkaClient.js.map