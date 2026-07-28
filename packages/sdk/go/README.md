# o9nn Go SDK

Go client library for the o9nn cognitive computing platform.

## Installation

```bash
go get github.com/o9nn/dro9nn/packages/sdk/go
```

## Quick Start

```go
package main

import (
    "context"
    "fmt"
    "log"

    cogsdk "github.com/o9nn/dro9nn/packages/sdk/go"
)

func main() {
    // Create client
    client := cogsdk.NewClient(&cogsdk.Config{
        BaseURL: "http://localhost:8080",
        APIKey:  "your-api-key",
    })

    ctx := context.Background()

    // List models
    models, err := client.Models().List(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Available models: %d\n", len(models))

    // Chat with an agent
    response, err := client.Agents().Chat(ctx, "my-agent", "Hello!", nil)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Agent says: %s\n", response.Message.Content)
}
```

## Features

- **Context Support**: All operations support context for cancellation and timeouts
- **Type Safety**: Strongly typed API with Go structs
- **Model Management**: Load, list, and run inference on ML models
- **Agent Framework**: Create and interact with AI agents
- **Builder Pattern**: Fluent API for building configurations

## API Reference

### Client

HTTP client for API communication.

```go
client := cogsdk.NewClient(&cogsdk.Config{
    BaseURL: "http://localhost:8080",
    APIKey:  "your-api-key",
    Timeout: 30 * time.Second,
})
```

### ModelManager

Manage ML models.

```go
models := client.Models()

// List models
list, _ := models.List(ctx, nil)

// Load a model
model, _ := models.Load(ctx, &cogsdk.ModelConfig{
    Name:    "llama-3",
    Backend: cogsdk.BackendPyTorch,
    Device:  cogsdk.DeviceCUDA,
})

// Run inference
result, _ := models.Infer(ctx, "model-id", map[string]string{"text": "Hello"}, nil)

// Generate text
result, _ := models.Generate(ctx, "model-id", &cogsdk.GenerationOptions{
    Prompt:      "Once upon a time",
    MaxLength:   100,
    Temperature: 0.7,
})
```

### AgentManager

Create and interact with AI agents.

```go
agents := client.Agents()

// Create an agent
config, _ := cogsdk.NewAgentBuilder("assistant").
    WithModel(modelConfig).
    AddTool(searchTool).
    Build()

agent, _ := agents.Create(ctx, config)

// Chat with the agent
response, _ := agents.Chat(ctx, "agent-id", "What is 2 + 2?", nil)
fmt.Println(response.Message.Content)
```

## License

MIT
