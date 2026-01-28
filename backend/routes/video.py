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
    # Admin endpoint: use env variable for admin secret
    admin_key = request.headers.get("X-Admin-Key")
    if admin_key != os.getenv("ADMIN_KEY"):
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json

    video = {
        "title": data.get("title"),
        "description": data.get("description"),
        "video_url": data.get("video_url"),  # Direct video URL
        "youtube_id": data.get("youtube_id"),  # Keep for backward compatibility
        "thumbnail_url": data.get("thumbnail_url"),
        "is_active": data.get("is_active", True)
    }

    result = videos.insert_one(video)
    logging.info(f"Video added: id={result.inserted_id}, title={video.get('title')}")

    return jsonify({
        "message": "Video added successfully",
        "id": str(result.inserted_id)
    }), 201

@video_bp.route("/dashboard", methods=["GET"])
@jwt_required
def dashboard():
    # Get pagination params from query string
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)
    
    # Ensure valid ranges
    page = max(page, 1)
    limit = min(max(limit, 1), 100)  # Max 100 per page
    
    skip = (page - 1) * limit
    
    # Get total count and paginated videos
    total_count = videos.count_documents({"is_active": True})
    video_list = videos.find({"is_active": True}).skip(skip).limit(limit)

    response = []
    for v in video_list:
        response.append({
            "id": str(v["_id"]),
            "title": v["title"],
            "description": v["description"],
            "thumbnail_url": v["thumbnail_url"],
            "playback_token": generate_playback_token(v["_id"])
        })

    logging.info(f"Dashboard requested: page={page}, limit={limit}, total={total_count}")
    return jsonify({
        "videos": response,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total_count,
            "pages": (total_count + limit - 1) // limit
        }
    })


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
        
        if not video:
            return jsonify({"error": "Video not found"}), 404

        # Support both direct video URLs and YouTube IDs
        if video.get('video_url'):
            stream_url = video['video_url']
        elif video.get('youtube_id'):
            stream_url = f"https://www.youtube.com/embed/{video['youtube_id']}"
        else:
            return jsonify({"error": "No video source available"}), 404
            
        logging.info(f"Stream requested: video_id={video_id}")
        return jsonify({"stream_url": stream_url})

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