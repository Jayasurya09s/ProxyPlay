from flask import Blueprint, request, jsonify
import logging
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import bcrypt
from utils.jwt_helper import generate_token, decode_token
from bson.objectid import ObjectId
from utils.auth_middleware import jwt_required

load_dotenv()

auth_bp = Blueprint("auth", __name__)

client = MongoClient(os.getenv("MONGO_URI"))
db = client["video_app"]
users = db["users"]

# SIGNUP
@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if users.find_one({"email": email}):
        return jsonify({"error": "Email already exists"}), 400

    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    user_id = users.insert_one({
        "name": name,
        "email": email,
        "password_hash": hashed_pw,
    }).inserted_id

    token = generate_token(user_id)

    return jsonify({"token": token})


# LOGIN
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    logging.info(f"Login attempt: email={email}")

    user = users.find_one({"email": email})
    if not user:
        logging.warning(f"Login failed: user not found for email={email}")
        return jsonify({"error": "Invalid credentials"}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"]):
        logging.warning(f"Login failed: invalid password for email={email}")
        return jsonify({"error": "Invalid credentials"}), 401

    token = generate_token(user["_id"])
    logging.info(f"Login success: email={email}")
    return jsonify({"token": token})

# LOGOUT (mock)
@auth_bp.route("/logout", methods=["POST"])
@jwt_required
def logout():
    # Stateless JWT: client should discard token; server acknowledges
    logging.info("Logout requested")
    return jsonify({"message": "Logged out"})

# GET CURRENT USER
@auth_bp.route("/me", methods=["GET"])
def me():
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return jsonify({"error": "Missing token"}), 401

    try:
        token = auth_header.split(" ")[1]
        payload = decode_token(token)

        user = users.find_one({"_id": ObjectId(payload["user_id"])})

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "name": user["name"],
            "email": user["email"]
        })
    except Exception as e:
        return jsonify({"error": "Invalid token"}), 401