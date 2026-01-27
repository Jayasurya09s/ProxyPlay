from flask import Blueprint, request, jsonify
import logging
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import bcrypt
import datetime
from utils.jwt_helper import generate_token, decode_token
from bson.objectid import ObjectId
from utils.auth_middleware import jwt_required
from time import time

load_dotenv()

auth_bp = Blueprint("auth", __name__)

client = MongoClient(os.getenv("MONGO_URI"))
db = client["video_app"]
users = db["users"]
refresh_tokens = db["refresh_tokens"]

# Rate limiting: IP -> [(timestamp, ...)]
login_attempts = {}
RATE_LIMIT_ATTEMPTS = 5
RATE_LIMIT_WINDOW = 60  # seconds

def check_rate_limit(ip):
    """Check and record login attempt. Returns (allowed, remaining)"""
    now = time()
    if ip not in login_attempts:
        login_attempts[ip] = []
    
    # Remove old attempts outside the window
    login_attempts[ip] = [t for t in login_attempts[ip] if now - t < RATE_LIMIT_WINDOW]
    
    attempts = len(login_attempts[ip])
    if attempts >= RATE_LIMIT_ATTEMPTS:
        return False, 0
    
    login_attempts[ip].append(now)
    return True, RATE_LIMIT_ATTEMPTS - attempts - 1

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

    access_token = generate_token(user_id, "access")
    refresh_token = generate_token(user_id, "refresh")
    
    # Store refresh token in DB
    refresh_tokens.insert_one({
        "user_id": user_id,
        "token": refresh_token,
        "created_at": datetime.datetime.utcnow()
    })

    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token
    })


# LOGIN
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    # Get client IP (handle proxies)
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr).split(',')[0].strip()
    
    # Check rate limit
    allowed, remaining = check_rate_limit(client_ip)
    if not allowed:
        logging.warning(f"Rate limit exceeded for IP={client_ip}, email={email}")
        return jsonify({"error": "Too many login attempts. Try again in 1 minute."}), 429
    
    logging.info(f"Login attempt: email={email}, attempts_remaining={remaining}")

    user = users.find_one({"email": email})
    if not user:
        logging.warning(f"Login failed: user not found for email={email}")
        return jsonify({"error": "Invalid credentials"}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"]):
        logging.warning(f"Login failed: invalid password for email={email}")
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = generate_token(user["_id"], "access")
    refresh_token = generate_token(user["_id"], "refresh")
    
    # Store refresh token in DB
    refresh_tokens.insert_one({
        "user_id": user["_id"],
        "token": refresh_token,
        "created_at": datetime.datetime.utcnow()
    })
    
    logging.info(f"Login success: email={email}")
    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token
    })

# LOGOUT
@auth_bp.route("/logout", methods=["POST"])
@jwt_required
def logout():
    # Invalidate all refresh tokens for this user
    user_id = request.user_id
    refresh_tokens.delete_many({"user_id": ObjectId(user_id)})
    logging.info(f"Logout: user_id={user_id}")
    return jsonify({"message": "Logged out"})

# REFRESH TOKEN
@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    """Exchange refresh token for new access token"""
    data = request.json
    refresh_token = data.get("refresh_token")
    
    if not refresh_token:
        return jsonify({"error": "Missing refresh token"}), 400
    
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            return jsonify({"error": "Invalid token type"}), 401
        
        user_id = payload["user_id"]
        
        # Verify token exists in DB
        if not refresh_tokens.find_one({"user_id": ObjectId(user_id), "token": refresh_token}):
            return jsonify({"error": "Refresh token invalid or revoked"}), 401
        
        # Generate new access token
        new_access_token = generate_token(user_id, "access")
        logging.info(f"Token refreshed: user_id={user_id}")
        return jsonify({"access_token": new_access_token})
    
    except Exception as e:
        logging.warning(f"Refresh failed: {str(e)}")
        return jsonify({"error": "Invalid refresh token"}), 401

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