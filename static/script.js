
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.querySelector(".new-chat");
const historyDiv = document.getElementById("chat-history");


// Prompt suggestions
const promptSuggestions = {

    code: [
        "Write a Java program to ",
        "Debug this Python code ",
        "Create a Flask API for ",
        "Explain this algorithm ",
        "Optimize this SQL query "
    ],

    study: [
        "Explain ",
        "Teach me ",
        "Summarize ",
        "Quiz me on ",
        "Give notes for "
    ],

    ideas: [
        "Give me AI project ideas for ",
        "Suggest startup ideas for ",
        "Brainstorm website ideas ",
        "Generate final year project ideas ",
        "Create an AI startup idea "
    ],

    general: [
        "Tell me about ",
        "How does ",
        "Compare ",
        "What is ",
        "Why is "
    ]

};


// Pick random suggestion
function randomPrompt(list){

    return list[
        Math.floor(Math.random()*list.length)
    ];

}


// Fill suggestion cards
function loadSuggestionCards(){

    const code = randomPrompt(promptSuggestions.code);
    const study = randomPrompt(promptSuggestions.study);
    const ideas = randomPrompt(promptSuggestions.ideas);
    const general = randomPrompt(promptSuggestions.general);

    document.getElementById("code-text").innerText = code;
    document.getElementById("study-text").innerText = study;
    document.getElementById("idea-text").innerText = ideas;
    document.getElementById("general-text").innerText = general;

    document.getElementById("code-card").onclick =
        ()=>quickPrompt(code);

    document.getElementById("study-card").onclick =
        ()=>quickPrompt(study);

    document.getElementById("idea-card").onclick =
        ()=>quickPrompt(ideas);

    document.getElementById("general-card").onclick =
        ()=>quickPrompt(general);

}

input.addEventListener("input", () => {

    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";

});


// Press Enter to send
input.addEventListener("keydown", (e) => {

    if (e.key === "Enter" && !e.shiftKey) {

        e.preventDefault();

        sendMessage();

    }

});


// Send button
sendBtn.addEventListener("click", sendMessage);


// New Chat button
newChatBtn.addEventListener("click", async () => {

    try {

        await fetch("/new_chat", {
            method: "POST"
        });

    } catch (err) {

        console.error(err);

    }

    // Restore welcome screen
    chatBox.innerHTML = `
        <div class="welcome">

           <div class="welcome-logo">
    <img src="/static/images/sara-logo.png" alt="Sara AI">
</div>

            <h1>Sara AI</h1>

            <p>Your Intelligent AI Assistant</p>

            <div class="cards">

                <div class="card" id="code-card">
                    💻
                    <h3>Code</h3>
                    <p id="code-text"></p>
                </div>

                <div class="card" id="study-card">
                    📚
                    <h3>Study</h3>
                    <p id="study-text"></p>
                </div>

                <div class="card" id="idea-card">
                    💡
                    <h3>Ideas</h3>
                    <p id="idea-text"></p>
                </div>

                <div class="card" id="general-card">
                    🌍
                    <h3>General</h3>
                    <p id="general-text"></p>
                </div>

            </div>

        </div>
    `;

    input.value = "";

    loadSuggestionCards();
    loadChats();

});


// Scroll chat to bottom
function scrollBottom() {

    chatBox.scrollTop = chatBox.scrollHeight;

}


// Current time
function getTime() {

    return new Date().toLocaleTimeString([], {

        hour: "2-digit",
        minute: "2-digit"

    });

}


// Remove welcome screen
function removeWelcome() {

    const welcome = document.querySelector(".welcome");

    if (welcome) {

        welcome.remove();

    }

}


// Add message bubble
function addMessage(text, sender) {

    const message = document.createElement("div");

    message.className = `message ${sender}`;

    message.innerHTML = `
        <div>${text}</div>
        <div class="time">${getTime()}</div>
    `;

    chatBox.appendChild(message);

    scrollBottom();

}


