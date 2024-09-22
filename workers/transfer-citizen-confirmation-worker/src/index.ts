import * as amqp from 'amqplib';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
const QUEUE_NAME = process.env.TRANSFER_CONFIRMATION_QUEUE_NAME;

let channel: amqp.Channel;

const consumeMessage = async (msg: amqp.ConsumeMessage | null) => {
    if (msg) {
        const messageContent = msg.content.toString();
        const parsedMessage = JSON.parse(messageContent);
        console.log('Received message:', parsedMessage);

        await axios.delete(`${process.env.CITIZENS_MICROSERVICE_URL}/api/citizens/${parsedMessage.id}`);

        channel.ack(msg);
    }
};

const run = async () => {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertQueue(QUEUE_NAME, { durable: true });
        console.log(`Waiting for messages in queue: ${QUEUE_NAME}`);

        channel.consume(QUEUE_NAME, consumeMessage, { noAck: false });
    } catch (error) {
        console.log('Error in RabbitMQ consumer:', error);
    }
};

run().then(console.error);
