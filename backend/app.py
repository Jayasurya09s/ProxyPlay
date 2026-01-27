from flask import Flask, jsonify
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from routes.auth import auth_bp

load_dotenv()

app = Flask(__name__)

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["video_app"]

app.register_blueprint(auth_bp, url_prefix="/auth")

@app.route("/")
def home():
    return jsonify({"status": "Backend running 🚀"})

if __name__ == "__main__":
    app.run(debug=True)