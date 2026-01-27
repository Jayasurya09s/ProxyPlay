import jwt
import datetime
import os
from dotenv import load_dotenv

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")

def generate_playback_token(video_id):
    payload = {
        "video_id": str(video_id),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token

def decode_playback_token(token):
    return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])