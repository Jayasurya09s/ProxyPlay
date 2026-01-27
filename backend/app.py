from flask import Flask, jsonify
import logging
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from routes.auth import auth_bp
from routes.video import video_bp

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["video_app"]

app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(video_bp)
@app.route("/")
def home():
    return jsonify({"status": "Backend running 🚀"})





if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s: %(message)s')
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)