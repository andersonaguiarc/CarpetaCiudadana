import pika
import requests
import json
from circuitbreaker import circuit
from typing import Dict
from pika.adapters.blocking_connection import BlockingChannel
from pika.spec import Basic, BasicProperties
from config import Config


# Función para procesar el mensaje recibido de RabbitMQ
@circuit(failure_threshold=2)
def callback(ch, method, properties, body):
    try:
        print(f"Mensaje recibido: {body}", flush=True,)
        # Convertir el mensaje de la cola a un diccionario de Python
        message = json.loads(body)
        operatorUrl = message['confirmationURL']
        idCitizen = message['id']
        message_third = {"operatorURL":operatorUrl, "id":idCitizen}
        message_third_formated = json.dumps(message_third)     
        register_transfer_third_url = Config.REGISTER_TRANSFER_THIRD_API_URL
        # Enviar el mensaje directamente sin desempaquetar
        register_transfer_third_response = requests.post(register_transfer_third_url, json=message_third_formated)

        register_transfer_third_response.raise_for_status()
       
        ch.basic_ack(delivery_tag=method.delivery_tag)
        print(
            f"Notify third-party sent: {register_transfer_third_response.json()}",
            flush=True,
        )

    except Exception as e:

        ch.basic_nack(
                delivery_tag=method.delivery_tag, requeue=False, multiple=False
            )

        ch.basic_publish(
            exchange=f"delayed_{Config.EXCHANGE_NAME_REGISTER_TRANSFER_TO_THIRD}",
            routing_key=f"delayed_{Config.EXCHANGE_NAME_REGISTER_TRANSFER_TO_THIRD}",
            body=message,
        )
        print(f"Error al procesar el mensaje de la cola: {str(e)}", flush=True)

# Configuración de RabbitMQ
def main():
    try:
        print("Iniciando worker...", flush=True)
        credentials = pika.PlainCredentials(Config.USER_RABBITMQ, Config.PASS_RABBITMQ)

        # Conexión a RabbitMQ
        connection = pika.BlockingConnection(pika.ConnectionParameters(
            host=Config.HOST_RABBITMQ,
            port=Config.PORT_RABBITMQ,
            credentials=credentials
        ))
        channel = connection.channel()

        # Cola desde donde se recibirán los mensajes de documents una vez almacenados los documentos del ciudadano
        queue_name = Config.QUEUE_NAME_REGISTER_TRANSFER_TO_DOCUMENT
        #channel.queue_declare(queue=queue_name, durable=True)

        print(f"Esperando mensajes de la cola {queue_name}...", flush=True)

        # Configurar el callback cuando llega un mensaje
        channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)

        # Empezar a consumir mensajes
        channel.start_consuming()

    except Exception as e:
        print(f"Error en el worker: {str(e)}", flush=True)

if __name__ == '__main__':
    main()
