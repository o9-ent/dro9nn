import {
  AgentBuilder,
  AgentManager,
  createTool
} from "./chunk-Q3NURE7U.mjs";
import {
  ApiError,
  CogClient,
  createClient
} from "./chunk-C2QO64MG.mjs";
import {
  ModelManager,
  createModelConfig
} from "./chunk-QMXPA3DE.mjs";

// src/index.ts
export * from "@o9nn/core";
var SDK_VERSION = "0.1.0";
function createCogSDK(config = {}) {
  const defaultConfig = {
    baseUrl: process.env.O9NN_API_URL || "http://localhost:8080",
    apiKey: process.env.O9NN_API_KEY || "",
    timeout: 3e4,
    retries: 3
  };
  const mergedConfig = { ...defaultConfig, ...config };
  return {
    config: mergedConfig,
    version: SDK_VERSION
  };
}
export {
  AgentBuilder,
  AgentManager,
  ApiError,
  CogClient,
  ModelManager,
  SDK_VERSION,
  createClient,
  createCogSDK,
  createModelConfig,
  createTool
};
