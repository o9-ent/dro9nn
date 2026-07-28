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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AgentBuilder: () => AgentBuilder,
  AgentManager: () => AgentManager,
  ApiError: () => ApiError,
  CogClient: () => CogClient,
  ModelManager: () => ModelManager,
  SDK_VERSION: () => SDK_VERSION,
  createClient: () => createClient,
  createCogSDK: () => createCogSDK,
  createModelConfig: () => createModelConfig,
  createTool: () => createTool
});
module.exports = __toCommonJS(index_exports);
__reExport(index_exports, require("@o9nn/core"), module.exports);

// src/client/index.ts
var import_core = require("@o9nn/core");
var CogClient = class {
  config;
  logger;
  constructor(config) {
    this.config = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey || "",
      timeout: config.timeout || 3e4,
      headers: config.headers || {}
    };
    this.logger = new import_core.Logger("CogClient", import_core.LogLevel.INFO);
  }
  /**
   * Make an HTTP request to the API
   */
  async request(endpoint, options = {}) {
    const url = `${this.config.baseUrl}${endpoint}`;
    const method = options.method || "GET";
    const headers = {
      "Content-Type": "application/json",
      ...this.config.headers,
      ...options.headers
    };
    if (this.config.apiKey) {
      headers["Authorization"] = "Bearer " + this.config.apiKey;
    }
    const fetchOptions = {
      method,
      headers
    };
    if (options.body && method !== "GET") {
      fetchOptions.body = JSON.stringify(options.body);
    }
    this.logger.debug(`${method} ${endpoint}`);
    const response = await (0, import_core.retry)(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          options.timeout || this.config.timeout
        );
        try {
          const res = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          return res;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      },
      {
        maxAttempts: 3,
        delay: 1e3,
        onError: (error, attempt) => {
          this.logger.warn(`Request failed (attempt ${attempt}): ${error.message}`);
        }
      }
    );
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new ApiError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        errorBody
      );
    }
    const data = await response.json();
    return {
      data,
      status: response.status,
      headers: responseHeaders
    };
  }
  /**
   * GET request
   */
  async get(endpoint, options) {
    const response = await this.request(endpoint, { ...options, method: "GET" });
    return response.data;
  }
  /**
   * POST request
   */
  async post(endpoint, body, options) {
    const response = await this.request(endpoint, { ...options, method: "POST", body });
    return response.data;
  }
  /**
   * PUT request
   */
  async put(endpoint, body, options) {
    const response = await this.request(endpoint, { ...options, method: "PUT", body });
    return response.data;
  }
  /**
   * DELETE request
   */
  async delete(endpoint, options) {
    const response = await this.request(endpoint, { ...options, method: "DELETE" });
    return response.data;
  }
};
var ApiError = class extends Error {
  status;
  body;
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
};
function createClient(config) {
  return new CogClient(config);
}

// src/models/index.ts
var import_core2 = require("@o9nn/core");
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
    backend: options.backend || import_core2.Backend.PYTORCH,
    device: options.device || import_core2.Device.CPU,
    dtype: options.dtype || import_core2.DataType.FLOAT32,
    ...options
  };
}

// src/agents/index.ts
var AgentManager = class {
  client;
  constructor(client) {
    this.client = client;
  }
  /**
   * List available agents
   */
  async list() {
    return this.client.get("/api/v1/agents");
  }
  /**
   * Get agent information
   */
  async get(agentId) {
    return this.client.get(`/api/v1/agents/${agentId}`);
  }
  /**
   * Create a new agent
   */
  async create(config) {
    return this.client.post("/api/v1/agents", config);
  }
  /**
   * Delete an agent
   */
  async delete(agentId) {
    await this.client.delete(`/api/v1/agents/${agentId}`);
  }
  /**
   * Chat with an agent
   */
  async chat(agentId, message, history) {
    return this.client.post(`/api/v1/agents/${agentId}/chat`, {
      message,
      history
    });
  }
  /**
   * Execute a tool call result
   */
  async executeToolResult(agentId, toolCallId, result) {
    return this.client.post(`/api/v1/agents/${agentId}/tool-result`, {
      toolCallId,
      result
    });
  }
  /**
   * Get conversation history
   */
  async getHistory(agentId, sessionId) {
    const params = sessionId ? `?sessionId=${sessionId}` : "";
    return this.client.get(`/api/v1/agents/${agentId}/history${params}`);
  }
  /**
   * Clear conversation history
   */
  async clearHistory(agentId, sessionId) {
    const params = sessionId ? `?sessionId=${sessionId}` : "";
    await this.client.delete(`/api/v1/agents/${agentId}/history${params}`);
  }
};
var AgentBuilder = class {
  config = {};
  tools = [];
  constructor(name) {
    this.config.name = name;
  }
  /**
   * Set the model configuration
   */
  withModel(model) {
    this.config.model = model;
    return this;
  }
  /**
   * Add a tool to the agent
   */
  addTool(tool) {
    this.tools.push(tool);
    return this;
  }
  /**
   * Set memory configuration
   */
  withMemory(memory) {
    this.config.memory = memory;
    return this;
  }
  /**
   * Set maximum iterations
   */
  withMaxIterations(max) {
    this.config.maxIterations = max;
    return this;
  }
  /**
   * Build the agent configuration
   */
  build() {
    if (!this.config.name) {
      throw new Error("Agent name is required");
    }
    if (!this.config.model) {
      throw new Error("Agent model is required");
    }
    return {
      name: this.config.name,
      model: this.config.model,
      tools: this.tools.length > 0 ? this.tools : void 0,
      memory: this.config.memory,
      maxIterations: this.config.maxIterations
    };
  }
};
function createTool(name, description, execute, parameters) {
  return {
    name,
    description,
    execute,
    parameters
  };
}

// src/index.ts
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AgentBuilder,
  AgentManager,
  ApiError,
  CogClient,
  ModelManager,
  SDK_VERSION,
  createClient,
  createCogSDK,
  createModelConfig,
  createTool,
  ...require("@o9nn/core")
});
