// ============================================
// MARKOV CHAIN TEXT GENERATOR - MAIN SCRIPT
// ============================================

// State Management
const state = {
    bot: null,
    dataset: '',
    order: 2,
    length: 20,
    conversationHistory: []
};

// DOM Elements
const elements = {
    orderInput: document.getElementById('orderInput'),
    lengthInput: document.getElementById('lengthInput'),
    lengthValue: document.getElementById('lengthValue'),
    promptInput: document.getElementById('promptInput'),
    generateBtn: document.getElementById('generateBtn'),
    clearChatBtn: document.getElementById('clearChatBtn'),
    copyChatBtn: document.getElementById('copyChatBtn'),
    loadDatasetBtn: document.getElementById('loadDatasetBtn'),
    fileInput: document.getElementById('fileInput'),
    chatBox: document.getElementById('chatBox'),
    uploadArea: document.getElementById('uploadArea'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    botStatus: document.getElementById('botStatus'),
    totalStates: document.getElementById('totalStates'),
    datasetSize: document.getElementById('datasetSize'),
    loadingModal: document.getElementById('loadingModal')
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    console.log('Markov Chain Text Generator initialized');
});

function initializeEventListeners() {
    // Button Events
    elements.generateBtn.addEventListener('click', handleGenerate);
    elements.clearChatBtn.addEventListener('click', clearChat);
    elements.copyChatBtn.addEventListener('click', copyChat);
    elements.loadDatasetBtn.addEventListener('click', () => {
        elements.fileInput.click();
    });

    // File Input Event
    elements.fileInput.addEventListener('change', handleFileUpload);

    // Range Slider Event
    elements.lengthInput.addEventListener('input', (e) => {
        elements.lengthValue.textContent = e.target.value;
        state.length = parseInt(e.target.value);
    });

    // Order Dropdown Event
    elements.orderInput.addEventListener('change', (e) => {
        state.order = parseInt(e.target.value);
        if (state.dataset) {
            retrain();
        }
    });

    // Drag and Drop
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleDrop);

    // Enter key to generate
    elements.promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
        }
    });
}

// ============================================
// FILE HANDLING
// ============================================

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
        showAlert('Hanya file .txt yang didukung', 'error');
        return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            state.dataset = e.target.result;
            displayFileInfo(file);
            trainBot();
            showAlert('Dataset berhasil dimuat!', 'success');
        } catch (error) {
            showAlert('Error memproses file: ' + error.message, 'error');
        }
    };

    reader.onerror = () => {
        showAlert('Error membaca file', 'error');
    };

    reader.readAsText(file);
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadArea.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        elements.fileInput.files = files;
        handleFileUpload({ target: elements.fileInput });
    }
}

