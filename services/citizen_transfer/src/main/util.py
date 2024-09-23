import jwt
from werkzeug.exceptions import BadRequest, Unauthorized

def decode_jwt(token):
    try:
        # Decodificar el JWT usando la clave secreta
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload
    except jwt.ExpiredSignatureError:
        raise Unauthorized("El token ha expirado")
    except jwt.InvalidTokenError:
        raise Unauthorized("Token inválido")