# @o9nn/cli

Command-line interface for the o9nn ecosystem.

## Features

- Model management (download, convert, serve)
- Development environment setup
- Project scaffolding
- Deployment orchestration
- Interactive REPL

## Installation

```bash
# npm
npm install -g @o9nn/cli

# pip
pip install o9nn-cli

# go
go install github.com/o9nn/dro9nn/packages/cli@latest

# Homebrew
brew install o9nn/tap/o9nn
```

## Usage

```bash
# Download a model
o9nn model download llama-2-7b-chat

# Convert model format
o9nn model convert model.safetensors --to gguf

# Start inference server
o9nn serve --model llama-2-7b-chat --port 8080

# Create new project
o9nn init my-project --template agent

# Run development server
o9nn dev
```

## Commands

| Command | Description |
|---------|-------------|
| `o9nn model` | Model management |
| `o9nn serve` | Start inference server |
| `o9nn train` | Training utilities |
| `o9nn init` | Project scaffolding |
| `o9nn dev` | Development server |
| `o9nn deploy` | Deployment commands |
| `o9nn config` | Configuration management |

## Configuration

```yaml
# o9nn.config.yaml
model:
  path: ./models
  default: llama-2-7b-chat

server:
  port: 8080
  host: localhost

logging:
  level: info
```

## License

MIT © o9nn Organization
