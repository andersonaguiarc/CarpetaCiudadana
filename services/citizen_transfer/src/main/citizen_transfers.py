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
import copy


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

        print(f"Mensaje enviado a RabbitMQ en el exchange '{exchange_rabbit}': {message}" ,flush=True)

        # Cerrar la conexión
        connection.close()

    except Exception as e:
        print(f"Error al enviar el mensaje a RabbitMQ: {str(e)}", flush=True)


# Función para enviar mensaje al exchange documents en RabbitMQ
def send_to_rabbitmq_document(message, exchange_rabbit, routing_key_rabbit):
    try:
        print("publishing to rabbitmq", message, exchange_rabbit, routing_key_rabbit, flush=True)
        message = json.dumps(message)
        credentials = pika.PlainCredentials(Config.USER_RABBITMQ, Config.PASS_RABBITMQ)

        # Conexión a RabbitMQ
        connection = pika.BlockingConnection(pika.ConnectionParameters(
            host=Config.HOST_RABBITMQ, port=Config.PORT_RABBITMQ, credentials=credentials))
        channel = connection.channel()

        # Publicar el mensaje en el exchange
        channel.basic_publish(exchange=exchange_rabbit, routing_key=routing_key_rabbit, body=message)

        print(f"Mensaje enviado a RabbitMQ en el exchange '{exchange_rabbit}': {message}" ,flush=True)

        # Cerrar la conexión
        connection.close()

    except Exception as e:
        print(f"Error al enviar el mensaje a RabbitMQ: {str(e)}", flush=True)


def send_to_rabbitmq_third(message, exchange_rabbit, routing_key_rabbit):
    try:
        message = json.dumps(message)
        credentials = pika.PlainCredentials(Config.USER_RABBITMQ, Config.PASS_RABBITMQ)

        # Conexión a RabbitMQ
        connection = pika.BlockingConnection(pika.ConnectionParameters(
            host=Config.HOST_RABBITMQ, port=Config.PORT_RABBITMQ, credentials=credentials))
        channel = connection.channel()

        # Publicar el mensaje en el exchange
        channel.basic_publish(exchange=exchange_rabbit, routing_key=routing_key_rabbit, body=message)

        print(f"Mensaje enviado a RabbitMQ en el exchange '{exchange_rabbit}': {message}" ,flush=True)

        # Cerrar la conexión
        connection.close()

    except Exception as e:
        print(f"Error al enviar el mensaje a RabbitMQ: {str(e)}", flush=True)


