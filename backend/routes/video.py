from flask import Blueprint, jsonify, request
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from utils.video_token import generate_playback_token, decode_playback_token
from bson.objectid import ObjectId

load_dotenv()

video_bp = Blueprint("video", __name__)

client = MongoClient(os.getenv("MONGO_URI"))
db = client["video_app"]
videos = db["videos"]

@video_bp.route("/video", methods=["POST"])
def add_video():
    data = request.json

    video = {
        "title": data.get("title"),
        "description": data.get("description"),
        "youtube_id": data.get("youtube_id"),
        "thumbnail_url": data.get("thumbnail_url"),
        "is_active": data.get("is_active", True)
    }

    videos.insert_one(video)

    return jsonify({"message": "Video added successfully"}), 201

@video_bp.route("/dashboard", methods=["GET"])
def dashboard():
    video_list = videos.find({"is_active": True}).limit(2)

    response = []
    for v in video_list:
        response.append({
            "id": str(v["_id"]),
            "title": v["title"],
            "description": v["description"],
            "thumbnail_url": v["thumbnail_url"],
            "playback_token": generate_playback_token(v["_id"])
        })

    return jsonify(response)


@video_bp.route("/video/<video_id>/stream", methods=["GET"])
def stream(video_id):
    token = request.args.get("token")
    if not token:
        return jsonify({"error": "Missing playback token"}), 401

    try:
        payload = decode_playback_token(token)
        if payload["video_id"] != video_id:
            return jsonify({"error": "Invalid playback token"}), 403

        video = videos.find_one({"_id": ObjectId(video_id)})

        embed_url = f"https://www.youtube.com/embed/{video['youtube_id']}"
        return jsonify({"stream_url": embed_url})

    except:
        return jsonify({"error": "Invalid or expired playback token"}), 401