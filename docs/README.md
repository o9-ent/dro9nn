# o9nn Documentation

Welcome to the o9nn documentation. This directory contains comprehensive documentation for the o9nn monorepo ecosystem.

## Documentation Structure

```
docs/
├── api/                    # API reference documentation
├── guides/                 # How-to guides
├── tutorials/              # Step-by-step tutorials
├── architecture/           # Architecture documentation
└── README.md               # This file
```

## Quick Links

### Getting Started
- [Installation Guide](./guides/installation.md)
- [Quick Start Tutorial](./tutorials/quickstart.md)
- [Configuration](./guides/configuration.md)

### API Reference
- [Core Package](./api/core.md)
- [ML Packages](./api/ml.md)
- [LLM Packages](./api/llm.md)
- [Agent Packages](./api/agents.md)
- [GNN Package](./api/gnn.md)
- [ESN Package](./api/esn.md)
- [SDK Reference](./api/sdk.md)
- [CLI Reference](./api/cli.md)

### Architecture
- [System Overview](./architecture/overview.md)
- [Package Structure](./architecture/packages.md)
- [ML Framework Integration](./architecture/ml-integration.md)
- [Agent Architecture](./architecture/agents.md)

### Contributing
- [Contributing Guide](../CONTRIBUTING.md)
- [Code of Conduct](../CODE_OF_CONDUCT.md)
- [Development Setup](./guides/development.md)

## Building Documentation

To build the documentation locally:

```bash
# Install dependencies
pip install mkdocs mkdocs-material

# Serve locally
mkdocs serve

# Build static site
mkdocs build
```

## Documentation Versions

- **Latest**: Documentation for the main branch
- **Stable**: Documentation for the latest release
- **v0.x**: Documentation for specific versions

## Contributing to Documentation

We welcome contributions to improve our documentation! Please see the [Contributing Guide](../CONTRIBUTING.md) for details.

### Documentation Style Guide

- Use clear, concise language
- Include code examples where applicable
- Keep examples up-to-date with the latest API
- Use proper Markdown formatting
- Add cross-references to related documentation
