/**
 * REPL Panel
 * 
 * Webview panel for interactive model interaction.
 */

import * as vscode from 'vscode';
import { CogctlClient } from '../cogctl';

export class ReplPanel {
    public static currentPanel: ReplPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private readonly client: CogctlClient;
    private disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, client: CogctlClient) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (ReplPanel.currentPanel) {
            ReplPanel.currentPanel.panel.reveal(column);
            return;
        }

        // Create new panel
        const panel = vscode.window.createWebviewPanel(
            'o9nnRepl',
            'o9nn REPL',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        ReplPanel.currentPanel = new ReplPanel(panel, extensionUri, client);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        client: CogctlClient
    ) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.client = client;

        // Set initial content
        this.update();

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            message => this.handleMessage(message),
            null,
            this.disposables
        );

        // Handle panel disposal
        this.panel.onDidDispose(
            () => this.dispose(),
            null,
            this.disposables
        );
    }

    private async handleMessage(message: { command: string; text?: string; model?: string }) {
        switch (message.command) {
            case 'send':
                if (message.text) {
                    await this.sendMessage(message.text, message.model || 'llama-2-7b-chat');
                }
                break;
            case 'clear':
                this.panel.webview.postMessage({ command: 'clear' });
                break;
        }
    }

    private async sendMessage(text: string, model: string) {
        // Show typing indicator
        this.panel.webview.postMessage({
            command: 'typing',
            role: 'assistant'
        });

        try {
            const response = await this.client.runInference(text, model);
            this.panel.webview.postMessage({
                command: 'response',
                role: 'assistant',
                content: response
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.panel.webview.postMessage({
                command: 'error',
                content: `Error: ${errorMessage}`
            });
        }
    }

    private update() {
        this.panel.webview.html = this.getHtmlContent();
    }

    private getHtmlContent(): string {
        const config = vscode.workspace.getConfiguration('o9nn');
        const defaultModel = config.get<string>('defaultModel', 'llama-2-7b-chat');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>o9nn REPL</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        .header {
            padding: 10px 15px;
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .header h2 {
            margin: 0;
            font-size: 14px;
            font-weight: 500;
        }
        .model-select {
            margin-left: auto;
            padding: 5px;
            background: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 3px;
        }
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 15px;
        }
        .message {
            margin-bottom: 15px;
            padding: 10px 15px;
            border-radius: 8px;
            max-width: 80%;
        }
        .message.user {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            margin-left: auto;
        }
        .message.assistant {
            background-color: var(--vscode-editorWidget-background);
            border: 1px solid var(--vscode-editorWidget-border);
        }
        .message.error {
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
        }
        .typing {
            opacity: 0.6;
            font-style: italic;
        }
        .input-area {
            padding: 15px;
            border-top: 1px solid var(--vscode-panel-border);
            display: flex;
            gap: 10px;
        }
        .input-area textarea {
            flex: 1;
            padding: 10px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 5px;
            resize: none;
            font-family: inherit;
            min-height: 60px;
        }
        .input-area textarea:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        .input-area button {
            padding: 10px 20px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 500;
        }
        .input-area button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        pre {
            background: var(--vscode-textBlockQuote-background);
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
        }
        code {
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>🧠 o9nn REPL</h2>
        <select id="model" class="model-select">
            <option value="llama-2-7b-chat" ${defaultModel === 'llama-2-7b-chat' ? 'selected' : ''}>llama-2-7b-chat</option>
            <option value="mistral-7b-instruct" ${defaultModel === 'mistral-7b-instruct' ? 'selected' : ''}>mistral-7b-instruct</option>
            <option value="codellama-13b" ${defaultModel === 'codellama-13b' ? 'selected' : ''}>codellama-13b</option>
        </select>
        <button onclick="clearChat()">Clear</button>
    </div>
    
    <div class="messages" id="messages">
        <div class="message assistant">
            👋 Welcome to the o9nn REPL! Type a message below to start.
        </div>
    </div>
    
    <div class="input-area">
        <textarea id="input" placeholder="Type your message..." onkeydown="handleKeydown(event)"></textarea>
        <button onclick="send()">Send</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const messagesEl = document.getElementById('messages');
        const inputEl = document.getElementById('input');
        const modelEl = document.getElementById('model');

        function send() {
            const text = inputEl.value.trim();
            if (!text) return;
            
            // Add user message
            addMessage('user', text);
            
            // Send to extension
            vscode.postMessage({
                command: 'send',
                text: text,
                model: modelEl.value
            });
            
            inputEl.value = '';
        }

        function handleKeydown(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                send();
            }
        }

        function addMessage(role, content) {
            const msg = document.createElement('div');
            msg.className = 'message ' + role;
            msg.textContent = content;
            messagesEl.appendChild(msg);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        function clearChat() {
            messagesEl.innerHTML = '<div class="message assistant">Chat cleared. Type a message to start a new conversation.</div>';
        }

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            // Remove typing indicator
            const typing = messagesEl.querySelector('.typing');
            if (typing) typing.remove();
            
            switch (message.command) {
                case 'typing':
                    const typingEl = document.createElement('div');
                    typingEl.className = 'message assistant typing';
                    typingEl.textContent = 'Thinking...';
                    messagesEl.appendChild(typingEl);
                    messagesEl.scrollTop = messagesEl.scrollHeight;
                    break;
                case 'response':
                    addMessage(message.role, message.content);
                    break;
                case 'error':
                    const errorEl = document.createElement('div');
                    errorEl.className = 'message error';
                    errorEl.textContent = message.content;
                    messagesEl.appendChild(errorEl);
                    messagesEl.scrollTop = messagesEl.scrollHeight;
                    break;
                case 'clear':
                    clearChat();
                    break;
            }
        });

        // Focus input on load
        inputEl.focus();
    </script>
</body>
</html>`;
    }

    public dispose() {
        ReplPanel.currentPanel = undefined;
        this.panel.dispose();
        while (this.disposables.length) {
            const d = this.disposables.pop();
            if (d) {
                d.dispose();
            }
        }
    }
}
