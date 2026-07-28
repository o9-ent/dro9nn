# o9nn Python SDK

Python client library for the o9nn cognitive computing platform.

## Installation

```bash
pip install o9nn-sdk
```

## Quick Start

```python
import asyncio
from o9nn_sdk import create_sdk, ModelManager, AgentManager, Backend, Device

async def main():
    # Create SDK client
    client = create_sdk(
        base_url="http://localhost:8080",
        api_key="your-api-key",
    )
    
    async with client:
        # Use models
        models = ModelManager(client)
        model_list = await models.list()
        print(f"Available models: {len(model_list)}")
        
        # Use agents
        agents = AgentManager(client)
        response = await agents.chat("my-agent", "Hello!")
        print(f"Agent says: {response.message.content}")

asyncio.run(main())
```

## Features

- **Async-first**: Built with `httpx` for efficient async HTTP requests
- **Type-safe**: Full type hints with Pydantic models
- **Model Management**: Load, list, and run inference on ML models
- **Agent Framework**: Create and interact with AI agents
- **Streaming Support**: Stream generation results in real-time

## API Reference

### CogClient

HTTP client for API communication.

```python
from o9nn_sdk import CogClient, ClientConfig

config = ClientConfig(
    base_url="http://localhost:8080",
    api_key="your-api-key",
    timeout=30.0,
)

async with CogClient(config) as client:
    data = await client.get("/api/v1/models")
```

### ModelManager

Manage ML models.

```python
from o9nn_sdk import ModelManager, ModelConfig, Backend, Device

models = ModelManager(client)

# List models
model_list = await models.list()

# Load a model
from o9nn_sdk import ModelConfig, Backend, Device
config = ModelConfig(
    name="llama-3",
    backend=Backend.PYTORCH,
    device=Device.CUDA,
)
model = await models.load(config)

# Run inference
result = await models.infer("model-id", {"text": "Hello"})

# Generate text
from o9nn_sdk import GenerationOptions
result = await models.generate("model-id", GenerationOptions(
    prompt="Once upon a time",
    max_length=100,
    temperature=0.7,
))
```

### AgentManager

Create and interact with AI agents.

```python
from o9nn_sdk import AgentManager, AgentBuilder, create_tool

agents = AgentManager(client)

# Create an agent
config = (
    AgentBuilder("assistant")
    .with_model(model_config)
    .add_tool(create_tool("search", "Search the web"))
    .build()
)
agent = await agents.create(config)

# Chat with the agent
response = await agents.chat("agent-id", "What is 2 + 2?")
print(response.message.content)
```

## License

MIT
