# @o9nn/agents-orchestration

Agent orchestration framework for the o9nn ecosystem.

## Features

- Multi-agent coordination
- Tool and action registry
- Memory management
- Workflow definitions
- Event-driven architecture

## Installation

```bash
pip install o9nn-agents-orchestration
```

## Usage

```python
from o9nn.agents import Agent, Orchestrator

# Define agents
researcher = Agent("researcher", model="gpt-4")
writer = Agent("writer", model="gpt-4")

# Create orchestrator
orchestrator = Orchestrator([researcher, writer])

# Execute workflow
result = await orchestrator.execute("Write an article about AI")
```

## Architecture

```
Orchestrator
    ├── Agent Pool
    │   ├── Agent 1
    │   ├── Agent 2
    │   └── Agent N
    ├── Tool Registry
    ├── Memory Store
    └── Event Bus
```

## License

MIT © o9nn Organization
