/**
 * Models tree view provider
 */

import * as vscode from 'vscode';
import { CogctlClient, ModelInfo } from '../cogctl';

export class ModelsTreeProvider implements vscode.TreeDataProvider<ModelItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<ModelItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private client: CogctlClient) {}

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: ModelItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ModelItem): Promise<ModelItem[]> {
        if (element) {
            return [];
        }

        try {
            const models = await this.client.listModels();
            return models.map(model => new ModelItem(model));
        } catch (error) {
            vscode.window.showErrorMessage('Failed to list models');
            return [];
        }
    }
}

export class ModelItem extends vscode.TreeItem {
    constructor(public readonly model: ModelInfo) {
        super(model.name, vscode.TreeItemCollapsibleState.None);
        
        this.tooltip = `${model.name} (${model.version})\nBackend: ${model.backend}\nSize: ${model.size}`;
        this.description = `${model.version} - ${model.status}`;
        
        // Set icon based on status
        if (model.status === 'downloaded') {
            this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('terminal.ansiGreen'));
        } else {
            this.iconPath = new vscode.ThemeIcon('cloud-download');
        }

        // Context value for conditional menus
        this.contextValue = model.status === 'downloaded' ? 'downloadedModel' : 'availableModel';
    }
}
