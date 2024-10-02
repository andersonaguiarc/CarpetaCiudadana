import pika
import requests
import json
from config import Config

# Función para procesar el mensaje recibido de RabbitMQ
def callback(ch, method, properties, body):
    try:
        # Convertir el mensaje de la cola a un diccionario de Python
        message = json.loads(body)
        citizen_id = message.get("id")
        operator_url = message.get("operatorUrl")

        # Preparar la solicitud para el servicio CitizensTransfer
        citizens_transfer_url = f"{Config.CITIZEN_TRANSFER_API_URL}/continue/documents"
        payload = message

        # Enviar el mensaje al servicio CitizensTransfer para continuar el procesamiento
        response = requests.post(citizens_transfer_url, json=payload)

        if response.status_code == 200:
            print(f"Procesado correctamente el mensaje para el ciudadano {citizen_id}", flush=True)
        else:
            print(f"Error al procesar el ciudadano {citizen_id}. Detalles: {response.text}", flush=True)

    except Exception as e:
        print(f"Error al procesar el mensaje: {str(e)}", flush=True)

# Configuración de RabbitMQ
def start_worker():
    try:
        credentials = pika.PlainCredentials(Config.USER_RABBITMQ, Config.PASS_RABBITMQ)

        # Conexión a RabbitMQ
        connection = pika.BlockingConnection(pika.ConnectionParameters(
            host=Config.HOST_RABBITMQ,
            port=Config.PORT_RABBITMQ,
            credentials=credentials
        ))
        channel = connection.channel()

        # Declarar la cola desde donde se recibirán los mensajes
        queue_name = Config.QUEUE_NAME_CITIZEN_TO_TRANSFER_REPLIER

        print(f"Esperando mensajes de la cola {queue_name}...", flush=True)

        # Configurar el callback cuando llega un mensaje
        channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)

        # Empezar a consumir mensajes
        channel.start_consuming()

    except Exception as e:
        print(f"Error en el worker: {str(e)}", flush=True)

if __name__ == '__main__':
    start_worker()
