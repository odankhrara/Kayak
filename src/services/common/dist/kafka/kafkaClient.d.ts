import { Kafka, Producer, Consumer } from 'kafkajs';
import { KafkaTopic } from './topics';
declare const kafka: Kafka;
export declare function getProducer(): Promise<Producer>;
export declare function getConsumer(groupId: string): Promise<Consumer>;
export declare function sendKafkaMessage(topic: KafkaTopic, payload: unknown): Promise<void>;
export default kafka;
//# sourceMappingURL=kafkaClient.d.ts.map