/**
 * @o9nn/cog-sdk - Main entry point
 *
 * TypeScript/JavaScript SDK for the o9nn cognitive computing platform.
 */

// Re-export core types
export * from '@o9nn/core';

// Client exports
export * from './client';

// Model exports
export * from './models';

// Agent exports
export * from './agents';

// SDK version
export const SDK_VERSION = '0.1.0';

// Default configuration
export interface CogSDKConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

/**
 * Initialize the o9nn SDK with configuration
 */
export function createCogSDK(config: CogSDKConfig = {}) {
  const defaultConfig: Required<CogSDKConfig> = {
    baseUrl: process.env.O9NN_API_URL || 'http://localhost:8080',
    apiKey: process.env.O9NN_API_KEY || '',
    timeout: 30000,
    retries: 3,
  };

  const mergedConfig = { ...defaultConfig, ...config };

  return {
    config: mergedConfig,
    version: SDK_VERSION,
  };
}
