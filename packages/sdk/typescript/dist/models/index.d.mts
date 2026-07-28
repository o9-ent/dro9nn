import { InferenceOptions, Backend, ModelConfig } from '@o9nn/core';
export { Backend, DataType, Device, InferenceOptions, ModelConfig } from '@o9nn/core';
import { CogClient } from '../client/index.mjs';

/**
 * Model management for o9nn SDK
 */

interface ModelInfo {
    id: string;
    name: string;
    version: string;
    backend: Backend;
    size: number;
    quantization?: string;
    createdAt: string;
    updatedAt: string;
}
interface InferenceResult {
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
interface GenerationOptions extends InferenceOptions {
    prompt: string;
    stopSequences?: string[];
    repetitionPenalty?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
}
/**
 * Model manager for listing, loading, and running inference
 */
declare class ModelManager {
    private client;
    constructor(client: CogClient);
    /**
     * List available models
     */
    list(filter?: {
        backend?: Backend;
    }): Promise<ModelInfo[]>;
    /**
     * Get model information
     */
    get(modelId: string): Promise<ModelInfo>;
    /**
     * Load a model
     */
    load(config: ModelConfig): Promise<ModelInfo>;
    /**
     * Unload a model
     */
    unload(modelId: string): Promise<void>;
    /**
     * Run inference on a model
     */
    infer(modelId: string, input: unknown, options?: InferenceOptions): Promise<InferenceResult>;
    /**
     * Generate text using a language model
     */
    generate(modelId: string, options: GenerationOptions): Promise<InferenceResult>;
    /**
     * Stream generation results
     */
    generateStream(modelId: string, options: GenerationOptions): AsyncGenerator<{
        token: string;
        finished: boolean;
    }>;
}
/**
 * Create a model configuration helper
 */
declare function createModelConfig(name: string, options?: Partial<ModelConfig>): ModelConfig;

export { type GenerationOptions, type InferenceResult, type ModelInfo, ModelManager, createModelConfig };
