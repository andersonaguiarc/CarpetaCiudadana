from flask import Flask, request, jsonify
from flask_restful import Resource, Api
import requests
import jwt
import json
import pika
from werkzeug.exceptions import BadRequest, Unauthorized
from config import Config
import util
from circuitbreaker import circuit

app = Flask(__name__)
def ping():
    return jsonify({"message": "This is working!", "path": "/api/info"}), 200
app.add_url_rule(
        "/api/info",
        view_func=ping,
        methods=["GET"],
    )

api = Api(app)

# Función para enviar mensaje al exchange citizen en RabbitMQ
def send_to_rabbitmq_citizen(message):
    try:
        message = json.dumps(message)
        credentials = pika.PlainCredentials(Config.USER_RABBITMQ, Config.PASS_RABBITMQ)

        # Conexión a RabbitMQ
        connection = pika.BlockingConnection(pika.ConnectionParameters(
            host=Config.HOST_RABBITMQ, port=Config.PORT_RABBITMQ, credentials=credentials))
        channel = connection.channel()

        # Publicar el mensaje en el exchange
        channel.basic_publish(exchange=Config.EXCHANGE_NAME_TRANSER_TO_CITIZEN, routing_key=Config.ROUTINGKEY_NAME_TRANSFER_TO_CITIZEN, body=message)

        print(f"Mensaje enviado a RabbitMQ en el exchange '{Config.EXCHANGE_NAME_TRANSER_TO_CITIZEN}': {message}")

        # Cerrar la conexión
        connection.close()

    except Exception as e:
        print(f"Error al enviar el mensaje a RabbitMQ: {str(e)}")


# Función para enviar mensaje al exchange citizen en RabbitMQ
def send_to_rabbitmq_document(message):
    try:
        message = json.dumps(message)
        credentials = pika.PlainCredentials(Config.USER_RABBITMQ, Config.PASS_RABBITMQ)

        # Conexión a RabbitMQ
        connection = pika.BlockingConnection(pika.ConnectionParameters(
            host=Config.HOST_RABBITMQ, port=Config.PORT_RABBITMQ, credentials=credentials))
        channel = connection.channel()

        # Publicar el mensaje en el exchange
        channel.basic_publish(exchange=Config.EXCHANGE_NAME_TRANSER_TO_DOCUMENT, routing_key=Config.ROUTINGKEY_NAME_TRANSFER_TO_DOCUMENT, body=message)

        print(f"Mensaje enviado a RabbitMQ en el exchange '{Config.EXCHANGE_NAME_TRANSER_TO_DOCUMENT}': {message}")

        # Cerrar la conexión
        connection.close()

    except Exception as e:
        print(f"Error al enviar el mensaje a RabbitMQ: {str(e)}")


