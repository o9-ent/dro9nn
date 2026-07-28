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

export {
  AgentManager,
  AgentBuilder,
  createTool
};