class CitizensTransfer():
    @circuit(failure_threshold=2)
    def request_citizen(self, citizen_api_url, headers):
        response = requests.patch(f"{citizen_api_url}/api/citizens/transfer", headers=headers)
        response.raise_for_status()
        print(f"Response from Citizen API: {response.json()}")
        return response

    @circuit(failure_threshold=2)
    def request_documents(self, documents_api_url, citizen_id):
        print(f"{documents_api_url}/api/v1/documents/files/{citizen_id}", flush=True)

        print("Request Documents",f"{documents_api_url}/api/v1/documents/files/{citizen_id}", flush=True)
        response = requests.post(f"{documents_api_url}/api/v1/documents/files/{citizen_id}")
        response.raise_for_status()
        return response

    @circuit(failure_threshold=2)
    def request_third_party_operator(self, operator_url, documents_response, citizen_response):
        response = requests.post(operator_url, json={
                    **documents_response.json(),
                    "citizenName": citizen_response.json()["name"],
                    "citizenEmail": citizen_response.json()["email"],
                    "confirmationURL": Config.CONFIRMATION_URL
                })
        response.raise_for_status()
        return response

    def patch(self):
        try:
            # Verificar si el cuerpo de la petición contiene datos JSON
            data = request.get_json()
            print("Solicitud de transferencia",data, flush=True)
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
                print(f"Respuesta servicio de citizens... ",citizen_response.json(), flush=True)
            except Exception as err:
                print(f"Error en llamado al servicio de citizens ",err, flush=True)
                message = {
                    "userId": citizen_id,
                    "operatorUrl": operator_url
                }
                exchange=Config.EXCHANGE_NAME_TRANSER_TO_CITIZEN
                routing_key=Config.ROUTINGKEY_NAME_TRANSFER_TO_CITIZEN
                send_to_rabbitmq_citizen(message, exchange, routing_key)
                # Responder al frontend que la transferencia está en proceso
                return {"message": f"Transferencia del ciudadano {citizen_id} en proceso", "details": str(err)}, 200

            # Consumo del servicio Documents
            documents_api_url = Config.DOCUMENT_API_URL     
            try:
                documents_response = self.request_documents(documents_api_url, citizen_id)
                print(f"Respuesta servicio de documents... ",documents_response.json(), flush=True)
            except Exception as err:
                print(f"Error servicio de documents... ",err, flush=True)
                exchange=f"delayed_{Config.QUEUE_NAME_CITIZEN_TO_TRANSFER_REPLIER}"
                citizen_to_register = citizen_response.json()
                citizen_to_register['operatorUrl'] = operator_url
                send_to_rabbitmq_citizen(citizen_to_register, exchange, exchange)
                return {"message": f"Transferencia del ciudadano {citizen_id} en proceso", "details": str(err)}, 200

            # Consumo del servicio operador externo
            try:
                third_party_operator_response = self.request_third_party_operator(operator_url, documents_response, citizen_response)
                print("Respuesta servicio de third_party_operator_response... ",third_party_operator_response.json(), flush=True)
            except Exception as err:
                print("Error servicio de third_party_operator_response... ",err, flush=True)
                exchange=f"delayed_{Config.QUEUE_NAME_CITIZEN_TO_TRANSFER_REPLIER}"
                citizen_to_register = citizen_response.json()
                citizen_to_register['operatorUrl'] = operator_url
                send_to_rabbitmq_citizen(citizen_to_register, exchange, exchange)
                return {"message": f"Transferencia del ciudadano {citizen_id} en proceso", "details": str(err)}, 200

            return {"message": f"El ciudadano {citizen_id} ha sido transferido al {operator_id} de forma exitosa."}, 200

        except BadRequest as e:
            print(f"Error en la petición: {str(e)}", flush=True)
            return {"message": "Formato JSON inválido."}, 400
        except Exception as e:
            print(f"Error en la petición: {str(e)}", flush=True)
            return {"message": str(e)}, 500
        except ValueError as e:
            print(f"Error en la petición: {str(e)}", flush=True)
            raise Unauthorized("Encabezado de autorización mal formado")


# API para recibir el mensaje del worker y continuar el procesamiento en Documents
class CitizensTransferContinueDocuments(Resource):
    def post(self):
        try:
            # Verificar si el cuerpo de la petición contiene datos JSON
            citizen_response = request.get_json()

            citizen_id = citizen_response['citizen_id']
            operator_url = citizen_response['operator_url']

            try:
                # Llamado al servicio de Documents
                documents_service_url = Config.DOCUMENT_API_URL
                documents_response = requests.post(f"{documents_service_url}/api/v1/documents/files/{citizen_id}")
            except Exception as err:
                #send_to_rabbitmq_document(citizen_response.json())
                print("Error servicio de documents Resiliencia... ",err, flush=True)
                return {"message": f"Transferencia del ciudadano {citizen_id} en proceso", "details": str(err)}, 500

            try:
                # Llamado al servicio del operador externo
                third_party_operator_response = self.request_third_party_operator(operator_url, documents_response, citizen_response)
                print("Respuesta servicio de third_party_operator_response Resiliencia... ",third_party_operator_response.json(), flush=True)
            except Exception as err:
                print("Error servicio de third_party_operator_response Resiliencia... ",err, flush=True)
                #send_to_rabbitmq_document(citizen_response.json())
                return {"message": f"Transferencia del ciudadano {citizen_id} en proceso", "details": str(err)}, 500

            return {"message": f"El ciudadano {citizen_id} ha sido transferido al {operator_url} de forma exitosa."}, 200

        except Exception as e:
            return {"message": str(e)}, 500
        
