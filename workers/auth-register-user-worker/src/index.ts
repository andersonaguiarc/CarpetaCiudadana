import * as amqp from 'amqplib';
import axios from 'axios';
import dotenv from 'dotenv';
import { publishMessage } from './rabbitmq/config';
import { randomBytes } from 'crypto';
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

            const password = generateRandomPassword(8);;
            console.log('Generated password:',password);
            parsedMessage['password'] = password;
            parsedMessage['password_confirm'] = password;

            const options = {
                timeout: 3000,
                errorThresholdPercentage: 50,
                resetTimeout: 30000
            };

            const breaker = new CircuitBreaker(axios.post, options);
            await breaker.fire(`${process.env.AUTH_MICROSERVICE_URL}/api/citizens/register`, parsedMessage)
                .then(await async function (response) {
                    console.log('User registered with success', response.data);
                    const NOTIFICATION_EMAIL_QUEUE = 'message_to_email';
                    const emailToSend = {
                        email: parsedMessage.email
                        , subject: 'Tu contraseña temporal'
                        , message: `Hola ${parsedMessage.name}, tu contraseña temporal es: ${password}`
                    }
                    await publishMessage(NOTIFICATION_EMAIL_QUEUE, 'direct', NOTIFICATION_EMAIL_QUEUE, JSON.stringify(emailToSend));
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



function generateRandomPassword(length: number): string {
    const specialCharacters = '!@#$%^&*()_+[]{}|;:,.<>?';
    const allCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' + specialCharacters;

    let password = '';
    let hasSpecialCharacter = false;

    for (let i = 0; i < length; i++) {
        const randomIndex = randomBytes(1)[0] % allCharacters.length;
        const randomChar = allCharacters[randomIndex];
        password += randomChar;

        if (specialCharacters.includes(randomChar)) {
            hasSpecialCharacter = true;
        }
    }

    // Ensure the password contains at least one special character
    if (!hasSpecialCharacter) {
        const randomIndex = randomBytes(1)[0] % specialCharacters.length;
        const randomSpecialChar = specialCharacters[randomIndex];
        const replaceIndex = randomBytes(1)[0] % password.length;
        password = password.substring(0, replaceIndex) + randomSpecialChar + password.substring(replaceIndex + 1);
    }

    return password;
}


run().then(console.error);
