/**
 * o9nn Cognitive VSCode Extension
 * 
 * Main entry point for the extension.
 */

import * as vscode from 'vscode';
import { CogctlClient } from './cogctl';
import { ModelsTreeProvider } from './views/models';
import { AgentsTreeProvider } from './views/agents';
import { ToolsTreeProvider } from './views/tools';
import { ReplPanel } from './panels/repl';

let statusBarItem: vscode.StatusBarItem;
let cogctlClient: CogctlClient;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('o9nn Cognitive extension is now active');

    // Initialize cogctl client
    cogctlClient = new CogctlClient(context);

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        100
    );
    statusBarItem.text = '$(brain) o9nn';
    statusBarItem.tooltip = 'o9nn Cognitive Platform';
    statusBarItem.command = 'o9nn.showMenu';
    
    const config = vscode.workspace.getConfiguration('o9nn');
    if (config.get<boolean>('showStatusBar', true)) {
        statusBarItem.show();
    }
    
    context.subscriptions.push(statusBarItem);

    // Register tree view providers
    const modelsProvider = new ModelsTreeProvider(cogctlClient);
    const agentsProvider = new AgentsTreeProvider(cogctlClient);
    const toolsProvider = new ToolsTreeProvider(cogctlClient);

    vscode.window.registerTreeDataProvider('o9nn-models', modelsProvider);
    vscode.window.registerTreeDataProvider('o9nn-agents', agentsProvider);
    vscode.window.registerTreeDataProvider('o9nn-tools', toolsProvider);

    // Register commands
    const commands = [
        vscode.commands.registerCommand('o9nn.startServer', () => startServer()),
        vscode.commands.registerCommand('o9nn.stopServer', () => stopServer()),
        vscode.commands.registerCommand('o9nn.openRepl', () => openRepl(context)),
        vscode.commands.registerCommand('o9nn.generateAgent', () => generateAgent()),
        vscode.commands.registerCommand('o9nn.generateTool', () => generateTool()),
        vscode.commands.registerCommand('o9nn.listModels', () => modelsProvider.refresh()),
        vscode.commands.registerCommand('o9nn.downloadModel', () => downloadModel()),
        vscode.commands.registerCommand('o9nn.runInference', () => runInference()),
        vscode.commands.registerCommand('o9nn.initProject', () => initProject()),
        vscode.commands.registerCommand('o9nn.showMenu', () => showMenu()),
    ];

    context.subscriptions.push(...commands);

    // Auto-start server if configured
    if (config.get<boolean>('autoStartServer', false)) {
        startServer();
    }
}

/**
 * Extension deactivation
 */
export function deactivate() {
    stopServer();
}

/**
 * Start the development server
 */
async function startServer() {
    const terminal = vscode.window.createTerminal('o9nn Dev Server');
    terminal.show();
    
    const cogctlPath = vscode.workspace.getConfiguration('o9nn').get<string>('cogctlPath', 'cogctl');
    terminal.sendText(`${cogctlPath} dev`);
    
    statusBarItem.text = '$(brain) o9nn $(check)';
    statusBarItem.tooltip = 'o9nn Development Server Running';
    
    vscode.window.showInformationMessage('o9nn development server started');
}

/**
 * Stop the development server
 */
async function stopServer() {
    // Find and close the terminal
    const terminal = vscode.window.terminals.find(t => t.name === 'o9nn Dev Server');
    if (terminal) {
        terminal.dispose();
    }
    
    statusBarItem.text = '$(brain) o9nn';
    statusBarItem.tooltip = 'o9nn Cognitive Platform';
    
    vscode.window.showInformationMessage('o9nn development server stopped');
}

/**
 * Open the REPL panel
 */
async function openRepl(context: vscode.ExtensionContext) {
    ReplPanel.createOrShow(context.extensionUri, cogctlClient);
}

/**
 * Generate a new agent
 */
async function generateAgent() {
    const name = await vscode.window.showInputBox({
        prompt: 'Enter agent name',
        placeHolder: 'my-agent',
        validateInput: (value) => {
            if (!value) {
                return 'Agent name is required';
            }
            if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(value)) {
                return 'Invalid agent name';
            }
            return null;
        }
    });

    if (!name) {
        return;
    }

    const language = await vscode.window.showQuickPick(
        ['python', 'typescript', 'go'],
        { placeHolder: 'Select language' }
    );

    if (!language) {
        return;
    }

    const terminal = vscode.window.createTerminal('o9nn Generate');
    terminal.show();
    
    const cogctlPath = vscode.workspace.getConfiguration('o9nn').get<string>('cogctlPath', 'cogctl');
    terminal.sendText(`${cogctlPath} generate agent ${name} --language ${language}`);
}

