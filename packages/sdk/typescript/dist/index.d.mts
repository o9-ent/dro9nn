export * from '@o9nn/core';
export { AgentConfig, Backend, DataType, Device, InferenceOptions, MemoryConfig, ModelConfig, ToolConfig } from '@o9nn/core';
export { ApiError, ApiResponse, ClientConfig, CogClient, RequestOptions, createClient } from './client/index.mjs';
export { GenerationOptions, InferenceResult, ModelInfo, ModelManager, createModelConfig } from './models/index.mjs';
export { AgentBuilder, AgentInfo, AgentManager, AgentMessage, AgentResponse, ConversationHistory, ToolCall, createTool } from './agents/index.mjs';

/**
 * @o9nn/cog-sdk - Main entry point
 *
 * TypeScript/JavaScript SDK for the o9nn cognitive computing platform.
 */

declare const SDK_VERSION = "0.1.0";
interface CogSDKConfig {
    baseUrl?: string;
    apiKey?: string;
    timeout?: number;
    retries?: number;
}
/**
 * Initialize the o9nn SDK with configuration
 */
declare function createCogSDK(config?: CogSDKConfig): {
    config: {
        baseUrl: string;
        apiKey: string;
        timeout: number;
        retries: number;
    };
    version: string;
};

export { type CogSDKConfig, SDK_VERSION, createCogSDK };
