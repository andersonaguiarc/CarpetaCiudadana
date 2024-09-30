from flask import Flask, request, jsonify
from flask_restful import Resource, Api
import jwt  # Librería para manejar JWT
from werkzeug.exceptions import BadRequest, Unauthorized
from config import Config
import json

app = Flask(__name__)
api = Api(app)

# Clave secreta para decodificar los JWT (debe mantenerse segura y coincidir con la que se utiliza para firmar los tokens)
SECRET_KEY = "mi_clave_secreta"

def verificar_jwt(token):
    try:
        # Decodificar el JWT usando la clave secreta
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload  # Devuelve la información del JWT si es válido
    except jwt.ExpiredSignatureError:
        raise Unauthorized("El token ha expirado")
    except jwt.InvalidTokenError:
        raise Unauthorized("Token inválido")

class MocksDocument(Resource):
    
    def delete(self, id_citizen):
        return {"message": f"Los documentos del ciudadano {id_citizen} se eliminaron correctamente"}, 201
    
    def get(self, id_citizen):
        url_signed = "http://nube.com/citizen?accesKey=AKIA6AAJD5P3DPFKIFP5&Signature=XK9Gj3LM%2BHmtkAjuvXqb90Z5XCY%3D&Expires=1727623915"
        return {
            "idCitizen": id_citizen,
            "url": url_signed
        }, 200
    
class MocksCitizen(Resource):
    
    def patch(self):
        # Obtener el JWT del encabezado Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            raise Unauthorized("Falta el encabezado de autorización")

        # El formato debe ser 'Bearer <token>'
        try:
            bearer, token = auth_header.split()
            if bearer.lower() != 'bearer':
                raise Unauthorized("Formato de token inválido")
        except ValueError:
            raise Unauthorized("Encabezado de autorización mal formado")
        
        # Verificar el JWT
        payload = verificar_jwt(token)

        # Aquí puedes acceder a la información del JWT (por ejemplo, el ID del usuario)
        id_usuario = payload.get('sub')

        return {"message": f"Unregister del ciudadano exitoso para el usuario {id_usuario}"}, 200
    
class MocksRegisterTransferCitizen(Resource):
    
    def post(self):
        register_transfered_citizen = request.get_json()
        message_response = json.dumps(register_transfered_citizen)
        print(message_response)
        return {"message": "Transferencia del ciudadano exitosa"}, 200


# Rutas y recursos para el API
api.add_resource(MocksDocument, '/documents/api/files/<string:id_citizen>')
api.add_resource(MocksCitizen, '/users/api/citizens/transfer')
api.add_resource(MocksRegisterTransferCitizen, '/api/citizens/register')

if __name__ == '__main__':
    app.run(debug=True, port=5007)
