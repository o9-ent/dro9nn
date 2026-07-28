/**
 * Agent framework for o9nn SDK
 */

import { AgentConfig, ToolConfig, MemoryConfig, ModelConfig } from '@o9nn/core';
import { CogClient } from '../client';

export interface AgentInfo {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'stopped' | 'error';
  model: ModelConfig;
  tools: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface AgentResponse {
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

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ConversationHistory {
  messages: AgentMessage[];
  summary?: string;
  tokenCount: number;
}

/**
 * Agent manager for creating and interacting with AI agents
 */
export class AgentManager {
  private client: CogClient;

  constructor(client: CogClient) {
    this.client = client;
  }

  /**
   * List available agents
   */
  async list(): Promise<AgentInfo[]> {
    return this.client.get<AgentInfo[]>('/api/v1/agents');
  }

  /**
   * Get agent information
   */
  async get(agentId: string): Promise<AgentInfo> {
    return this.client.get<AgentInfo>(`/api/v1/agents/${encodeURIComponent(agentId)}`);
  }

  /**
   * Create a new agent
   * NOTE: Tools with execute functions are stripped before sending to the API
   * as functions cannot be serialized. Use local tool registration for client-side execution.
   */
  async create(config: AgentConfig): Promise<AgentInfo> {
    // Strip execute functions from tools before sending to API
    const apiConfig = {
      ...config,
      tools: config.tools?.map(({ execute: _, ...tool }) => tool),
    };
    return this.client.post<AgentInfo>('/api/v1/agents', apiConfig);
  }

  /**
   * Delete an agent
   */
  async delete(agentId: string): Promise<void> {
    await this.client.delete(`/api/v1/agents/${encodeURIComponent(agentId)}`);
  }

  /**
   * Chat with an agent
   */
  async chat(agentId: string, message: string, history?: AgentMessage[]): Promise<AgentResponse> {
    return this.client.post<AgentResponse>(`/api/v1/agents/${encodeURIComponent(agentId)}/chat`, {
      message,
      history,
    });
  }

  /**
   * Execute a tool call result
   */
  async executeToolResult(
    agentId: string,
    toolCallId: string,
    result: unknown
  ): Promise<AgentResponse> {
    return this.client.post<AgentResponse>(`/api/v1/agents/${encodeURIComponent(agentId)}/tool-result`, {
      toolCallId,
      result,
    });
  }

  /**
   * Get conversation history
   */
  async getHistory(agentId: string, sessionId?: string): Promise<ConversationHistory> {
    const params = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
    return this.client.get<ConversationHistory>(`/api/v1/agents/${encodeURIComponent(agentId)}/history${params}`);
  }

  /**
   * Clear conversation history
   */
  async clearHistory(agentId: string, sessionId?: string): Promise<void> {
    const params = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
    await this.client.delete(`/api/v1/agents/${encodeURIComponent(agentId)}/history${params}`);
  }
}

/**
 * Agent builder for creating agent configurations
 */
export class AgentBuilder {
  private config: Partial<AgentConfig> = {};
  private tools: ToolConfig[] = [];

  constructor(name: string) {
    this.config.name = name;
  }

  /**
   * Set the model configuration
   */
  withModel(model: ModelConfig): AgentBuilder {
    this.config.model = model;
    return this;
  }

  /**
   * Add a tool to the agent
   */
  addTool(tool: ToolConfig): AgentBuilder {
    this.tools.push(tool);
    return this;
  }

  /**
   * Set memory configuration
   */
  withMemory(memory: MemoryConfig): AgentBuilder {
    this.config.memory = memory;
    return this;
  }

  /**
   * Set maximum iterations
   */
  withMaxIterations(max: number): AgentBuilder {
    this.config.maxIterations = max;
    return this;
  }

  /**
   * Build the agent configuration
   */
  build(): AgentConfig {
    if (!this.config.name) {
      throw new Error('Agent name is required');
    }
    if (!this.config.model) {
      throw new Error('Agent model is required');
    }

    return {
      name: this.config.name,
      model: this.config.model,
      tools: this.tools.length > 0 ? this.tools : undefined,
      memory: this.config.memory,
      maxIterations: this.config.maxIterations,
    };
  }
}

/**
 * Create a tool configuration
 */
export function createTool(
  name: string,
  description: string,
  execute: ToolConfig['execute'],
  parameters?: ToolConfig['parameters']
): ToolConfig {
  return {
    name,
    description,
    execute,
    parameters,
  };
}

// Export types
export type { AgentConfig, ToolConfig, MemoryConfig };