function displayFileInfo(file) {
    elements.fileName.textContent = `📄 ${file.name}`;
    elements.fileSize.textContent = `💾 ${formatFileSize(file.size)}`;
    elements.fileInfo.style.display = 'block';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ============================================
// MARKOV BOT LOGIC
// ============================================

class MarkovBot {
    constructor(order = 2) {
        this.order = order;
        this.transitions = {};
        this.startNodes = [];
    }

    train(text) {
        const words = this.tokenize(text);
        if (words.length < this.order) return;

        this.startNodes.push(words.slice(0, this.order));

        for (let i = 0; i <= words.length - this.order; i++) {
            const state = words.slice(i, i + this.order).join('|');
            const nextWord = words[i + this.order];

            if (!this.transitions[state]) {
                this.transitions[state] = [];
            }
            this.transitions[state].push(nextWord);

            // Track sentence starts
            if (words[i] === '.' && i + this.order < words.length) {
                this.startNodes.push(words.slice(i + 1, i + 1 + this.order));
            }
        }
    }

    tokenize(text) {
        return text.toLowerCase()
            .match(/[\w']+|[.,!?;:]/g) || [];
    }

    generate(prompt = null, length = 20) {
        if (Object.keys(this.transitions).length === 0) {
            return 'Bot belum dilatih!';
        }

        let currentState;
        let result = [];

        if (prompt) {
            const promptWords = this.tokenize(prompt);
            if (promptWords.length >= this.order) {
                currentState = promptWords.slice(-this.order);
                result = [...promptWords];
            } else {
                const stateKey = promptWords[promptWords.length - 1];
                const possibleStarts = Object.keys(this.transitions)
                    .filter(s => s.split('|')[0] === stateKey);

                if (possibleStarts.length > 0) {
                    currentState = possibleStarts[
                        Math.floor(Math.random() * possibleStarts.length)
                    ].split('|');
                    result = [...promptWords, ...currentState.slice(1)];
                } else {
                    currentState = this.startNodes[
                        Math.floor(Math.random() * this.startNodes.length)
                    ];
                    result = [...currentState];
                }
            }
        } else {
            currentState = this.startNodes[
                Math.floor(Math.random() * this.startNodes.length)
            ];
            result = [...currentState];
        }

        // Generate text
        for (let i = 0; i < length; i++) {
            const stateKey = currentState.join('|');
            
            if (this.transitions[stateKey]) {
                const nextWords = this.transitions[stateKey];
                const nextWord = nextWords[
                    Math.floor(Math.random() * nextWords.length)
                ];
                result.push(nextWord);
                currentState = result.slice(-this.order);

                if (nextWord === '.' && result.length > 10) {
                    break;
                }
            } else {
                break;
            }
        }

        let text = result.join(' ');
        text = text.replace(/\s+([.,!?;:])/g, '$1');
        if (text && !'.!?;'.includes(text[text.length - 1])) {
            text += '.';
        }
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
}

function trainBot() {
    showLoading(true);
    
    setTimeout(() => {
        state.bot = new MarkovBot(state.order);
        state.bot.train(state.dataset);
        
        updateBotStatus();
        showLoading(false);
    }, 500);
}

function retrain() {
    if (state.dataset) {
        trainBot();
    }
}

function updateBotStatus() {
    const stateCount = Object.keys(state.bot.transitions).length;
    elements.botStatus.textContent = '✅ Siap Digunakan';
    elements.totalStates.textContent = stateCount.toLocaleString();
    elements.datasetSize.textContent = formatFileSize(state.dataset.length);
}

// ============================================
// CHAT HANDLING
// ============================================

function handleGenerate() {
    const prompt = elements.promptInput.value.trim();
    
    if (!prompt) {
        showAlert('Silakan masukkan prompt', 'warning');
        return;
    }

    if (!state.bot) {
        showAlert('Silakan upload dataset terlebih dahulu', 'warning');
        return;
    }

    // Add user message to chat
    addMessageToChat(prompt, 'user');
    elements.promptInput.value = '';

    // Generate response
    showLoading(true);
    
    setTimeout(() => {
        const response = state.bot.generate(prompt, state.length);
        addMessageToChat(response, 'bot');
        showLoading(false);
    }, 300);
}

function addMessageToChat(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    
    const icon = sender === 'user' ? '👤' : '🤖';
    const content = `
        <span class="message-icon">${icon}</span>
        <div class="message-content">
            <p>${escapeHtml(message)}</p>
        </div>
    `;
    
    messageDiv.innerHTML = content;
    elements.chatBox.appendChild(messageDiv);
    
    // Auto scroll to bottom
    elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
    
    state.conversationHistory.push({ sender, message });
}

function clearChat() {
    if (confirm('Apakah Anda yakin ingin menghapus semua percakapan?')) {
        elements.chatBox.innerHTML = '';
        state.conversationHistory = [];
        elements.promptInput.value = '';
        showAlert('Chat berhasil dihapus', 'success');
    }
}

function copyChat() {
    if (state.conversationHistory.length === 0) {
        showAlert('Tidak ada chat untuk disalin', 'warning');
        return;
    }

    let text = 'MARKOV CHAIN CONVERSATION\n';
    text += '=' .repeat(50) + '\n\n';

    state.conversationHistory.forEach(({ sender, message }) => {
        const label = sender === 'user' ? 'You' : 'Bot';
        text += `${label}:\n${message}\n\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
        showAlert('Chat berhasil disalin ke clipboard!', 'success');
    }).catch(() => {
        showAlert('Gagal menyalin chat', 'error');
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function setPrompt(text) {
    elements.promptInput.value = text;
    elements.promptInput.focus();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading(show) {
    elements.loadingModal.style.display = show ? 'flex' : 'none';
}

function showAlert(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Create alert element
    const alert = document.createElement('div');
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        background-color: ${getAlertColor(type)};
        color: white;
        font-weight: 600;
        z-index: 2000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

function getAlertColor(type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    return colors[type] || colors.info;
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(20px);
        }
    }
`;
document.head.appendChild(style);

// ============================================
// DEBUG MODE (Optional)
// ============================================

window.MarkovDebug = {
    getState: () => state,
    getBot: () => state.bot,
    getHistory: () => state.conversationHistory
};
