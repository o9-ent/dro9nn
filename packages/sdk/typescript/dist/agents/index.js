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

// src/agents/index.ts
var agents_exports = {};
__export(agents_exports, {
  AgentBuilder: () => AgentBuilder,
  AgentManager: () => AgentManager,
  createTool: () => createTool
});
module.exports = __toCommonJS(agents_exports);
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
    return this.client.get(`/api/v1/agents/${encodeURIComponent(agentId)}`);
  }
  /**
   * Create a new agent
   * NOTE: Tools with execute functions are stripped before sending to the API
   * as functions cannot be serialized. Use local tool registration for client-side execution.
   */
  async create(config) {
    const apiConfig = {
      ...config,
      tools: config.tools?.map(({ execute: _, ...tool }) => tool)
    };
    return this.client.post("/api/v1/agents", apiConfig);
  }
  /**
   * Delete an agent
   */
  async delete(agentId) {
    await this.client.delete(`/api/v1/agents/${encodeURIComponent(agentId)}`);
  }
  /**
   * Chat with an agent
   */
  async chat(agentId, message, history) {
    return this.client.post(`/api/v1/agents/${encodeURIComponent(agentId)}/chat`, {
      message,
      history
    });
  }
  /**
   * Execute a tool call result
   */
  async executeToolResult(agentId, toolCallId, result) {
    return this.client.post(`/api/v1/agents/${encodeURIComponent(agentId)}/tool-result`, {
      toolCallId,
      result
    });
  }
  /**
   * Get conversation history
   */
  async getHistory(agentId, sessionId) {
    const params = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
    return this.client.get(`/api/v1/agents/${encodeURIComponent(agentId)}/history${params}`);
  }
  /**
   * Clear conversation history
   */
  async clearHistory(agentId, sessionId) {
    const params = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
    await this.client.delete(`/api/v1/agents/${encodeURIComponent(agentId)}/history${params}`);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AgentBuilder,
  AgentManager,
  createTool
});