class CitizensTransfer(Resource):
    @circuit(failure_threshold=2)
    def request_citizen(self, citizen_api_url, headers):
        response = requests.patch(citizen_api_url, headers=headers)
        response.raise_for_status()
        return response

    @circuit(failure_threshold=2)
    def request_documents(self, documents_api_url, citizen_id):
        response = requests.post(f"{documents_api_url}/api/v1/documents/files/{citizen_id}")

        response.raise_for_status()
        return response

    @circuit(failure_threshold=2)
    def request_third_party_operator(self, operator_url, documents_response, citizen_response):
        response = requests.post(operator_url, json={
                    **documents_response.json(),
                    "citizenName": citizen_response.json()["name"],
                    "citizenEmail": citizen_response.json()["email"]
                })
        response.raise_for_status()
        return response

    def patch(self):
        try:
            # Verificar si el cuerpo de la petición contiene datos JSON
            data = request.get_json()

            # Validar la existencia del encabezado Authorization
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                raise Unauthorized("Falta el encabezado de autorización")

            # Validar el formato debe ser 'Bearer <token>'
            bearer, token = auth_header.split()
            if bearer.lower() != 'bearer':
                raise Unauthorized("Formato de token inválido")

            # Validar que se reciba el id del operador y su URL
            if 'operator_id' not in data or 'operator_url' not in data:
                return {"message": "los parámetros 'operator_id' y 'operator_url' son requeridos."}, 400

            # Obtener del JWT el citizen_id
            payload = util.decode_jwt(token)
            citizen_id = payload.get('id')

            operator_id = data['operator_id']
            operator_url = data['operator_url']

            # Obtener la URL del servicio Citizen desde el archivo de configuración
            citizen_api_url = Config.CITIZEN_API_URL

            # Consumir el API de Citizen para hacer unregister del ciudadano
            headers = {
                "Authorization": auth_header
            }

            # Realizar la petición PATCH al servicio Citizen
            try: 
                citizen_response = self.request_citizen(citizen_api_url, headers)
            except Exception as err:
                print(err, flush=True)
                message = {
                    "userId": citizen_id,
                    "operatorUrl": operator_url
                }
                send_to_rabbitmq_citizen(message)
                # Responder al consumidor que la transferencia está en proceso
                return {"message": f"Transferencia del ciudadano {citizen_id} en proceso", "details": str(err)}, 200

            # Obtener la URL del servicio Documents desde el archivo de configuración
            documents_api_url = Config.DOCUMENT_API_URL
            
            try:
                documents_response = self.request_documents(documents_api_url, citizen_id)
            except Exception as err:
                send_to_rabbitmq_document(citizen_response.json())
                return {"message": f"Transferencia del ciudadano {citizen_id} en proceso", "details": str(err)}, 200

            try:
                third_party_operator_response = self.request_third_party_operator(operator_url, documents_response, citizen_response)
            except Exception as err:
                send_to_rabbitmq_document(citizen_response.json())
                return {"message": f"Transferencia del ciudadano {citizen_id} en proceso", "details": str(err)}, 200

            return {"message": f"El ciudadano {citizen_id} ha sido transferido al {operator_id} de forma exitosa."}, 200

        except BadRequest as e:
            return {"message": "Formato JSON inválido."}, 400
        except Exception as e:
            return {"message": str(e)}, 500
        except ValueError as e:
            raise Unauthorized("Encabezado de autorización mal formado")


# API para recibir el mensaje del worker y continuar el procesamiento en Documents
class CitizensTransferContinueDocuments(Resource):
    def post(self):
        try:
            # Verificar si el cuerpo de la petición contiene datos JSON
            data = request.get_json()

            if 'citizen_id' not in data or 'operator_url' not in data:
                return {"message": "Los parámetros 'citizen_id' y 'operator_url' son requeridos."}, 400

            citizen_id = data['citizen_id']
            operator_url = data['operator_url']

            # Aquí iría la lógica de procesamiento del documento con el servicio de Documents

            return {"message": f"Consulta exitosa de URL's para el operador {operator_url} para el ciudadano {citizen_id}"}, 200

            
            '''
            documents_service_url = Config.DOCUMENTS_API_URL
            headers = {
                "Content-Type": "application/json"
            }
            payload = {
                "citizen_id": citizen_id,
                "operator_url": operator_url
            }

            # Enviar solicitud al servicio Documents
            response = requests.post(documents_service_url, json=payload, headers=headers)

            if response.status_code == 200:
                return {"message": f"Documento procesado correctamente para el ciudadano {citizen_id}"}, 200
            else:
                return {"message": f"Error al procesar el documento para el ciudadano {citizen_id}", "details": response.text}, 500

            '''

        except Exception as e:
            return {"message": str(e)}, 500


# Rutas y recursos para las APIs
api.add_resource(CitizensTransfer, '/transfers/api/citizens/transfer')
api.add_resource(CitizensTransferContinueDocuments, '/transfers/api/citizens/transfer/continue/documents')




if __name__ == '__main__':
    app.run(debug=True)