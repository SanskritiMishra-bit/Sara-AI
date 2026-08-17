import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CHAT_FOLDER = os.path.join(BASE_DIR, "chats")

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

MODEL_NAME = "llama3.2"

os.makedirs(CHAT_FOLDER, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)