# API para recibir el mensaje del worker register_transfer_citizen y continuar el procesamiento en Documents
class RegisterTransferDocuments(Resource):
    def post(self):
        try:
            citizen_worker_response = request.get_json()
            print("citizen_worker_response", citizen_worker_response, flush=True)
            # Transformar a mensaje válido para Documents
            citizen_worker_response['citizenName'] = citizen_worker_response.pop('name')
            citizen_worker_response['citizenEmail'] = citizen_worker_response.pop('email')
            citizen_worker_response['confirmationURL'] = citizen_worker_response.pop('operatorUrl')
            citizen_worker_response.pop('address', None)

            message_documents = json.dumps(citizen_worker_response)
            register_documents_url = Config.REGISTER_DOCUMENTS_API_URL
            try:
                register_documents_response = requests.post(register_documents_url, json=message_documents)
            except Exception as err:
                exchange=Config.EXCHANGE_NAME_REGISTER_TRANSFER_TO_DOCUMENTS
                routing_key=Config.ROUTINGKEY_NAME_REGISTER_TRANSFER_TO_DOCUMENTS
                send_to_rabbitmq_document(message_documents, exchange, routing_key)
                return {"message": "Transferencia del ciudadano en proceso", "details": str(err)}, 200
            
            # Confirmar al Operador tercero la transferencia exitosa
            operator_url = citizen_worker_response['confirmationURL']
            message_third = json.dumps({"message": "Citizen received"})
            try:
                register_third_response = requests.post(operator_url, message_third)
            except Exception as err:
                exchange=Config.EXCHANGE_NAME_REGISTER_TRANSFER_TO_THIRD
                routing_key=Config.ROUTINGKEY_NAME_REGISTER_TRANSFER_TO_THIRD
                send_to_rabbitmq_third(message_third, exchange, routing_key)
                return {"message": "Confirmación al operador externo en proceso", "details": str(err)}, 200
            
            return {"message": "Citizen received"}, 200

        except Exception as e:
            return {"message": str(e)}, 500
        
# API para recibir el mensaje del worker register_transfer_document y enviar la notificación al tercero
class RegisterTransferThird(Resource):
    def post(self):
        try:
            document_worker_response = request.get_json()


            message_documents = json.dumps(document_worker_response)
            register_documents_url = Config.REGISTER_DOCUMENTS_API_URL
    
            
            # Confirmar al Operador tercero la transferencia exitosa
            operator_url = message_documents['operatorURL']
            id = message_documents['idCitizen']
            message_third = json.dumps({"id": id})
            try:
                register_third_response = requests.post(operator_url, message_third)
            except Exception as err:
                exchange=Config.EXCHANGE_NAME_REGISTER_TRANSFER_TO_THIRD
                routing_key=Config.ROUTINGKEY_NAME_REGISTER_TRANSFER_TO_THIRD
                send_to_rabbitmq_third(message_third, exchange, routing_key)
                return {"message": "Confirmación al operador externo en proceso", "details": str(err)}, 200
            
            return {"message": "Success Notify"}, 200

        except Exception as e:
            return {"message": str(e)}, 500
        


