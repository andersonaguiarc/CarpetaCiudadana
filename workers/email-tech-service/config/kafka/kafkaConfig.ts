import dotenv from 'dotenv';
import { KafkaConfig } from 'kafkajs';
dotenv.config();

const consumer = process.env.KAFKA_CLIENT_ID;
export const kafkaConsumer = { groupId: consumer };

const consumerTopic = process.env.KAFKA_CONSUMER_TOPIC;
export const kafkaConsumerOptions = {topic: consumerTopic, fromBeginning: true};

export const kafkaConfig: KafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID,
  brokers: [ process.env.KAFKA_BROKER_URL ],
  ssl: true,
  sasl: {
      mechanism: 'plain',
      username: process.env.KAFKA_KEY,
      password: process.env.KAFKA_SECRET
  }
}
