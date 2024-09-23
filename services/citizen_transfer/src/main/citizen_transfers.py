from flask import Flask, request, jsonify
from flask_restful import Resource, Api
import requests
import jwt
from werkzeug.exceptions import BadRequest, Unauthorized
from config import Config
import util

app = Flask(__name__)
api = Api(app)

class CitizensTransfer(Resource):
    def patch(self):
        try:
            # Verificar si el cuerpo de la petición contiene datos JSON
            data = request.get_json()

            # validar la existencia del encabezado Authorization
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

            # Obtener la URL del servicio Citizen desde el archivo de configuración
            citizen_api_url = Config.CITIZEN_API_URL

            # Consumir el API de Citizen para hacer unregister del ciudadano
            headers = {
                "Authorization": auth_header
            }

            # Realizar la petición PATCH al servicio Citizen
            response = requests.patch(citizen_api_url, headers=headers)

            # Verificar la respuesta del servicio de Citizen para continuar
            if response.status_code == 200:
                return {"message": f"El ciudadano {citizen_id} ha sido transferido al {operator_id} de forma exitosa."}, 200
            else:
                # Lógica de resiliencia
                # ...
                #return {"message": f"Transferencia del ciudadano {citizen_id} en proceso."}, 200
                return {"message": f"Transferencia del ciudadano {citizen_id} en proceso", "details": response.text}, 200

        except BadRequest as e:
            return {"message": "Formato JSON inválido."}, 400
        except Exception as e:
            return {"message": str(e)}, 500
        except ValueError as e:
                raise Unauthorized("Encabezado de autorización mal formado")

# Ruta y recurso para el API
api.add_resource(CitizensTransfer, '/transfers/api/citizens/transfer')

if __name__ == '__main__':
    app.run(debug=True)
