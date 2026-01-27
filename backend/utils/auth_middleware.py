from functools import wraps
from flask import request, jsonify
from utils.jwt_helper import decode_token
from bson.objectid import ObjectId

def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"error": "Missing token"}), 401

        try:
            token = auth_header.split(" ")[1]
            payload = decode_token(token)
            request.user_id = payload["user_id"]
        except:
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)
    return decorated