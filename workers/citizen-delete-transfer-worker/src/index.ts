import * as amqp from 'amqplib';
import axios from 'axios';
import dotenv from 'dotenv';
const CircuitBreaker = require("opossum");
dotenv.config();

const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
const QUEUE_NAME = process.env.DELETE_TRANSFER_QUEUE_NAME;

let channel: amqp.Channel;

const consumeMessage = async (msg: amqp.ConsumeMessage | null) => {
    if (msg) {
        try {

            const messageContent = msg.content.toString();

            console.log('Received message content:', messageContent);

            const parsedMessage = JSON.parse(messageContent);
            console.log('Received message:', parsedMessage);

            const options = {
                timeout: 3000,
                errorThresholdPercentage: 50,
                resetTimeout: 30000
            };
    
            const breaker = new CircuitBreaker(axios.patch, options);
            await breaker.fire(`${process.env.CITIZENS_MICROSERVICE_URL}/api/citizens/transfer-reply`, parsedMessage)
                .then(function (response) {
                    console.log('User transfered with success', response.data);
                    channel.ack(msg);
    
                })
                .catch(function (error) {
                    console.log('Failed to transfer user', error.response.data);
                    channel.nack(msg, false, false);
                });

            channel.ack(msg);
        } catch (error) {
            console.log('Error in RabbitMQ consumer:', error);
            channel.nack(msg, false, false);
        }
    }
};

const run = async () => {
    try {
        
        console.log('Connecting to RabbitMQ:', RABBITMQ_URL);

        const connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertQueue(QUEUE_NAME, { durable: true });
        console.log(`Waiting for messages in queue: ${QUEUE_NAME}`);

        channel.consume(QUEUE_NAME, consumeMessage, { noAck: false });
    } catch (error) {
        console.log('Error in RabbitMQ consumer RUN:', error);
    }
};

run().then(console.error);
