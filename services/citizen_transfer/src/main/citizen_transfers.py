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

api = Api(app)

# Función para enviar mensaje al exchange citizen en RabbitMQ
def send_to_rabbitmq_citizen(message, exchange_rabbit, routing_key_rabbit):
    try:
        message = json.dumps(message)
        credentials = pika.PlainCredentials(Config.USER_RABBITMQ, Config.PASS_RABBITMQ)

        # Conexión a RabbitMQ
        connection = pika.BlockingConnection(pika.ConnectionParameters(
            host=Config.HOST_RABBITMQ, port=Config.PORT_RABBITMQ, credentials=credentials))
        channel = connection.channel()

        # Publicar el mensaje en el exchange
        channel.basic_publish(exchange=exchange_rabbit, routing_key=routing_key_rabbit, body=message)

        print(f"Mensaje enviado a RabbitMQ en el exchange '{exchange_rabbit}': {message}")

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
                exchange=Config.EXCHANGE_NAME_TRANSER_TO_CITIZEN
                routing_key=Config.ROUTINGKEY_NAME_TRANSFER_TO_CITIZEN
                send_to_rabbitmq_citizen(message, exchange, routing_key)
                # Responder al frontend que la transferencia está en proceso
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
            citizen_response = request.get_json()

            citizen_id = citizen_response['citizen_id']
            operator_url = citizen_response['operator_url']
            operator_id = citizen_response['operator_id']

            try:
                # Llamado al servicio de Documents
                documents_service_url = Config.DOCUMENT_API_URL
                documents_response = requests.post(f"{documents_service_url}/api/v1/documents/files/{citizen_id}")
            except Exception as err:
                send_to_rabbitmq_document(citizen_response.json())
                return {"message": f"Transferencia del ciudadano {citizen_id} en proceso", "details": str(err)}, 200

            try:
                # Llamado al servicio del operador externo
                third_party_operator_response = self.request_third_party_operator(operator_url, documents_response, citizen_response)
            except Exception as err:
                send_to_rabbitmq_document(citizen_response.json())
                return {"message": f"Transferencia del ciudadano {citizen_id} en proceso", "details": str(err)}, 200

            return {"message": f"El ciudadano {citizen_id} ha sido transferido al {operator_id} de forma exitosa."}, 200

        except Exception as e:
            return {"message": str(e)}, 500
        

class RegisterTransferedCitizen(Resource):
    
    @circuit(failure_threshold=2)
    def request_register_transfered_citizen(self, register_citizen_url, message_request):
        # Enviar mensaje servicio RegisterCitizen
        register_transfered_citizen_response = requests.post(register_citizen_url, json=message_request)
        register_transfered_citizen_response.raise_for_status()
        
        return register_transfered_citizen_response
    
    
    def post(self):
        register_transfered_citizen = request.get_json()

        # Transformar JSON a mensaje esperado por CitizenRegister
        register_transfered_citizen['name'] = register_transfered_citizen.pop('citizenName')
        register_transfered_citizen['email'] = register_transfered_citizen.pop('citizenEmail')
        register_transfered_citizen.pop('Documents', None)
        register_transfered_citizen['address'] = 'Transfered'
        register_transfered_citizen['operatorUrl'] = register_transfered_citizen.pop('confirmationURL')

        # Convertir el diccionario actualizado en un JSON string
        message = json.dumps(register_transfered_citizen)

        # Registro de nuevo ciudadano a Citizen
        register_citizen_url = Config.REGISTER_CITIZEN_API_URL
        try:
            register_citizen_response = self.request_register_transfered_citizen(register_citizen_url, message)
        except Exception as err:
            exchange=Config.EXCHANGE_NAME_REGISTER_TRANSFER_TO_CITIZEN
            routing_key=Config.ROUTINGKEY_NAME_REGISTER_TRANSFER_TO_CITIZEN
            send_to_rabbitmq_citizen(message, exchange, routing_key)
            return {"message": f"Transferencia del ciudadano {register_transfered_citizen['id']} en proceso", "details": str(err)}, 200

        # Imprimir el JSON formateado
        #print(message)

        # Devolver una respuesta con el mensaje transformado
        return {"message": "Citizen received", "data": register_transfered_citizen}, 200


# API heartbeat
class Heartbeat(Resource):
    def get(self):
        try:
            print("Heartbeat")
            return {"message": "This is working!","path": "/api/info"}, 200
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500


# Rutas y recursos para las APIs
api.add_resource(CitizensTransfer, '/transfers/api/citizens/transfer')
api.add_resource(CitizensTransferContinueDocuments, '/transfers/api/citizens/transfer/continue/documents')
api.add_resource(RegisterTransferedCitizen, '/transfers/api/citizens/external')
api.add_resource(Heartbeat, '/api/info')

if __name__ == '__main__':
    app.run(host='localhost', debug=True, port=Config.PORT)