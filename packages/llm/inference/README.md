# @o9nn/llm-inference

Unified LLM inference API for the o9nn ecosystem.

Part of Phase 2: AI/ML Platform Integration.

## Features

- **Unified API**: Single interface for multiple LLM backends
- **Multiple Backends**: Local (llama.cpp), OpenAI, Anthropic, Ollama
- **Streaming**: Real-time token streaming
- **Chat & Completion**: Both chat and text completion modes
- **Tool Calling**: Function/tool call support
- **Caching**: Response caching for efficiency
- **Client Pool**: Manage multiple backend clients

## Installation

```bash
go get github.com/o9nn/dro9nn/packages/llm/inference
```

## Usage

### Basic Generation

```go
package main

import (
    "context"
    "fmt"
    "github.com/o9nn/dro9nn/packages/llm/inference"
)

func main() {
    // Create client (using mock for example)
    client := inference.NewMockClient()
    defer client.Close()

    // Configure generation
    config := inference.DefaultConfig("llama-7b")
    config.MaxTokens = 256
    config.Temperature = 0.7

    // Generate
    ctx := context.Background()
    resp, err := client.Generate(ctx, "Explain quantum computing", config)
    if err != nil {
        panic(err)
    }

    fmt.Println(resp.Content)
    fmt.Printf("Tokens: %d\n", resp.Usage.TotalTokens)
}
```

### Chat Completion

```go
messages := []inference.Message{
    {Role: inference.RoleSystem, Content: "You are a helpful assistant."},
    {Role: inference.RoleUser, Content: "Hello! How are you?"},
}

config := inference.DefaultConfig("llama-7b-chat")
resp, err := client.Chat(ctx, messages, config)
if err != nil {
    panic(err)
}

fmt.Println(resp.Content)
```

### Streaming Generation

```go
config := inference.DefaultConfig("llama-7b")
config.Stream = true

ch, err := client.GenerateStream(ctx, "Once upon a time", config)
if err != nil {
    panic(err)
}

for chunk := range ch {
    if chunk.Error != nil {
        panic(chunk.Error)
    }
    fmt.Print(chunk.Content)
}
```

### Using Client Pool

```go
pool := inference.NewClientPool()

// Register backends
pool.Register(inference.BackendLocal, localClient)
pool.Register(inference.BackendOpenAI, openaiClient)

// Set default
pool.SetDefault(inference.BackendLocal)

// Get client
client, err := pool.Get(inference.BackendOpenAI)
if err != nil {
    panic(err)
}

// Use client...
resp, _ := client.Generate(ctx, "Hello", config)
```

### Response Caching

```go
import "time"

// Wrap client with caching (1 hour TTL)
cached := inference.NewCachedClient(client, time.Hour)

// First call hits the model
resp1, _ := cached.Generate(ctx, "What is AI?", config)

// Second call returns cached response
resp2, _ := cached.Generate(ctx, "What is AI?", config)
```

### Tool Calling

```go
config := inference.DefaultConfig("gpt-4")
config.Tools = []inference.Tool{
    {
        Type: "function",
        Function: struct {
            Name        string
            Description string
            Parameters  interface{}
        }{
            Name:        "get_weather",
            Description: "Get weather for a location",
            Parameters: map[string]interface{}{
                "type": "object",
                "properties": map[string]interface{}{
                    "location": map[string]interface{}{
                        "type":        "string",
                        "description": "City name",
                    },
                },
                "required": []string{"location"},
            },
        },
    },
}
config.ToolChoice = "auto"

resp, err := client.Chat(ctx, messages, config)
if err != nil {
    panic(err)
}

// Check for tool calls
for _, tc := range resp.ToolCalls {
    fmt.Printf("Tool: %s, Args: %s\n", tc.Function.Name, tc.Function.Arguments)
}
```

## API Reference

### Types

- `Client` - Interface for LLM inference
- `Message` - Chat message with role and content
- `GenerationConfig` - Generation parameters
- `Response` - Generation response
- `StreamChunk` - Streaming response chunk
- `ModelInfo` - Model information
- `Backend` - Backend type enum

### Backends

- `BackendLocal` - Local inference (llama.cpp)
- `BackendOpenAI` - OpenAI API
- `BackendAnthropic` - Anthropic API
- `BackendOllama` - Ollama server
- `BackendCustom` - Custom backend

### Roles

- `RoleSystem` - System message
- `RoleUser` - User message
- `RoleAssistant` - Assistant message
- `RoleFunction` - Function result
- `RoleTool` - Tool result

### Client Methods

- `Generate(ctx, prompt, config)` - Text generation
- `Chat(ctx, messages, config)` - Chat completion
- `GenerateStream(ctx, prompt, config)` - Streaming text generation
- `ChatStream(ctx, messages, config)` - Streaming chat
- `ListModels(ctx)` - List available models
- `GetModel(ctx, model)` - Get model info
- `Close()` - Close client

## Supported Models

- LLaMA family (LLaMA 2, LLaMA 3)
- Mistral
- Phi
- Gemma
- GPT-3.5, GPT-4 (via OpenAI)
- Claude (via Anthropic)
- And more...

## License

MIT © o9nn Organization
