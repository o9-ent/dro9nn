# @o9nn/cog-sdk

TypeScript/JavaScript SDK for the o9nn cognitive computing platform.

## Installation

```bash
npm install @o9nn/cog-sdk
# or
pnpm add @o9nn/cog-sdk
# or
yarn add @o9nn/cog-sdk
```

## Quick Start

```typescript
import { createCogSDK, CogClient, ModelManager, AgentManager } from '@o9nn/cog-sdk';

// Initialize the SDK
const sdk = createCogSDK({
  baseUrl: 'http://localhost:8080',
  apiKey: process.env.O9NN_API_KEY,
});

// Create a client
const client = new CogClient({
  baseUrl: sdk.config.baseUrl,
  apiKey: sdk.config.apiKey,
});

// Use models
const models = new ModelManager(client);
const modelList = await models.list();

// Use agents
const agents = new AgentManager(client);
const response = await agents.chat('my-agent', 'Hello!');
```

## Features

- **Model Management**: Load, list, and run inference on ML models
- **Agent Framework**: Create and interact with AI agents
- **Streaming Support**: Stream generation results in real-time
- **Type Safety**: Full TypeScript support with comprehensive types
- **Retry Logic**: Built-in retry handling for transient failures

## API Reference

### CogClient

HTTP client for API communication.

```typescript
const client = new CogClient({
  baseUrl: 'http://localhost:8080',
  apiKey: 'your-api-key',
  timeout: 30000,
});

// Make requests
const data = await client.get('/api/v1/models');
const result = await client.post('/api/v1/inference', { input: 'Hello' });
```

### ModelManager

Manage ML models.

```typescript
const models = new ModelManager(client);

// List models
const list = await models.list();

// Load a model
const model = await models.load({
  name: 'my-model',
  backend: Backend.PYTORCH,
  device: Device.CUDA,
});

// Run inference
const result = await models.infer('model-id', { text: 'Hello' });

// Generate text
const generated = await models.generate('model-id', {
  prompt: 'Once upon a time',
  maxLength: 100,
  temperature: 0.7,
});
```

### AgentManager

Create and interact with AI agents.

```typescript
const agents = new AgentManager(client);

// Create an agent
const agent = await agents.create({
  name: 'my-agent',
  model: modelConfig,
  tools: [searchTool, calculatorTool],
});

// Chat with the agent
const response = await agents.chat('agent-id', 'What is 2 + 2?');

// Handle tool calls
if (response.toolCalls) {
  for (const call of response.toolCalls) {
    const result = await executeTool(call);
    await agents.executeToolResult('agent-id', call.id, result);
  }
}
```

### AgentBuilder

Fluent API for building agent configurations.

```typescript
const config = new AgentBuilder('assistant')
  .withModel({
    name: 'llama-3',
    backend: Backend.PYTORCH,
    device: Device.CUDA,
  })
  .addTool(searchTool)
  .addTool(calculatorTool)
  .withMemory({ type: 'conversation', maxTokens: 4096 })
  .withMaxIterations(10)
  .build();
```

## License

MIT