class RegisterTransferedCitizen(Resource):
    
    @circuit(failure_threshold=2)
    def request_register_transfered_citizen(self, register_citizen_url, message_request):
        # Enviar mensaje servicio RegisterCitizen
        register_transfered_citizen_response = requests.post(register_citizen_url, json=message_request)
        register_transfered_citizen_response.raise_for_status()       
        return register_transfered_citizen_response
    
    @circuit(failure_threshold=2)
    def request_register_transfered_documents(self, register_citizen_url, message_request):
        # Enviar mensaje servicio RegisterCitizen
        register_transfered_documents_response = requests.post(register_citizen_url, json=message_request)
        register_transfered_documents_response.raise_for_status()
        return register_transfered_documents_response
    
    @circuit(failure_threshold=2)
    def request_register_third_party_operator(self, operator_url, message_request):
        register_transfered_third_response = requests.post(operator_url, json=message_request)
        register_transfered_third_response.raise_for_status()
        return register_transfered_third_response
    
    
    def post(self):
        register_transfered_citizen = request.get_json()
        register_transfered_citizen_queue = copy.deepcopy(register_transfered_citizen)
        register_transfered_document = copy.deepcopy(register_transfered_citizen)

        # Transformar JSON a mensaje esperado para Citizen
        register_transfered_citizen['name'] = register_transfered_citizen.pop('name')
        register_transfered_citizen['email'] = register_transfered_citizen.pop('email')
        register_transfered_citizen.pop('Documents', None)
        register_transfered_citizen['address'] = 'Transfered'
        register_transfered_citizen['operatorUrl'] = register_transfered_citizen.pop('confirmationURL')

        # Convertir el diccionario actualizado en un JSON string
        message_citizen = register_transfered_citizen
        message_documents = register_transfered_document
        message_third = {"id": register_transfered_citizen['id']}

        message_documents['Documents'] = message_documents.pop('documents')

        # Registro de nuevo ciudadano a Citizen
        register_citizen_url = Config.REGISTER_CITIZEN_API_URL
        try:
            print("message_citizen", message_citizen, flush=True)
            register_citizen_response = self.request_register_transfered_citizen(register_citizen_url, message_citizen)
        except Exception as err:
            print("Error en llamado al servicio de citizens ",err, flush=True)
            exchange=Config.EXCHANGE_NAME_REGISTER_TRANSFER_TO_CITIZEN
            routing_key=Config.ROUTINGKEY_NAME_REGISTER_TRANSFER_TO_CITIZEN
            #Crear mensaje para el exchange de Citizen
            register_transfered_citizen_queue['name'] = register_transfered_citizen_queue.pop('name')
            register_transfered_citizen_queue['email'] = register_transfered_citizen_queue.pop('email')
            register_transfered_citizen_queue['operatorUrl'] = register_transfered_citizen_queue.pop('confirmationURL')
            register_transfered_citizen_queue['address'] = 'Transfered'
            message_citizen_queue = json.dumps(register_transfered_citizen_queue)
            # Encolar si falla Citizen
            send_to_rabbitmq_citizen(message_citizen_queue, exchange, routing_key)
            return {"message": "Transferencia del ciudadano en proceso", "details": str(err)}, 200
        
        # Transferir documentos a Documents
        register_documents_url = Config.REGISTER_DOCUMENTS_API_URL
        try:
            print("message_documents", message_documents, flush=True)
            register_documents_response = self.request_register_transfered_documents(register_documents_url, message_documents)
        except Exception as err:
            print("Error en llamado al servicio de documents ",err, flush=True)
            exchange=Config.EXCHANGE_NAME_REGISTER_TRANSFER_TO_DOCUMENTS
            routing_key=Config.ROUTINGKEY_NAME_REGISTER_TRANSFER_TO_DOCUMENTS
            send_to_rabbitmq_citizen(message_documents, exchange, routing_key)
            return {"message": "Transferencia del ciudadano en proceso", "details": str(err)}, 200
        
        # Confirmar al Operador tercero la transferencia exitosa
        operator_url = register_transfered_citizen['operatorUrl']
        try:
            print("message_third", message_third, flush=True)
            register_third_response = self.request_register_transfered_documents(operator_url, message_third)
        except Exception as err:
            print("Error en llamado al servicio de third ",err, flush=True)
            exchange=Config.EXCHANGE_NAME_REGISTER_TRANSFER_TO_THIRD
            routing_key=Config.ROUTINGKEY_NAME_REGISTER_TRANSFER_TO_THIRD
            send_to_rabbitmq_third(message_third, exchange, routing_key)
            return {"message": "Confirmación al operador externo en proceso", "details": str(err)}, 200
        

        return {"message": "Citizen received"}, 200


# API heartbeat
class Heartbeat(Resource):
    def get(self):
        try:
            return {"message": "This is working!","path": "/api/info"}, 200
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500
    
    def post(self):
        try:
            return {"message": "This is working!","path": "/api/info"}, 200
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

app.add_url_rule(
        f"/transfers/api/citizens/transfer",
        view_func=CitizensTransfer().patch,
        methods=["PATCH"],
    )

# Rutas y recursos para las APIs
#api.add_resource(CitizensTransfer, '/transfers/api/citizens/transfer')
api.add_resource(CitizensTransferContinueDocuments, '/transfers/api/citizens/transfer/continue/documents')
api.add_resource(RegisterTransferedCitizen, '/transfers/api/citizens/external')
api.add_resource(RegisterTransferDocuments, '/transfers/api/documents/external')
api.add_resource(RegisterTransferThird, '/transfers/api/third/notify')
api.add_resource(Heartbeat, '/api/info')

if __name__ == '__main__':
    print(f"Starting Citizen Transfer Service on port {Config.PORT}", flush=True)
    app.run(host='0.0.0.0', debug=True, port=Config.PORT, use_reloader=False)