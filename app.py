from flask import Flask, render_template, request, jsonify
import ollama
import uuid
import os
import json

app = Flask(__name__)

MODEL = "llama3.2:1b"
CHAT_FOLDER = "chats"
SETTINGS_FILE = "settings.json"

default_settings = {
    "theme": "dark",
    "model": "llama3.2:1b",
    "personality": "friendly"
}

if not os.path.exists(CHAT_FOLDER):
    os.makedirs(CHAT_FOLDER)

current_chat_id = None

# Default conversation starts with a system prompt
conversation = [
    {
        "role": "system",
        "content": "You are Sara AI, a helpful, friendly and intelligent AI assistant."
    }
]


# ---------------- SAVE CHAT ----------------

def save_chat(chat_id, conversation):

    if not chat_id:
        return

    filename = os.path.join(CHAT_FOLDER, f"{chat_id}.json")

    title = "New Chat"

    for msg in conversation:
        if msg["role"] == "user":
            title = msg["content"][:40]
            break

    data = {
        "id": chat_id,
        "title": title,
        "messages": conversation
    }

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


# ---------------- LOAD CHAT ----------------

def load_chat(chat_id):

    filename = os.path.join(CHAT_FOLDER, f"{chat_id}.json")

    if not os.path.exists(filename):
        return [
            {
                "role": "system",
                "content": "You are Sara AI, a helpful, friendly and intelligent AI assistant."
            }
        ]

    with open(filename, "r", encoding="utf-8") as f:
        data = json.load(f)

    return data.get(
        "messages",
        [
            {
                "role": "system",
                "content": "You are Sara AI, a helpful, friendly and intelligent AI assistant."
            }
        ]
    )
    # ---------------- SETTINGS ----------------

def load_settings():

    if not os.path.exists(SETTINGS_FILE):

        with open(SETTINGS_FILE, "w") as f:
            json.dump(default_settings, f, indent=4)

        return default_settings

    with open(SETTINGS_FILE, "r") as f:
        return json.load(f)


def save_settings(settings):

    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings, f, indent=4)
    # ---------------- HOME ----------------

@app.route("/")
def home():
    return render_template("index.html")


# ---------------- CHAT ----------------

@app.route("/chat", methods=["POST"])
def chat():

    global conversation
    global current_chat_id

    if current_chat_id is None:
        current_chat_id = str(uuid.uuid4())

    data = request.get_json()

    user_message = data.get("message", "").strip()

    if user_message == "":
        return jsonify({
            "reply": "Please enter a message."
        })

    # Store complete conversation
    conversation.append({
        "role": "user",
        "content": user_message
    })

    # Send only recent messages to Ollama for speed
    recent_messages = conversation[-10:]

    try:

        settings = load_settings()

        response = ollama.chat(
    model=settings["model"],
            messages=recent_messages,
            options={
                "temperature": 0.7,
                "num_predict": 200
            }
        )

        ai_reply = response["message"]["content"]

        conversation.append({
            "role": "assistant",
            "content": ai_reply
        })

        # Save full conversation
        save_chat(current_chat_id, conversation)

        return jsonify({
            "reply": ai_reply
        })

    except Exception as e:

        return jsonify({
            "reply": f"Error: {str(e)}"
        })


# ---------------- NEW CHAT ----------------

@app.route("/new_chat", methods=["POST"])
def new_chat():

    global conversation
    global current_chat_id

    # Save current chat before starting a new one
    if current_chat_id:
        save_chat(current_chat_id, conversation)

    current_chat_id = str(uuid.uuid4())

    conversation = [
        {
            "role": "system",
            "content": "You are Sara AI, a helpful, friendly and intelligent AI assistant."
        }
    ]

    return jsonify({
        "status": "success"
    })
    # ---------------- RECENT CHATS ----------------

@app.route("/chats")
def chats():

    chat_list = []

    for file in os.listdir(CHAT_FOLDER):

        if file.endswith(".json"):

            filepath = os.path.join(CHAT_FOLDER, file)

            with open(filepath, "r", encoding="utf-8") as f:
                chat = json.load(f)

            chat_list.append({
                "id": chat.get("id"),
                "title": chat.get("title", "New Chat")
            })

    # Show newest chats first
    chat_list.sort(reverse=True, key=lambda x: x["id"])

    return jsonify(chat_list)


# ---------------- LOAD CHAT ----------------

@app.route("/load_chat/<chat_id>")
def load(chat_id):

    global conversation
    global current_chat_id

    conversation = load_chat(chat_id)
    current_chat_id = chat_id

    return jsonify(conversation)


# ---------------- DELETE CHAT ----------------

@app.route("/delete_chat/<chat_id>", methods=["POST"])
def delete(chat_id):

    filename = os.path.join(CHAT_FOLDER, f"{chat_id}.json")

    if os.path.exists(filename):
        os.remove(filename)

    global current_chat_id
    global conversation

    if current_chat_id == chat_id:

        current_chat_id = None

        conversation = [
            {
                "role": "system",
                "content": "You are Sara AI, a helpful, friendly and intelligent AI assistant."
            }
        ]

    return jsonify({
        "status": "deleted"
    })

# ---------------- GET SETTINGS ----------------

@app.route("/settings")
def settings():

    return jsonify(load_settings())


# ---------------- SAVE SETTINGS ----------------

@app.route("/save_settings", methods=["POST"])
def save():

    settings = request.json

    save_settings(settings)

    return jsonify({
        "status": "saved"
    })


# ---------------- CLEAR ALL CHATS ----------------

@app.route("/clear_chats", methods=["POST"])
def clear_chats():

    for file in os.listdir(CHAT_FOLDER):

        if file.endswith(".json"):

            os.remove(
                os.path.join(CHAT_FOLDER, file)
            )

    global conversation
    global current_chat_id

    current_chat_id = None

    conversation = [{
        "role": "system",
        "content": "You are Sara AI, a helpful, friendly and intelligent AI assistant."
    }]

    return jsonify({
        "status": "success"
    })
# ---------------- RUN APP ----------------

if __name__ == "__main__":
    app.run(debug=True)