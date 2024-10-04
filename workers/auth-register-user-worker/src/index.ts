import * as amqp from 'amqplib';
import axios from 'axios';
import dotenv from 'dotenv';
const CircuitBreaker = require("opossum");

dotenv.config();

const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
const QUEUE_NAME = process.env.DELETE_USER_QUEUE_NAME;

let channel: amqp.Channel;

const consumeMessage = async (msg: amqp.ConsumeMessage | null) => {
    if (msg) {
        try {

            const messageContent = msg.content.toString();
            const parsedMessage = JSON.parse(messageContent);
            console.log('Received message:', parsedMessage);

            const password = "123456";

            parsedMessage['password'] = password;
            parsedMessage['password_confirm'] = password;

            const options = {
                timeout: 3000,
                errorThresholdPercentage: 50,
                resetTimeout: 30000
            };

            const breaker = new CircuitBreaker(axios.post, options);
            await breaker.fire(`${process.env.AUTH_MICROSERVICE_URL}/api/citizens/register`, parsedMessage)
                .then(function (response) {
                    console.log('User registered with success', response.data);
                    channel.ack(msg);

                })
                .catch(function (error) {
                    console.log('Failed to register user', error.response.data);
                    channel.nack(msg, false, false);
                });




        } catch (error) {
            console.log('Error in consumer:', error);
            channel.nack(msg, false, false);
        }
    }
};

const run = async () => {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertQueue('register_to_auth	', {
            durable: true
        });
        console.log(`Waiting for messages in queue: register_to_auth`);

        channel.consume('register_to_auth', consumeMessage, { noAck: false });
    } catch (error) {
        console.log('Error in RabbitMQ consumer:', error);
    }
};

run().then(console.error);
