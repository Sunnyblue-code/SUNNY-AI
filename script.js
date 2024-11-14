// Remove this line
// import API_KEY from "./config.js";

// Add API key directly or from a global variable
const API_KEY = window.config.API_KEY; // We'll define this in config.js

// Initialize global variables
let chatBox, userInput, sendButton, clearButton, toggleButton, chatContainer;

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  // Get DOM elements
  chatBox = document.getElementById("chat-box");
  userInput = document.getElementById("user-input");
  sendButton = document.getElementById("send-button");
  clearButton = document.getElementById("clear-button");
  toggleButton = document.getElementById("toggle-button");
  chatContainer = document.querySelector(".chat-container");

  // Add event listeners
  if (sendButton) {
    sendButton.onclick = handleSubmit;
  }

  if (userInput) {
    userInput.onkeypress = (e) => {
      if (e.key === "Enter") handleSubmit();
    };
  }

  if (clearButton) {
    clearButton.onclick = clearChat;
  }

  if (toggleButton) {
    toggleButton.onclick = () => chatContainer.classList.toggle("hidden");
  }

  // Load initial chat history
  loadChatHistory();
});

// Load chat history from localStorage
function loadChatHistory() {
  const history = localStorage.getItem("chatHistory");
  if (history) {
    const messages = JSON.parse(history);
    messages.forEach((msg) => {
      addMessage(msg.content, msg.isUser, new Date(msg.timestamp));
    });
  }
}

function saveChatHistory() {
  const messages = Array.from(chatBox.children)
    .filter((el) => el.classList.contains("message"))
    .map((el) => ({
      content: el.textContent,
      isUser: el.classList.contains("user-message"),
      timestamp: el.dataset.timestamp,
    }));
  localStorage.setItem("chatHistory", JSON.stringify(messages));
}

function formatDate(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString();
}

function addDateSeparator(date) {
  const separators = chatBox.getElementsByClassName("chat-date-separator");
  const dateStr = formatDate(date);

  if (
    separators.length === 0 ||
    separators[separators.length - 1].textContent !== dateStr
  ) {
    const separator = document.createElement("div");
    separator.className = "chat-date-separator";
    separator.textContent = dateStr;
    chatBox.appendChild(separator);
  }
}

function typeWriter(element, text, speed = 30) {
  let i = 0;
  element.textContent = "";

  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    } else {
      // Save chat history after typing is complete
      saveChatHistory();
    }
  }

  type();
}

function addMessage(content, isUser, timestamp = new Date()) {
  addDateSeparator(timestamp);

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user-message" : "bot-message"}`;
  messageDiv.dataset.timestamp = timestamp.toISOString();

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (isUser) {
    messageDiv.textContent = content;
    saveChatHistory();
  } else {
    // Use typewriter effect for bot messages
    typeWriter(messageDiv, content);
  }
}

// Add loading indicator
function addLoadingIndicator() {
  const loading = document.createElement("div");
  loading.className = "message bot-message";
  loading.id = "loading";
  loading.textContent = "Thinking...";
  chatBox.appendChild(loading);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Update handleSubmit to use direct API key
async function handleSubmit() {
  const message = userInput?.value.trim();
  if (!message || !chatBox) return;

  // Display user message
  addMessage(message, true);
  if (userInput) userInput.value = "";

  // Show loading indicator
  addLoadingIndicator();

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            window.config?.API_KEY || "your-api-key-here"
          }`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: message }],
        }),
      }
    );

    if (!response.ok) throw new Error("API request failed");

    const data = await response.json();

    // Remove loading
    document.getElementById("loading")?.remove();

    // Add response
    if (data.choices?.[0]?.message?.content) {
      addMessage(data.choices[0].message.content, false);
    } else {
      addMessage("Sorry, I couldn't generate a response.", false);
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("loading")?.remove();
    addMessage("Sorry, there was an error processing your request.", false);
  }
}

function clearChat() {
  chatBox.innerHTML = "";
  localStorage.removeItem("chatHistory");
}
