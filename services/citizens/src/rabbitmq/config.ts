import * as amqp from 'amqplib';
import dotenv from 'dotenv';
dotenv.config();

const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;

export async function publishMessage(exchangeName: string, exchangeType, routingKey:string, message: string) {
    try {


        // Conectar a RabbitMQ
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        // Asegurarse de que el exchange existe
        await channel.assertExchange(exchangeName, exchangeType, { durable: true });

        // Publicar el mensaje en el exchange
        channel.publish(exchangeName, routingKey, Buffer.from(message));
        console.log(`Mensaje publicado: ${message}`);

        // Cerrar la conexión
        setTimeout(() => {
            channel.close();
            connection.close();
        }, 500);
    } catch (error) {
        console.error('Error al publicar el mensaje:', error);
    }
}