/**
 * Generate a new tool
 */
async function generateTool() {
    const name = await vscode.window.showInputBox({
        prompt: 'Enter tool name',
        placeHolder: 'my-tool',
        validateInput: (value) => {
            if (!value) {
                return 'Tool name is required';
            }
            if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(value)) {
                return 'Invalid tool name';
            }
            return null;
        }
    });

    if (!name) {
        return;
    }

    const language = await vscode.window.showQuickPick(
        ['python', 'typescript'],
        { placeHolder: 'Select language' }
    );

    if (!language) {
        return;
    }

    const terminal = vscode.window.createTerminal('o9nn Generate');
    terminal.show();
    
    const cogctlPath = vscode.workspace.getConfiguration('o9nn').get<string>('cogctlPath', 'cogctl');
    terminal.sendText(`${cogctlPath} generate tool ${name} --language ${language}`);
}

/**
 * Download a model
 */
async function downloadModel() {
    const modelName = await vscode.window.showInputBox({
        prompt: 'Enter model name to download',
        placeHolder: 'llama-2-7b-chat'
    });

    if (!modelName) {
        return;
    }

    const terminal = vscode.window.createTerminal('o9nn Model');
    terminal.show();
    
    const cogctlPath = vscode.workspace.getConfiguration('o9nn').get<string>('cogctlPath', 'cogctl');
    terminal.sendText(`${cogctlPath} model download ${modelName}`);
}

/**
 * Run inference on selected text
 */
async function runInference() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
    }

    const selection = editor.selection;
    const text = editor.document.getText(selection);

    if (!text) {
        vscode.window.showWarningMessage('No text selected');
        return;
    }

    const config = vscode.workspace.getConfiguration('o9nn');
    const model = config.get<string>('defaultModel', 'llama-2-7b-chat');

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Running inference...',
        cancellable: true
    }, async (progress, token) => {
        try {
            const result = await cogctlClient.runInference(text, model);
            
            // Insert result after selection
            editor.edit(editBuilder => {
                editBuilder.insert(selection.end, '\n\n' + result);
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Inference failed: ${errorMessage}`);
        }
    });
}

/**
 * Initialize a new project
 */
async function initProject() {
    const projectName = await vscode.window.showInputBox({
        prompt: 'Enter project name',
        placeHolder: 'my-project',
        validateInput: (value) => {
            if (!value) {
                return 'Project name is required';
            }
            if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(value)) {
                return 'Invalid project name';
            }
            return null;
        }
    });

    if (!projectName) {
        return;
    }

    const template = await vscode.window.showQuickPick(
        [
            { label: 'agent', description: 'AI agent with tool calling' },
            { label: 'inference', description: 'Model inference server' },
            { label: 'training', description: 'Model training pipeline' },
            { label: 'plugin', description: 'o9nn plugin/extension' },
            { label: 'minimal', description: 'Minimal project structure' }
        ],
        { placeHolder: 'Select project template' }
    );

    if (!template) {
        return;
    }

    const terminal = vscode.window.createTerminal('o9nn Init');
    terminal.show();
    
    const cogctlPath = vscode.workspace.getConfiguration('o9nn').get<string>('cogctlPath', 'cogctl');
    terminal.sendText(`${cogctlPath} init ${projectName} --template ${template.label}`);
}

/**
 * Show the command menu
 */
async function showMenu() {
    const items = [
        { label: '$(play) Start Development Server', command: 'o9nn.startServer' },
        { label: '$(debug-stop) Stop Development Server', command: 'o9nn.stopServer' },
        { label: '$(terminal) Open REPL', command: 'o9nn.openRepl' },
        { label: '$(add) Generate Agent', command: 'o9nn.generateAgent' },
        { label: '$(tools) Generate Tool', command: 'o9nn.generateTool' },
        { label: '$(cloud-download) Download Model', command: 'o9nn.downloadModel' },
        { label: '$(new-folder) Initialize Project', command: 'o9nn.initProject' },
    ];

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'o9nn Cognitive'
    });

    if (selected) {
        vscode.commands.executeCommand(selected.command);
    }
}
