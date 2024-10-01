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
        register_transfer_documents_url = Config.REGISTER_TRANSFER_DOCUMENT_API_URL
        # Enviar el mensaje directamente sin desempaquetar
        register_transfer_documents_response = requests.post(register_transfer_documents_url, json=message)

        register_transfer_documents_response.raise_for_status()
        print(
            f"Info documents transfered: {register_transfer_documents_response.json()}",
            flush=True,
        )

    except Exception as e:
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

        # Cola desde donde se recibirán los mensajes de citizen una vez registrado el ciudadano
        queue_name = Config.QUEUE_NAME_REGISTER_TRANSFER_TO_CITIZEN
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
