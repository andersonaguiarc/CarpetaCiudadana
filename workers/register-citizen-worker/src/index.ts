import * as amqp from 'amqplib';
import axios from 'axios';
import dotenv from 'dotenv';
import { publishMessage } from './rabbitmq/config';
const CircuitBreaker = require("opossum");
dotenv.config();

const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
const QUEUE_NAME = process.env.USER_TO_REGISTER_QUEUE_NAME;

let channel: amqp.Channel;

const consumeMessage = async (msg: amqp.ConsumeMessage | null) => {
    if (msg) {
        const messageContent = msg.content.toString();
        const parsedMessage = JSON.parse(messageContent);
        console.log('Received message:', parsedMessage);


        const options = {
            timeout: 3000,
            errorThresholdPercentage: 50,
            resetTimeout: 30000
        };

        const breaker = new CircuitBreaker(axios.post, options);
        await breaker.fire(`${process.env.CITIZENS_MICROSERVICE_URL}/api/citizens/register`, parsedMessage)
            .then(function (response) {
                console.log('User registered with success', response.data);
                channel.ack(msg);

            })
            .catch(await async function (error) {
                console.log('Failed to register user', error.response.data);
                channel.nack(msg, false, false);

                const DELAYED_QUEUE_NAME = 'delayed_citizen_to_register';

                await publishMessage(DELAYED_QUEUE_NAME, 'direct', DELAYED_QUEUE_NAME, messageContent);

            });


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
