from flask import request, jsonify, g
from functools import wraps
import jwt


def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization")
        if auth_header:
            token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"message": "Token is missing!"}), 401

        claims = jwt.decode(token, options={"verify_signature": False})
        g.user_id = claims["id"]

        return f(*args, **kwargs)

    return decorated_function
