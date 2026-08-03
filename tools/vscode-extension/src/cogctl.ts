/**
 * Cogctl CLI client wrapper
 */

import * as vscode from 'vscode';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ModelInfo {
    name: string;
    version: string;
    size: string;
    backend: string;
    status: string;
}

export interface AgentInfo {
    id: string;
    name: string;
    model: string;
    status: string;
}

export class CogctlClient {
    private cogctlPath: string;
    private apiUrl: string;
    private apiKey: string;

    constructor(context: vscode.ExtensionContext) {
        const config = vscode.workspace.getConfiguration('o9nn');
        this.cogctlPath = config.get<string>('cogctlPath', 'cogctl');
        this.apiUrl = config.get<string>('apiUrl', 'http://localhost:8080');
        this.apiKey = config.get<string>('apiKey', '');

        // Listen for configuration changes
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('o9nn')) {
                    this.updateConfig();
                }
            })
        );
    }

    private updateConfig() {
        const config = vscode.workspace.getConfiguration('o9nn');
        this.cogctlPath = config.get<string>('cogctlPath', 'cogctl');
        this.apiUrl = config.get<string>('apiUrl', 'http://localhost:8080');
        this.apiKey = config.get<string>('apiKey', '');
    }

    /**
     * Execute a cogctl command
     */
    async execute(command: string): Promise<string> {
        const { stdout, stderr } = await execAsync(`${this.cogctlPath} ${command}`);
        if (stderr) {
            console.warn('cogctl stderr:', stderr);
        }
        return stdout;
    }

    /**
     * List available models
     */
    async listModels(): Promise<ModelInfo[]> {
        try {
            const output = await this.execute('model list --json');
            // Parse JSON output (assuming cogctl supports --json)
            // Fallback to parsing text output
            return this.parseModelList(output);
        } catch {
            // Return mock data if cogctl is not available
            return [
                { name: 'llama-2-7b-chat', version: 'v1.0', size: '13.5GB', backend: 'llama.cpp', status: 'downloaded' },
                { name: 'mistral-7b-instruct', version: 'v0.2', size: '14.5GB', backend: 'llama.cpp', status: 'available' },
            ];
        }
    }

    private parseModelList(output: string): ModelInfo[] {
        const lines = output.trim().split('\n');
        const models: ModelInfo[] = [];

        // Skip header line
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(/\s{2,}/);
            if (parts.length >= 5) {
                models.push({
                    name: parts[0],
                    version: parts[1],
                    size: parts[2],
                    backend: parts[3],
                    status: parts[4],
                });
            }
        }

        return models;
    }

    /**
     * List agents
     */
    async listAgents(): Promise<AgentInfo[]> {
        // TODO: Implement when cogctl supports agent listing
        return [];
    }

    /**
     * Run inference
     */
    async runInference(prompt: string, model: string): Promise<string> {
        // TODO: Implement actual API call
        // For now, return a placeholder
        return `[${model}] Generated response for: ${prompt.substring(0, 50)}...`;
    }

    /**
     * Check if cogctl is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            await this.execute('version');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get cogctl version
     */
    async getVersion(): Promise<string> {
        try {
            const output = await this.execute('version');
            const match = output.match(/cogctl version (\S+)/);
            return match ? match[1] : 'unknown';
        } catch {
            return 'unavailable';
        }
    }
}
