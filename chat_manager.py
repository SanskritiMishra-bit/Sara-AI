import os
import json
import uuid
from datetime import datetime
from config import CHAT_FOLDER


def create_chat():

    chat_id = str(uuid.uuid4())

    chat = {
        "id": chat_id,
        "title": "New Chat",
        "created": datetime.now().strftime("%d %b %Y %H:%M"),
        "messages": []
    }

    save_chat(chat)

    return chat


def save_chat(chat):

    path = os.path.join(CHAT_FOLDER, f"{chat['id']}.json")

    with open(path, "w", encoding="utf-8") as file:

        json.dump(chat, file, indent=4)


def load_chat(chat_id):

    path = os.path.join(CHAT_FOLDER, f"{chat_id}.json")

    if not os.path.exists(path):

        return None

    with open(path, "r", encoding="utf-8") as file:

        return json.load(file)


def get_all_chats():

    chats = []

    for filename in os.listdir(CHAT_FOLDER):

        if filename.endswith(".json"):

            with open(os.path.join(CHAT_FOLDER, filename), encoding="utf-8") as file:

                chats.append(json.load(file))

    chats.sort(reverse=True, key=lambda x: x["created"])

    return chats


def delete_chat(chat_id):

    path = os.path.join(CHAT_FOLDER, f"{chat_id}.json")

    if os.path.exists(path):

        os.remove(path)