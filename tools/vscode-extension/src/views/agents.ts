/**
 * Agents tree view provider
 */

import * as vscode from 'vscode';
import { CogctlClient, AgentInfo } from '../cogctl';

export class AgentsTreeProvider implements vscode.TreeDataProvider<AgentItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<AgentItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private client: CogctlClient) {}

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: AgentItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: AgentItem): Promise<AgentItem[]> {
        if (element) {
            return [];
        }

        try {
            const agents = await this.client.listAgents();
            if (agents.length === 0) {
                return [new PlaceholderItem()];
            }
            return agents.map(agent => new AgentItem(agent));
        } catch {
            return [new PlaceholderItem()];
        }
    }
}

export class AgentItem extends vscode.TreeItem {
    constructor(public readonly agent: AgentInfo) {
        super(agent.name, vscode.TreeItemCollapsibleState.None);
        
        this.tooltip = `${agent.name}\nModel: ${agent.model}\nStatus: ${agent.status}`;
        this.description = agent.model;
        
        // Set icon based on status
        if (agent.status === 'active') {
            this.iconPath = new vscode.ThemeIcon('debug-start', new vscode.ThemeColor('terminal.ansiGreen'));
        } else {
            this.iconPath = new vscode.ThemeIcon('debug-pause');
        }

        this.contextValue = 'agent';
    }
}

class PlaceholderItem extends vscode.TreeItem {
    constructor() {
        super('No agents running', vscode.TreeItemCollapsibleState.None);
        this.description = 'Start a server to see agents';
        this.iconPath = new vscode.ThemeIcon('info');
    }
}
