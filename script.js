// DOM elements
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

// Store conversation history as an array of messages
let conversationHistory = [
  {
    role: "system",
    content:
      "You are a helpful, friendly, and knowledgeable L'Oréal employee. Always answer as if you represent L'Oréal, and treat all beauty, skincare, haircare, or product-related questions as being about L'Oréal. If a user asks about 'your products', 'your best selling product', or similar, always answer as if they mean L'Oréal's products. If the question is not related to beauty, skincare, haircare, or cosmetics, politely let the user know you can only answer questions about L'Oréal and the beauty industry.",
  },
];

// Helper function to check if the question is a simple greeting
function isGreeting(question) {
  // List of common greetings
  const greetings = [
    "hi",
    "hello",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
    "greetings",
    "howdy",
  ];
  // Check if the question matches any greeting (case-insensitive, exact or with punctuation)
  const lower = question.trim().toLowerCase();
  return greetings.some(
    (greet) =>
      lower === greet ||
      lower.startsWith(greet + " ") ||
      lower.endsWith(" " + greet) ||
      lower.includes(greet + "!")
  );
}

// Helper function to add a message bubble to the chat window
function addMessageBubble(text, sender) {
  // sender: 'user' or 'ai'
  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${sender}`;
  msgDiv.textContent = text;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Function to call OpenAI API (now via Cloudflare Worker)
async function getOpenAIResponse(message) {
  // Add the user's message to the conversation history
  conversationHistory.push({ role: "user", content: message });

  // Send the full conversation history to the Cloudflare Worker endpoint
  const endpoint = "https://lorealworker.dundyhong23.workers.dev/";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: conversationHistory,
        model: "gpt-4o",
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    // Get the AI's reply from the response
    let aiReply =
      data.choices && data.choices[0] && data.choices[0].message.content
        ? data.choices[0].message.content.trim()
        : "Sorry, I cannot answer that.";
    // Add the AI's reply to the conversation history
    conversationHistory.push({ role: "assistant", content: aiReply });
    return aiReply;
  } catch (error) {
    return "Sorry, there was an error connecting to the AI.";
  }
}

// Handle form submit
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const question = userInput.value.trim();
  if (!question) return;

  // Clear the input box right away
  userInput.value = "";

  // Show user's message in a chat bubble
  addMessageBubble(question, "user");

  // Check if the question is a greeting
  if (isGreeting(question)) {
    addMessageBubble("Hello! How can I help you today?", "ai");
    return;
  }

  // Show loading message
  const loadingMsg = document.createElement("div");
  loadingMsg.className = "msg ai";
  loadingMsg.textContent = "...thinking...";
  chatWindow.appendChild(loadingMsg);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Get AI response
  const aiReply = await getOpenAIResponse(question);

  // Replace the loading message with the actual reply
  loadingMsg.textContent = aiReply;
});

// Reset chat functionality
const resetChatBtn = document.getElementById("resetChatBtn");
if (resetChatBtn) {
  resetChatBtn.addEventListener("click", () => {
    // Clear chat window
    chatWindow.innerHTML = "";
    // Reset conversation history to just the system prompt
    conversationHistory = [
      {
        role: "system",
        content:
          "You are a helpful, friendly, and knowledgeable L'Oréal employee. Always answer as if you represent L'Oréal, and treat all beauty, skincare, haircare, or product-related questions as being about L'Oréal. If a user asks about 'your products', 'your best selling product', or similar, always answer as if they mean L'Oréal's products. If the question is not related to beauty, skincare, haircare, or cosmetics, politely let the user know you can only answer questions about L'Oréal and the beauty industry.",
      },
    ];
    // Show initial message again
    addMessageBubble("👋 Hello! How can I help you today?", "ai");
  });
}

// Show initial message on page load as a chat bubble
chatWindow.innerHTML = "";
addMessageBubble("👋 Hello! How can I help you today?", "ai");