// Typing animation
function showTyping() {

    const typing = document.createElement("div");

    typing.className = "message bot";

    typing.id = "typing";

    typing.innerHTML = `
        <div class="typing">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;

    chatBox.appendChild(typing);

    scrollBottom();

}


// Remove typing animation
function removeTyping() {

    const typing = document.getElementById("typing");

    if (typing) {

        typing.remove();

    }

}

async function sendMessage() {

    const message = input.value.trim();

    if (message === "") return;

    removeWelcome();

    addMessage(message, "user");

    input.value = "";
    input.style.height = "50px";

    showTyping();

    try {

        const response = await fetch("/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message
            })

        });

        const data = await response.json();

        removeTyping();

        addMessage(data.reply, "bot");

        loadChats();

    }
    catch (error) {

        removeTyping();

        addMessage("⚠ Unable to connect to Sara AI.", "bot");

        console.error(error);

    }

}


// Fill textbox from suggestion cards
function quickPrompt(prompt) {

    input.value = prompt;

    input.focus();

    input.selectionStart = input.selectionEnd =
        input.value.length;

    input.style.height = "auto";
    input.style.height =
        input.scrollHeight + "px";

}



// ---------------- RECENT CHATS ----------------

async function loadChats() {

    if (!historyDiv) return;

    try {

        const response = await fetch("/chats");

        const chats = await response.json();

        historyDiv.innerHTML = "";

        chats.reverse().forEach(chat => {

            historyDiv.innerHTML += `

                <div class="history-item">

                    <span class="chat-title"
                        onclick="openChat('${chat.id}')">

                        💬 ${chat.title}

                    </span>

                    <span class="delete-btn"
                        onclick="deleteChat('${chat.id}')">

                        🗑

                    </span>

                </div>

            `;

        });

    }
    catch (err) {

        console.error(err);

    }

}



// ---------------- OPEN OLD CHAT ----------------

async function openChat(chatId) {

    const response =
        await fetch(`/load_chat/${chatId}`);

    const messages =
        await response.json();

    chatBox.innerHTML = "";

    messages.forEach(msg => {

        if (msg.role === "system")
            return;

        addMessage(
            msg.content,
            msg.role === "user"
                ? "user"
                : "bot"
        );

    });

}

async function deleteChat(chatId) {

    if (!confirm("Delete this chat?"))
        return;

    try {

        await fetch(`/delete_chat/${chatId}`, {

            method: "POST"

        });

        loadChats();

    }
    catch (err) {

        console.error(err);

    }

}


// Load everything when page opens
window.onload = () => {

    loadSuggestionCards();

    loadChats();

};

// =============================
// SETTINGS
// =============================

const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettings = document.getElementById("closeSettings");

const saveSettingsBtn = document.getElementById("saveSettings");
const clearChatsBtn = document.getElementById("clearChats");

const modelSelect = document.getElementById("modelSelect");
const personalitySelect = document.getElementById("personalitySelect");
const themeSelect = document.getElementById("themeSelect");


// Open settings
settingsBtn.onclick = () => {

    settingsModal.style.display = "flex";

    loadSettings();

};


// Close settings
closeSettings.onclick = () => {

    settingsModal.style.display = "none";

};


// Close when clicking outside
window.onclick = (event) => {

    if(event.target == settingsModal){

        settingsModal.style.display = "none";

    }

};


// Load settings from Flask
async function loadSettings(){

    const response = await fetch("/settings");

    const settings = await response.json();

    modelSelect.value = settings.model;
    personalitySelect.value = settings.personality;
    themeSelect.value = settings.theme;

    applyTheme(settings.theme);

}


// Save settings
saveSettingsBtn.onclick = async ()=>{

    const settings = {

        model : modelSelect.value,

        personality : personalitySelect.value,

        theme : themeSelect.value

    };

    await fetch("/save_settings",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify(settings)

    });

    applyTheme(settings.theme);

    alert("✅ Settings Saved!");

    settingsModal.style.display="none";

};


// Apply Theme
function applyTheme(theme){

    if(theme=="light"){

        document.body.classList.add("light");

    }
    else{

        document.body.classList.remove("light");

    }

}


// Clear chats
clearChatsBtn.onclick = async ()=>{

    if(!confirm("Delete ALL chats?"))
        return;

    await fetch("/clear_chats",{

        method:"POST"

    });

    chatBox.innerHTML="";

    loadChats();

    alert("Chats deleted.");

};


// Load settings on startup
loadSettings();