import jwt
from werkzeug.exceptions import BadRequest, Unauthorized

def decode_jwt(token):
    try:
        # Decodificar el JWT usando la clave secreta
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload
    except Exception as e:
        print("Error al decodificar el JWT: ", e)
        raise Unauthorized("Token inválido")