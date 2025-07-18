class AIFileManager {
    constructor() {
        this.currentPath = '';
        this.workingDirectory = '';
        this.selectedItems = new Set();
        this.isProcessing = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadCurrentDirectory();
        this.loadFiles();
        this.setupQuickActions();
    }

    initializeElements() {
        this.elements = {
            fileList: document.getElementById('fileList'),
            chatMessages: document.getElementById('chatMessages'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            clearChatBtn: document.getElementById('clearChatBtn'),
            breadcrumb: document.getElementById('breadcrumb'),
            currentDirectory: document.getElementById('currentDirectory'),
            changeDirBtn: document.getElementById('changeDirBtn'),
            directoryModal: document.getElementById('directoryModal'),
            directoryPath: document.getElementById('directoryPath'),
            modalClose: document.getElementById('modalClose'),
            modalCancel: document.getElementById('modalCancel'),
            modalConfirm: document.getElementById('modalConfirm'),
            modalCurrentDir: document.getElementById('modalCurrentDir')
        };
    }

    bindEvents() {
        // Chat input events
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Header actions
        this.elements.refreshBtn.addEventListener('click', () => this.loadFiles());
        this.elements.clearChatBtn.addEventListener('click', () => this.clearChat());
        
        // Directory selection
        this.elements.changeDirBtn.addEventListener('click', () => this.showDirectoryModal());
        this.elements.modalClose.addEventListener('click', () => this.hideDirectoryModal());
        this.elements.modalCancel.addEventListener('click', () => this.hideDirectoryModal());
        this.elements.modalConfirm.addEventListener('click', () => this.setWorkingDirectory());
        
        // File explorer events
        this.elements.fileList.addEventListener('click', (e) => this.handleFileClick(e));
        
        // Modal backdrop click
        this.elements.directoryModal.addEventListener('click', (e) => {
            if (e.target === this.elements.directoryModal) {
                this.hideDirectoryModal();
            }
        });

        // Path suggestions
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const pathType = btn.dataset.path;
                this.setSuggestedPath(pathType);
            });
        });
    }

    async loadCurrentDirectory() {
        try {
            const response = await fetch('/api/files/current-directory');
            const data = await response.json();
            
            if (data.success) {
                this.workingDirectory = data.currentDirectory;
                this.updateCurrentDirectoryDisplay();
                
                // Update modal
                if (this.elements.modalCurrentDir) {
                    this.elements.modalCurrentDir.textContent = this.workingDirectory;
                }
            }
        } catch (error) {
            console.error('Error loading current directory:', error);
        }
    }

    updateCurrentDirectoryDisplay() {
        if (this.elements.currentDirectory) {
            const shortPath = this.workingDirectory.length > 50 
                ? '...' + this.workingDirectory.slice(-47) 
                : this.workingDirectory;
            this.elements.currentDirectory.innerHTML = `<small>Working in: ${shortPath}</small>`;
        }
    }

    showDirectoryModal() {
        this.elements.directoryModal.classList.add('show');
        this.elements.directoryPath.value = this.workingDirectory;
        this.elements.modalCurrentDir.textContent = this.workingDirectory;
        this.elements.directoryPath.focus();
    }

    hideDirectoryModal() {
        this.elements.directoryModal.classList.remove('show');
    }

    setSuggestedPath(pathType) {
        let suggestedPath = '';
        
        switch (pathType) {
            case 'desktop':
                // This will be handled by the server to get the actual desktop path
                this.elements.directoryPath.value = 'DESKTOP';
                break;
            case 'documents':
                this.elements.directoryPath.value = 'DOCUMENTS';
                break;
            case 'downloads':
                this.elements.directoryPath.value = 'DOWNLOADS';
                break;
            default:
                this.elements.directoryPath.value = '';
        }
    }

    async setWorkingDirectory() {
        try {
            let directoryPath = this.elements.directoryPath.value.trim();
            
            if (!directoryPath) {
                this.addMessage('assistant', 'Please enter a directory path.', true);
                return;
            }

            // Handle special path shortcuts
            if (directoryPath === 'DESKTOP') {
                directoryPath = `${require('os').homedir()}/Desktop`;
            } else if (directoryPath === 'DOCUMENTS') {
                directoryPath = `${require('os').homedir()}/Documents`;
            } else if (directoryPath === 'DOWNLOADS') {
                directoryPath = `${require('os').homedir()}/Downloads`;
            }

            this.elements.modalConfirm.disabled = true;
            this.elements.modalConfirm.textContent = 'Setting...';

            const response = await fetch('/api/files/set-directory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ directory: directoryPath })
            });

            const data = await response.json();

            if (data.success) {
                this.workingDirectory = data.directory;
                this.updateCurrentDirectoryDisplay();
                this.hideDirectoryModal();
                this.addMessage('assistant', `✅ Working directory set to: ${data.directory}`, false, {
                    type: 'success',
                    title: 'Directory Changed',
                    details: `Now creating files in: ${data.directory}`
                });
                this.loadFiles(); // Refresh file list
            } else {
                this.addMessage('assistant', `❌ Failed to set directory: ${data.error}`, true);
            }
        } catch (error) {
            console.error('Error setting directory:', error);
            this.addMessage('assistant', `❌ Error setting directory: ${error.message}`, true);
        } finally {
            this.elements.modalConfirm.disabled = false;
            this.elements.modalConfirm.textContent = 'Set Directory';
        }
    }

    setupQuickActions() {
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.elements.messageInput.value = action;
                this.sendMessage();
            });
        });
    }

    async loadFiles(path = '') {
        try {
            this.elements.fileList.innerHTML = '<div class="loading">Loading files...</div>';
            
            const response = await fetch(`/api/files/list?path=${encodeURIComponent(path)}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderFiles(data.items);
                this.updateBreadcrumb(path);
                this.currentPath = path;
                
                // Update working directory display if provided
                if (data.currentDirectory) {
                    this.workingDirectory = data.currentDirectory;
                    this.updateCurrentDirectoryDisplay();
                }
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error loading files:', error);
            this.elements.fileList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading files: ${error.message}</p>
                </div>
            `;
        }
    }

    renderFiles(items) {
        if (items.length === 0) {
            this.elements.fileList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>This folder is empty</p>
                </div>
            `;
            return;
        }

        const html = items.map(item => `
            <div class="file-item" data-path="${item.path}" data-type="${item.type}">
                <div class="file-icon ${item.type}">
                    <i class="fas fa-${item.type === 'folder' ? 'folder' : 'file-alt'}"></i>
                </div>
                <div class="file-name">${item.name}</div>
                <div class="file-actions">
                    ${item.type === 'folder' ? 
                        '<button class="action-btn" data-action="open" title="Open"><i class="fas fa-folder-open"></i></button>' : 
                        '<button class="action-btn" data-action="view" title="View"><i class="fas fa-eye"></i></button>'
                    }
                    <button class="action-btn" data-action="delete" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.elements.fileList.innerHTML = html;
    }

    updateBreadcrumb(path) {
        const parts = path ? path.split('/').filter(p => p) : [];
        const breadcrumbHtml = ['<span class="breadcrumb-item" data-path="">Root</span>'];
        
        let currentPath = '';
        parts.forEach(part => {
            currentPath += (currentPath ? '/' : '') + part;
            breadcrumbHtml.push(`<span class="breadcrumb-item" data-path="${currentPath}">${part}</span>`);
        });
        
        this.elements.breadcrumb.innerHTML = breadcrumbHtml.join('');
        
        // Update active state
        this.elements.breadcrumb.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.classList.toggle('active', item.dataset.path === path);
            item.addEventListener('click', () => this.loadFiles(item.dataset.path));
        });
    }

    handleFileClick(e) {
        const fileItem = e.target.closest('.file-item');
        const actionBtn = e.target.closest('.action-btn');
        
        if (!fileItem) return;
        
        const path = fileItem.dataset.path;
        const type = fileItem.dataset.type;
        
        if (actionBtn) {
            const action = actionBtn.dataset.action;
            this.handleFileAction(action, path, type);
        } else if (type === 'folder') {
            this.loadFiles(path);
        }
    }

    async handleFileAction(action, path, type) {
        try {
            switch (action) {
                case 'open':
                    if (type === 'folder') {
                        this.loadFiles(path);
                    }
                    break;
                    
                case 'view':
                    if (type === 'file') {
                        await this.viewFile(path);
                    }
                    break;
                    
                case 'delete':
                    if (confirm(`Are you sure you want to delete ${path}?`)) {
                        await this.deleteItem(path);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error handling file action:', error);
            this.addMessage('assistant', `Error: ${error.message}`, true);
        }
    }

    async viewFile(path) {
        try {
            const response = await fetch(`/api/files/content?path=${encodeURIComponent(path)}`);
            const data = await response.json();
            
            if (data.success) {
                this.addMessage('assistant', `Content of ${path}:\n\`\`\`\n${data.content}\n\`\`\``);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            throw new Error(`Failed to view file: ${error.message}`);
        }
    }

    async deleteItem(path) {
        try {
            const response = await fetch('/api/files/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.addMessage('assistant', `Successfully deleted ${path}`, false, {
                    type: 'success',
                    title: 'File Deleted',
                    details: `${path} has been removed`
                });
                this.loadFiles(this.currentPath);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            throw new Error(`Failed to delete item: ${error.message}`);
        }
    }

    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message || this.isProcessing) return;

        this.isProcessing = true;
        this.elements.messageInput.value = '';
        this.elements.sendBtn.disabled = true;

        // Add user message
        this.addMessage('user', message);
        
        // Add loading indicator
        const loadingId = this.addLoadingMessage();

        try {
            const response = await fetch('/api/ai/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    context: {
                        currentPath: this.currentPath,
                        workingDirectory: this.workingDirectory,
                        selectedItems: Array.from(this.selectedItems)
                    }
                })
            });

            const data = await response.json();
            
            // Remove loading indicator
            this.removeLoadingMessage(loadingId);

            if (data.success) {
                const aiResponse = data.response;
                
                // Handle directory-related responses
                if (aiResponse.type === 'directory_request') {
                    this.addMessage('assistant', aiResponse.message);
                    this.addMessage('assistant', 'You can also click the "Change Directory" button above to set your working directory through the interface.', false);
                } else if (aiResponse.type === 'directory_set') {
                    this.workingDirectory = aiResponse.actionResult?.directory || this.workingDirectory;
                    this.updateCurrentDirectoryDisplay();
                    this.addMessage('assistant', aiResponse.message, false, {
                        type: 'success',
                        title: 'Directory Set',
                        details: aiResponse.actionResult?.message || 'Working directory updated'
                    });
                    this.loadFiles(); // Refresh file list
                } else {
                    // Regular AI response
                    this.addMessage('assistant', aiResponse.message, false, 
                        aiResponse.actionResult ? {
                            type: aiResponse.actionResult.error ? 'error' : 'success',
                            title: aiResponse.action ? `Action: ${aiResponse.action.operation}` : 'Result',
                            details: aiResponse.actionResult.error || 
                                    aiResponse.actionResult.message ||
                                    JSON.stringify(aiResponse.actionResult, null, 2)
                        } : null
                    );
                }
                
                // Update working directory if provided
                if (aiResponse.workingDirectory) {
                    this.workingDirectory = aiResponse.workingDirectory;
                    this.updateCurrentDirectoryDisplay();
                }
                
                // Refresh file list if action was performed
                if (aiResponse.actionResult && !aiResponse.actionResult.error) {
                    setTimeout(() => this.loadFiles(this.currentPath), 500);
                }
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error processing message:', error);
            this.removeLoadingMessage(loadingId);
            this.addMessage('assistant', `Sorry, I encountered an error: ${error.message}`, true);
        } finally {
            this.isProcessing = false;
            this.elements.sendBtn.disabled = false;
            this.elements.messageInput.focus();
        }
    }

    addMessage(sender, content, isError = false, actionResult = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatar = sender === 'user' ? 
            '<div class="message-avatar"><i class="fas fa-user"></i></div>' :
            '<div class="message-avatar"><i class="fas fa-robot"></i></div>';
        
        let actionResultHtml = '';
        if (actionResult) {
            actionResultHtml = `
                <div class="action-result ${actionResult.type}">
                    <div class="result-title">
                        <i class="fas fa-${actionResult.type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                        ${actionResult.title}
                    </div>
                    <div class="result-details">${actionResult.details}</div>
                </div>
            `;
        }
        
        messageDiv.innerHTML = `
            ${avatar}
            <div class="message-content ${isError ? 'error' : ''}">
                <p>${this.formatMessage(content)}</p>
                ${actionResultHtml}
            </div>
        `;
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addLoadingMessage() {
        const loadingId = 'loading-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant';
        messageDiv.id = loadingId;
        
        messageDiv.innerHTML = `
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="loading-indicator">
                <span>Thinking</span>
                <div class="loading-dots">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `;
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        return loadingId;
    }

    removeLoadingMessage(loadingId) {
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    formatMessage(content) {
        // Simple markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/\n/g, '<br>');
    }

    scrollToBottom() {
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    clearChat() {
        const initialMessage = this.elements.chatMessages.querySelector('.message.assistant');
        this.elements.chatMessages.innerHTML = '';
        if (initialMessage) {
            this.elements.chatMessages.appendChild(initialMessage);
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new AIFileManager();
});