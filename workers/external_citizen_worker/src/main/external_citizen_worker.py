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
        print(f"Mensaje recibido: {body}")
        # Convertir el mensaje de la cola a un diccionario de Python
        message = json.loads(body)    
        register_transfered_citizen_url = Config.REGISTER_TRANSFERED_CITIZEN_API_URL
        # Enviar el mensaje directamente sin desempaquetar
        register_transfered_citizen_response = requests.post(register_transfered_citizen_url, json=message)

        register_transfered_citizen_response.raise_for_status()
        print(
            f"Info citizen transfered: {register_transfered_citizen_response.json()}",
            flush=True,
        )

    except Exception as e:
        print(f"Error al procesar el mensaje de la cola: {str(e)}")

# Configuración de RabbitMQ
def main():
    try:
        print("Iniciando worker...")
        credentials = pika.PlainCredentials(Config.USER_RABBITMQ, Config.PASS_RABBITMQ)

        # Conexión a RabbitMQ
        connection = pika.BlockingConnection(pika.ConnectionParameters(
            host=Config.HOST_RABBITMQ,
            port=Config.PORT_RABBITMQ,
            credentials=credentials
        ))
        channel = connection.channel()

        # Declarar la cola desde donde se recibirán los mensajes
        queue_name = Config.QUEUE_NAME_EXTERNAL_CITIZEN_TO_REGISTER
        #channel.queue_declare(queue=queue_name, durable=True)

        print(f"Esperando mensajes de la cola {queue_name}...")

        # Configurar el callback cuando llega un mensaje
        channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)

        # Empezar a consumir mensajes
        channel.start_consuming()

    except Exception as e:
        print(f"Error en el worker: {str(e)}")

if __name__ == '__main__':
    print('dentro de main')
    main()
