from flask import Flask, request, jsonify
from flask_restful import Resource, Api
import requests
from werkzeug.exceptions import BadRequest

app = Flask(__name__)
api = Api(app)

class CitizensTransfer(Resource):
    def patch(self):
        try:
            # Verificar si el cuerpo de la petición contiene datos JSON
            data = request.get_json()

            # Validar que se reciba el id del ciudadano y el id del nuevo operador
            if 'citizen_id' not in data or 'operator_id' not in data:
                return {"message": "los parámetros 'citizen_id' and 'operator_id' son requeridos."}, 400

            citizen_id = data['citizen_id']
            operator_id = data['operator_id']

            # Lógica de transferencia del ciudadano
            # Revisar JWT
            jwt_token = "jwt generado"

            # Consumir el API de Citizen para hacer unregister del ciudadano
            citizen_api_url = "http://134.122.25.105:30000/users/api/citizens/transfer"
            headers = {
                "Authorization": f"Bearer {jwt_token}"
            }

            # Realizar la petición PATCH al servicio Citizen
            response = requests.patch(citizen_api_url, headers=headers)

            # Verificar la respuesta del servicio de Citizen para continuar
            if response.status_code == 200:
                return {"message": f"El ciudadano {citizen_id} ha sido transferido al {operator_id} de forma exitosa."}, 200
            else:
                # Lógica de resiliencia
                # ...
                return {"message": f"Transferencia del ciudadano {citizen_id} en proceso."}, 200
                #return {"message": "Falló la transferencia del ciudadano en el servicio Citizen.", "details": response.text}, 500

        except BadRequest as e:
            return {"message": "Formato JSON inválido."}, 400
        except Exception as e:
            return {"message": str(e)}, 500

# Ruta y recurso para el API
api.add_resource(CitizensTransfer, '/transfers/api/citizens/transfer')

if __name__ == '__main__':
    app.run(debug=True)
