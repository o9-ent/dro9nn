# @o9nn/agents-orchestration

Agent orchestration framework for the o9nn ecosystem.

Part of Phase 2: AI/ML Platform Integration.

## Features

- **Multi-agent Coordination**: Register and manage multiple AI agents
- **Tool Registry**: Register and execute tools that agents can use
- **Memory Management**: Short-term, long-term, working, and episodic memory
- **Event-driven Architecture**: Publish-subscribe event bus for coordination
- **Workflow Definitions**: Define and execute multi-step workflows
- **Execution Strategies**: Sequential, parallel, and hierarchical execution

## Installation

```bash
go get github.com/o9nn/dro9nn/packages/agents/orchestration
```

## Usage

### Creating Agents

```go
package main

import (
    "github.com/o9nn/dro9nn/packages/agents/orchestration"
)

func main() {
    // Create agents
    researcher := orchestration.NewAgent("researcher", "Research Agent", orchestration.RoleWorker, "gpt-4")
    researcher.SystemPrompt = "You are a research specialist."
    researcher.Tools = []string{"search", "read_url"}

    writer := orchestration.NewAgent("writer", "Writing Agent", orchestration.RoleWorker, "gpt-4")
    writer.SystemPrompt = "You are a professional writer."
}
```

### Setting Up Orchestrator

```go
// Create orchestrator with parallel execution strategy
orch := orchestration.NewOrchestrator(orchestration.StrategyParallel)

// Register agents
orch.RegisterAgent(researcher)
orch.RegisterAgent(writer)
```

### Registering Tools

```go
searchTool := &orchestration.Tool{
    Name:        "search",
    Description: "Search the web for information",
    Execute: func(ctx context.Context, params map[string]interface{}) (interface{}, error) {
        query := params["query"].(string)
        // Perform search...
        return results, nil
    },
}

orch.Tools().Register(searchTool)
```

### Creating and Executing Workflows

```go
// Create workflow
workflow := orchestration.NewWorkflow("research-write", "Research and Write Article")

// Add tasks with dependencies
task1 := &orchestration.Task{
    ID:      "research",
    Name:    "Research Topic",
    AgentID: "researcher",
    Input:   map[string]interface{}{"topic": "AI trends 2024"},
}
workflow.AddTask(task1)

task2 := &orchestration.Task{
    ID:        "write",
    Name:      "Write Article",
    AgentID:   "writer",
    DependsOn: []string{"research"},
}
workflow.AddTask(task2)

// Execute workflow
ctx := context.Background()
err := orch.ExecuteWorkflow(ctx, workflow)
if err != nil {
    log.Fatal(err)
}
```

### Memory Management

```go
// Store a memory
entry := &orchestration.MemoryEntry{
    ID:        "mem-1",
    Type:      orchestration.MemoryShortTerm,
    Content:   "Important finding from research",
    CreatedAt: time.Now(),
}
orch.Memory().Store(entry)

// Retrieve memory
retrieved, _ := orch.Memory().Retrieve("mem-1")
fmt.Println(retrieved.Content)

// Search memories
results := orch.Memory().Search(orchestration.MemoryShortTerm, "research", 10)
```

### Event Handling

```go
// Subscribe to events
orch.Events().Subscribe(orchestration.EventTaskCompleted, func(e orchestration.Event) {
    fmt.Printf("Task %s completed\n", e.Data["task_id"])
})

orch.Events().Subscribe(orchestration.EventAgentStarted, func(e orchestration.Event) {
    fmt.Printf("Agent %s started\n", e.Source)
})

// Subscribe to all events
orch.Events().SubscribeAll(func(e orchestration.Event) {
    log.Printf("[%s] %s: %v", e.Timestamp, e.Type, e.Data)
})
```

## API Reference

### Agent Roles

- `RoleCoordinator` - Coordinates other agents
- `RoleWorker` - Performs specific tasks
- `RoleReviewer` - Reviews work of other agents
- `RoleSpecialist` - Domain-specific expertise

### Execution Strategies

- `StrategySequential` - Execute tasks one at a time
- `StrategyParallel` - Execute independent tasks in parallel
- `StrategyHierarchical` - Coordinator delegates to workers
- `StrategyReactive` - Event-driven execution

### Memory Types

- `MemoryShortTerm` - Temporary working memory
- `MemoryLongTerm` - Persistent memory
- `MemoryWorking` - Active task context
- `MemoryEpisodic` - Event-based memories

### Event Types

- `EventAgentStarted` - Agent began execution
- `EventAgentCompleted` - Agent finished successfully
- `EventAgentFailed` - Agent encountered error
- `EventTaskStarted` - Task began execution
- `EventTaskCompleted` - Task finished successfully
- `EventTaskFailed` - Task encountered error
- `EventToolCalled` - Tool was invoked
- `EventToolCompleted` - Tool execution finished
- `EventMessage` - Inter-agent message

## Architecture

```
Orchestrator
    ├── Agent Pool
    │   ├── Agent 1 (Coordinator)
    │   ├── Agent 2 (Worker)
    │   └── Agent N (Specialist)
    ├── Tool Registry
    │   ├── search
    │   ├── read_url
    │   └── calculate
    ├── Memory Store
    │   ├── Short-term
    │   ├── Long-term
    │   └── Working
    └── Event Bus
        ├── Subscribers
        └── Event Queue
```

## License

MIT © o9nn Organization
