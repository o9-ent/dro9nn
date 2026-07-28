// src/models/index.ts
import { Backend, Device, DataType } from "@o9nn/core";
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
    return this.client.get(`/api/v1/models/${modelId}`);
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
    await this.client.delete(`/api/v1/models/${modelId}`);
  }
  /**
   * Run inference on a model
   */
  async infer(modelId, input, options) {
    return this.client.post(`/api/v1/models/${modelId}/infer`, {
      input,
      options
    });
  }
  /**
   * Generate text using a language model
   */
  async generate(modelId, options) {
    return this.client.post(`/api/v1/models/${modelId}/generate`, options);
  }
  /**
   * Stream generation results
   */
  async *generateStream(modelId, options) {
    const response = await this.client.request(
      `/api/v1/models/${modelId}/generate/stream`,
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
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6));
          yield data;
        }
      }
    }
  }
};
function createModelConfig(name, options = {}) {
  return {
    name,
    backend: options.backend || Backend.PYTORCH,
    device: options.device || Device.CPU,
    dtype: options.dtype || DataType.FLOAT32,
    ...options
  };
}

export {
  ModelManager,
  createModelConfig
};
