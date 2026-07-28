# o9nn Quickstart Example

This example demonstrates basic usage of the o9nn platform.

## Prerequisites

- Node.js >= 20 or Python >= 3.10
- Running o9nn API server

## TypeScript/Node.js

```typescript
import { createCogSDK, CogClient, ModelManager, AgentManager } from '@o9nn/cog-sdk';

async function main() {
  // Initialize SDK
  const sdk = createCogSDK({
    baseUrl: 'http://localhost:8080',
    apiKey: process.env.O9NN_API_KEY,
  });

  const client = new CogClient({
    baseUrl: sdk.config.baseUrl,
    apiKey: sdk.config.apiKey,
  });

  // List available models
  const models = new ModelManager(client);
  const modelList = await models.list();
  console.log('Available models:', modelList.length);

  // Create an agent and chat
  const agents = new AgentManager(client);
  const response = await agents.chat('assistant', 'Hello! What can you help me with?');
  console.log('Agent:', response.message.content);
}

main().catch(console.error);
```

## Python

```python
import asyncio
from o9nn_sdk import create_sdk, ModelManager, AgentManager

async def main():
    # Initialize SDK
    client = create_sdk(
        base_url="http://localhost:8080",
        api_key="your-api-key",
    )
    
    async with client:
        # List available models
        models = ModelManager(client)
        model_list = await models.list()
        print(f"Available models: {len(model_list)}")
        
        # Create an agent and chat
        agents = AgentManager(client)
        response = await agents.chat("assistant", "Hello! What can you help me with?")
        print(f"Agent: {response.message.content}")

asyncio.run(main())
```

## Go

```go
package main

import (
    "context"
    "fmt"
    "log"

    cogsdk "github.com/o9nn/dro9nn/packages/sdk/go"
)

func main() {
    // Initialize client
    client := cogsdk.NewClient(&cogsdk.Config{
        BaseURL: "http://localhost:8080",
        APIKey:  "your-api-key",
    })

    ctx := context.Background()

    // List available models
    models, err := client.Models().List(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Available models: %d\n", len(models))

    // Chat with an agent
    response, err := client.Agents().Chat(ctx, "assistant", "Hello! What can you help me with?", nil)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Agent: %s\n", response.Message.Content)
}
```

## Running the Example

1. Start the API server:
   ```bash
   cd apps/api-server
   go run ./cmd -port 8080
   ```

2. Run the example:
   ```bash
   # TypeScript
   npx ts-node quickstart.ts
   
   # Python
   python quickstart.py
   
   # Go
   go run main.go
   ```

## Next Steps

- [ML Demo](../ml-demo/README.md) - Machine learning examples
- [Agent Demo](../agent-demo/README.md) - Advanced agent examples
- [GNN Demo](../gnn-demo/README.md) - Graph neural network examples
- [ESN Demo](../esn-demo/README.md) - Echo state network examples
