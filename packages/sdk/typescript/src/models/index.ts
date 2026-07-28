/**
 * Model management for o9nn SDK
 */

import { ModelConfig, InferenceOptions, Backend, Device, DataType } from '@o9nn/core';
import { CogClient } from '../client';

export interface ModelInfo {
  id: string;
  name: string;
  version: string;
  backend: Backend;
  size: number;
  quantization?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InferenceResult {
  id: string;
  modelId: string;
  output: unknown;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latency: number;
}

export interface GenerationOptions extends InferenceOptions {
  prompt: string;
  stopSequences?: string[];
  repetitionPenalty?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}

/**
 * Model manager for listing, loading, and running inference
 */
export class ModelManager {
  private client: CogClient;

  constructor(client: CogClient) {
    this.client = client;
  }

  /**
   * List available models
   */
  async list(filter?: { backend?: Backend }): Promise<ModelInfo[]> {
    const params = filter ? `?backend=${filter.backend}` : '';
    return this.client.get<ModelInfo[]>(`/api/v1/models${params}`);
  }

  /**
   * Get model information
   */
  async get(modelId: string): Promise<ModelInfo> {
    return this.client.get<ModelInfo>(`/api/v1/models/${encodeURIComponent(modelId)}`);
  }

  /**
   * Load a model
   */
  async load(config: ModelConfig): Promise<ModelInfo> {
    return this.client.post<ModelInfo>('/api/v1/models/load', config);
  }

  /**
   * Unload a model
   */
  async unload(modelId: string): Promise<void> {
    await this.client.delete(`/api/v1/models/${encodeURIComponent(modelId)}`);
  }

  /**
   * Run inference on a model
   */
  async infer(modelId: string, input: unknown, options?: InferenceOptions): Promise<InferenceResult> {
    return this.client.post<InferenceResult>(`/api/v1/models/${encodeURIComponent(modelId)}/infer`, {
      input,
      options,
    });
  }

  /**
   * Generate text using a language model
   */
  async generate(modelId: string, options: GenerationOptions): Promise<InferenceResult> {
    return this.client.post<InferenceResult>(`/api/v1/models/${encodeURIComponent(modelId)}/generate`, options);
  }

  /**
   * Stream generation results
   */
  async *generateStream(
    modelId: string,
    options: GenerationOptions
  ): AsyncGenerator<{ token: string; finished: boolean }> {
    const response = await this.client.request<ReadableStream>(
      `/api/v1/models/${encodeURIComponent(modelId)}/generate/stream`,
      {
        method: 'POST',
        body: options,
      }
    );

    // This is a simplified streaming implementation
    // In a real implementation, you would handle SSE or WebSocket streaming
    const reader = (response.data as unknown as { getReader: () => ReadableStreamDefaultReader<Uint8Array> }).getReader?.();
    if (!reader) {
      throw new Error('Streaming not supported');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const content = line.slice(6).trim();
            // Skip SSE control messages like [DONE] or empty lines
            if (!content || content === '[DONE]') continue;
            try {
              const data = JSON.parse(content);
              yield data;
            } catch {
              // Skip malformed JSON lines (keep-alive, truncated data, etc.)
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

/**
 * Create a model configuration helper
 */
export function createModelConfig(
  name: string,
  options: Partial<ModelConfig> = {}
): ModelConfig {
  return {
    name,
    backend: options.backend || Backend.PYTORCH,
    device: options.device || Device.CPU,
    dtype: options.dtype || DataType.FLOAT32,
    ...options,
  };
}

// Export types
export type { ModelConfig, InferenceOptions, Backend, Device, DataType };
