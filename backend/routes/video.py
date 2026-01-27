from flask import Blueprint, jsonify, request
import logging
import datetime
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from utils.video_token import generate_playback_token, decode_playback_token
from bson.objectid import ObjectId
from utils.auth_middleware import jwt_required

load_dotenv()

video_bp = Blueprint("video", __name__)

client = MongoClient(os.getenv("MONGO_URI"))
db = client["video_app"]
videos = db["videos"]
watch_events = db["watch_events"]

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
@jwt_required
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

    logging.info("Dashboard requested")
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
        logging.info(f"Stream requested: video_id={video_id}")
        return jsonify({"stream_url": embed_url})

    except Exception as e:
        logging.exception("Stream error")
        return jsonify({"error": "Invalid or expired playback token"}), 401

@video_bp.route("/video/<video_id>/watch", methods=["POST"])
@jwt_required
def watch(video_id):
    try:
        watch_events.insert_one({
            "user_id": ObjectId(request.user_id),
            "video_id": ObjectId(video_id),
            "timestamp": datetime.datetime.utcnow()
        })
        logging.info(f"Watch recorded: user_id={request.user_id}, video_id={video_id}")
        return jsonify({"message": "Watch recorded"}), 201
    except Exception as e:
        logging.exception("Watch record error")
        return jsonify({"error": "Failed to record watch"}), 500