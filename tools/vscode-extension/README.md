# o9nn Cognitive VSCode Extension

VSCode extension for the o9nn Cognitive Computing Platform.

## Features

- **Model Management**: List, download, and manage AI models
- **Agent Development**: Create and test AI agents
- **REPL Integration**: Interactive model interaction
- **Code Generation**: Generate agents, tools, and plugins
- **Syntax Highlighting**: Support for o9nn configuration files
- **IntelliSense**: Code completion for o9nn SDK

## Installation

### From VSIX

1. Download the latest `.vsix` file from releases
2. In VSCode, press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Install from VSIX" and select the downloaded file

### From Source

```bash
cd tools/vscode-extension
npm install
npm run compile
npm run package
```

## Usage

### Commands

- **o9nn: Start Development Server** - Start the local development server
- **o9nn: Stop Development Server** - Stop the running server
- **o9nn: Open REPL** - Open an interactive model REPL
- **o9nn: Generate Agent** - Create a new agent scaffold
- **o9nn: Generate Tool** - Create a new tool scaffold
- **o9nn: List Models** - View available models
- **o9nn: Download Model** - Download a model from the registry
- **o9nn: Run Inference** - Run inference on selected text
- **o9nn: Initialize New Project** - Create a new o9nn project

### Keyboard Shortcuts

| Command | Windows/Linux | Mac |
|---------|---------------|-----|
| Open REPL | `Ctrl+Shift+R` | `Cmd+Shift+R` |
| Run Inference | `Ctrl+Shift+I` | `Cmd+Shift+I` |

### Configuration

Open Settings (`Ctrl+,`) and search for "o9nn":

- **o9nn.apiUrl**: API server URL (default: `http://localhost:8080`)
- **o9nn.apiKey**: API key for authentication
- **o9nn.defaultModel**: Default model for inference
- **o9nn.cogctlPath**: Path to cogctl executable
- **o9nn.autoStartServer**: Auto-start server on workspace open
- **o9nn.showStatusBar**: Show status in status bar

## Development

```bash
# Install dependencies
npm install

# Watch for changes
npm run watch

# Run tests
npm run test

# Package extension
npm run package
```

## Requirements

- VSCode 1.85.0 or later
- cogctl CLI (for full functionality)
- Node.js 20.0.0 or later (for development)

## License

MIT
