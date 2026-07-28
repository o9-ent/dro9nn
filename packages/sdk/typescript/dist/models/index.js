"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/models/index.ts
var models_exports = {};
__export(models_exports, {
  ModelManager: () => ModelManager,
  createModelConfig: () => createModelConfig
});
module.exports = __toCommonJS(models_exports);
var import_core = require("@o9nn/core");
var ModelManager = class {
  client;
  constructor(client) {
    this.client = client;
  }
  /**
   * List available models
   */
  async list(filter) {
    const params = filter ? `?backend=${filter.backend}` : "";
    return this.client.get(`/api/v1/models${params}`);
  }
  /**
   * Get model information
   */
  async get(modelId) {
    return this.client.get(`/api/v1/models/${encodeURIComponent(modelId)}`);
  }
  /**
   * Load a model
   */
  async load(config) {
    return this.client.post("/api/v1/models/load", config);
  }
  /**
   * Unload a model
   */
  async unload(modelId) {
    await this.client.delete(`/api/v1/models/${encodeURIComponent(modelId)}`);
  }
  /**
   * Run inference on a model
   */
  async infer(modelId, input, options) {
    return this.client.post(`/api/v1/models/${encodeURIComponent(modelId)}/infer`, {
      input,
      options
    });
  }
  /**
   * Generate text using a language model
   */
  async generate(modelId, options) {
    return this.client.post(`/api/v1/models/${encodeURIComponent(modelId)}/generate`, options);
  }
  /**
   * Stream generation results
   */
  async *generateStream(modelId, options) {
    const response = await this.client.request(
      `/api/v1/models/${encodeURIComponent(modelId)}/generate/stream`,
      {
        method: "POST",
        body: options
      }
    );
    const reader = response.data.getReader?.();
    if (!reader) {
      throw new Error("Streaming not supported");
    }
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const content = line.slice(6).trim();
            if (!content || content === "[DONE]") continue;
            try {
              const data = JSON.parse(content);
              yield data;
            } catch {
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
};
function createModelConfig(name, options = {}) {
  return {
    name,
    backend: options.backend || import_core.Backend.PYTORCH,
    device: options.device || import_core.Device.CPU,
    dtype: options.dtype || import_core.DataType.FLOAT32,
    ...options
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ModelManager,
  createModelConfig
});
