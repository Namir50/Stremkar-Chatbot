import os
from datetime import datetime, timedelta
from jose import jwt
from dotenv import load_dotenv

load_dotenv()

secret_key = os.getenv("SECRET_KEY")

algorithm = "HS256"

admin_username = os.getenv("ADMIN_USERNAME")
admin_password = os.getenv("ADMIN_PASSWORD")

def authenticate_admin(username, password):
    return username == admin_username and password == admin_password

def create_token(username):
    payload = {
        "sub": username,
        "exp": datetime.utcnow() + timedelta(hours = 12)
    }

    return jwt.encode(payload, secret_key, algorithm = algorithm)