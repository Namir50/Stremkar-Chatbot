const chatWindow = document.getElementById('chatWindow');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const adminToggleBtn = document.getElementById('adminToggleBtn');
const adminSidebar = document.getElementById('adminSidebar');
const closeSidebar = document.getElementById('closeSidebar');

// Admin Elements
const loginForm = document.getElementById('loginForm');
const adminControls = document.getElementById('adminControls');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const addFaqBtn = document.getElementById('addFaqBtn');
const faqList = document.getElementById('faqList');
const refreshFaqBtn = document.getElementById('refreshFaqBtn');

let accessToken = localStorage.getItem('access_token');

// Initialize
if (accessToken) {
    showAdminControls();
}

// --- Chat Logic ---

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user-message');
    userInput.value = '';

    // Show typing indicator
    const typingId = showTypingIndicator();

    try {
        const response = await fetch('/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: text })
        });
        const data = await response.json();

        removeTypingIndicator(typingId);
        appendMessage(data.answer, 'bot-message');
    } catch (error) {
        removeTypingIndicator(typingId);
        appendMessage("Sorry, I'm having trouble connecting to the server.", 'bot-message');
    }
}

function appendMessage(text, className) {
    const div = document.createElement('div');
    div.className = `message ${className}`;
    div.textContent = text;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'message bot-message typing-indicator';
    div.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// --- UI Controls ---

adminToggleBtn.addEventListener('click', () => {
    adminSidebar.classList.add('active');
});

closeSidebar.addEventListener('click', () => {
    adminSidebar.classList.remove('active');
});

// --- Admin Logic ---

loginBtn.addEventListener('click', async () => {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('loginError');

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            accessToken = data.access_token;
            localStorage.setItem('access_token', accessToken);
            showAdminControls();
            errorEl.classList.add('hidden');
        } else {
            errorEl.textContent = "Invalid credentials";
            errorEl.classList.remove('hidden');
        }
    } catch (e) {
        errorEl.textContent = "Connection error";
        errorEl.classList.remove('hidden');
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('access_token');
    accessToken = null;
    hideAdminControls();
});

function showAdminControls() {
    loginForm.classList.add('hidden');
    adminControls.classList.remove('hidden');
    loadFaqs();
}

function hideAdminControls() {
    loginForm.classList.remove('hidden');
    adminControls.classList.add('hidden');
}

async function loadFaqs() {
    if (!accessToken) return;

    try {
        const response = await fetch('/list_faqs', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await response.json();

        faqList.innerHTML = '';
        data.faqs.forEach(faq => {
            const div = document.createElement('div');
            div.className = 'faq-item';
            div.innerHTML = `
                <div class="faq-item-info">
                    <div class="faq-q">${faq.question}</div>
                    <div class="faq-a">${faq.answer}</div>
                </div>
                <button class="delete-faq-btn" onclick="deleteFaq('${faq.question.replace(/'/g, "\\'")}')">Delete</button>
            `;
            faqList.appendChild(div);
        });
    } catch (e) {
        console.error("Failed to load FAQs", e);
    }
}

async function deleteFaq(question) {
    if (!confirm(`Are you sure you want to delete this FAQ?`)) return;

    try {
        const response = await fetch('/delete_faq', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ question })
        });

        if (response.ok) {
            loadFaqs();
        }
    } catch (e) {
        alert("Delete failed");
    }
}

addFaqBtn.addEventListener('click', async () => {
    const question = document.getElementById('newFaqQ').value;
    const answer = document.getElementById('newFaqA').value;

    if (!question || !answer) return;

    try {
        const response = await fetch('/add_faq', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ question, answer })
        });

        if (response.ok) {
            document.getElementById('newFaqQ').value = '';
            document.getElementById('newFaqA').value = '';
            loadFaqs();
        }
    } catch (e) {
        alert("Add failed");
    }
});

refreshFaqBtn.addEventListener('click', loadFaqs);

// Make deleteFaq accessible globally for the onclick handler
window.deleteFaq = deleteFaq;
