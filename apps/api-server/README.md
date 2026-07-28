# o9nn API Server

RESTful API server for the o9nn cognitive computing platform.

## Features

- Model management (load, unload, list)
- Inference execution
- Text generation with streaming
- Agent management
- Chat interface
- Tool execution

## Quick Start

```bash
# Build
go build -o api-server ./cmd

# Run
./api-server -port 8080
```

## API Endpoints

### Health & Info

- `GET /health` - Health check
- `GET /version` - Server version

### Models

- `GET /api/v1/models` - List models
- `POST /api/v1/models/load` - Load a model
- `GET /api/v1/models/{id}` - Get model info
- `DELETE /api/v1/models/{id}` - Unload a model
- `POST /api/v1/models/{id}/infer` - Run inference
- `POST /api/v1/models/{id}/generate` - Generate text
- `POST /api/v1/models/{id}/generate/stream` - Stream generation

### Agents

- `GET /api/v1/agents` - List agents
- `POST /api/v1/agents` - Create agent
- `GET /api/v1/agents/{id}` - Get agent info
- `DELETE /api/v1/agents/{id}` - Delete agent
- `POST /api/v1/agents/{id}/chat` - Chat with agent
- `POST /api/v1/agents/{id}/tool-result` - Send tool result
- `GET /api/v1/agents/{id}/history` - Get history
- `DELETE /api/v1/agents/{id}/history` - Clear history

## Configuration

Environment variables:

- `PORT` - Server port (default: 8080)
- `O9NN_API_KEY` - API key for authentication

## Docker

```bash
docker build -t o9nn/api-server .
docker run -p 8080:8080 o9nn/api-server
```

## License

MIT
