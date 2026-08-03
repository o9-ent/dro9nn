/**
 * Tools tree view provider
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CogctlClient } from '../cogctl';

export class ToolsTreeProvider implements vscode.TreeDataProvider<ToolItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<ToolItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private client: CogctlClient) {
        // Watch for file changes in tools directory
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            const watcher = vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(workspaceFolders[0], '**/tools/**/*.{py,ts,go}')
            );
            watcher.onDidCreate(() => this.refresh());
            watcher.onDidDelete(() => this.refresh());
            watcher.onDidChange(() => this.refresh());
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: ToolItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ToolItem): Promise<ToolItem[]> {
        if (element) {
            return [];
        }

        // Find tools in the workspace
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return [new PlaceholderItem()];
        }

        const tools: ToolItem[] = [];
        const rootPath = workspaceFolders[0].uri.fsPath;
        const toolsPath = path.join(rootPath, 'tools');

        if (fs.existsSync(toolsPath)) {
            const files = fs.readdirSync(toolsPath, { withFileTypes: true });
            for (const file of files) {
                if (file.isFile() && /\.(py|ts|go)$/.test(file.name)) {
                    tools.push(new ToolItem(file.name, path.join(toolsPath, file.name)));
                }
            }
        }

        // Also look in src/tools
        const srcToolsPath = path.join(rootPath, 'src', 'tools');
        if (fs.existsSync(srcToolsPath)) {
            const files = fs.readdirSync(srcToolsPath, { withFileTypes: true });
            for (const file of files) {
                if (file.isFile() && /\.(py|ts|go)$/.test(file.name)) {
                    tools.push(new ToolItem(file.name, path.join(srcToolsPath, file.name)));
                }
            }
        }

        if (tools.length === 0) {
            return [new PlaceholderItem()];
        }

        return tools;
    }
}

export class ToolItem extends vscode.TreeItem {
    constructor(
        public readonly name: string,
        public readonly filePath: string
    ) {
        super(name.replace(/\.(py|ts|go)$/, ''), vscode.TreeItemCollapsibleState.None);
        
        this.tooltip = filePath;
        
        // Set icon based on language
        if (name.endsWith('.py')) {
            this.iconPath = new vscode.ThemeIcon('symbol-method');
            this.description = 'Python';
        } else if (name.endsWith('.ts')) {
            this.iconPath = new vscode.ThemeIcon('symbol-method');
            this.description = 'TypeScript';
        } else if (name.endsWith('.go')) {
            this.iconPath = new vscode.ThemeIcon('symbol-method');
            this.description = 'Go';
        }

        this.contextValue = 'tool';
        this.command = {
            command: 'vscode.open',
            title: 'Open Tool',
            arguments: [vscode.Uri.file(filePath)]
        };
    }
}

class PlaceholderItem extends vscode.TreeItem {
    constructor() {
        super('No tools found', vscode.TreeItemCollapsibleState.None);
        this.description = 'Use "Generate Tool" to create one';
        this.iconPath = new vscode.ThemeIcon('info');
    }
}
