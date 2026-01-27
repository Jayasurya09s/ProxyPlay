import jwt
import datetime
import os
from dotenv import load_dotenv

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")

def generate_token(user_id, token_type="access"):
    """Generate JWT token (access: 1h, refresh: 30 days)"""
    if token_type == "refresh":
        expiry = datetime.timedelta(days=30)
    else:
        expiry = datetime.timedelta(hours=1)
    
    payload = {
        "user_id": str(user_id),
        "type": token_type,
        "exp": datetime.datetime.utcnow() + expiry
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token

def decode_token(token):
    return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])