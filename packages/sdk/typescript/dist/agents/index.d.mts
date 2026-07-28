import { ModelConfig, ToolConfig, MemoryConfig, AgentConfig } from '@o9nn/core';
export { AgentConfig, MemoryConfig, ToolConfig } from '@o9nn/core';
import { CogClient } from '../client/index.mjs';

/**
 * Agent framework for o9nn SDK
 */

interface AgentInfo {
    id: string;
    name: string;
    status: 'idle' | 'running' | 'stopped' | 'error';
    model: ModelConfig;
    tools: string[];
    createdAt: string;
    updatedAt: string;
}
interface AgentMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    name?: string;
    toolCallId?: string;
}
interface AgentResponse {
    id: string;
    agentId: string;
    message: AgentMessage;
    toolCalls?: ToolCall[];
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason: 'stop' | 'tool_call' | 'length' | 'error';
}
interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}
interface ConversationHistory {
    messages: AgentMessage[];
    summary?: string;
    tokenCount: number;
}
/**
 * Agent manager for creating and interacting with AI agents
 */
declare class AgentManager {
    private client;
    constructor(client: CogClient);
    /**
     * List available agents
     */
    list(): Promise<AgentInfo[]>;
    /**
     * Get agent information
     */
    get(agentId: string): Promise<AgentInfo>;
    /**
     * Create a new agent
     */
    create(config: AgentConfig): Promise<AgentInfo>;
    /**
     * Delete an agent
     */
    delete(agentId: string): Promise<void>;
    /**
     * Chat with an agent
     */
    chat(agentId: string, message: string, history?: AgentMessage[]): Promise<AgentResponse>;
    /**
     * Execute a tool call result
     */
    executeToolResult(agentId: string, toolCallId: string, result: unknown): Promise<AgentResponse>;
    /**
     * Get conversation history
     */
    getHistory(agentId: string, sessionId?: string): Promise<ConversationHistory>;
    /**
     * Clear conversation history
     */
    clearHistory(agentId: string, sessionId?: string): Promise<void>;
}
/**
 * Agent builder for creating agent configurations
 */
declare class AgentBuilder {
    private config;
    private tools;
    constructor(name: string);
    /**
     * Set the model configuration
     */
    withModel(model: ModelConfig): AgentBuilder;
    /**
     * Add a tool to the agent
     */
    addTool(tool: ToolConfig): AgentBuilder;
    /**
     * Set memory configuration
     */
    withMemory(memory: MemoryConfig): AgentBuilder;
    /**
     * Set maximum iterations
     */
    withMaxIterations(max: number): AgentBuilder;
    /**
     * Build the agent configuration
     */
    build(): AgentConfig;
}
/**
 * Create a tool configuration
 */
declare function createTool(name: string, description: string, execute: ToolConfig['execute'], parameters?: ToolConfig['parameters']): ToolConfig;

export { AgentBuilder, type AgentInfo, AgentManager, type AgentMessage, type AgentResponse, type ConversationHistory, type ToolCall, createTool };
