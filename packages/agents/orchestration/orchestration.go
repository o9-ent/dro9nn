// Package orchestration provides agent orchestration patterns for the o9nn ecosystem.
//
// Features:
//   - Multi-agent coordination and workflows
//   - Tool and action registry
//   - Memory management (short-term, long-term)
//   - Event-driven architecture
//   - Various orchestration patterns (sequential, parallel, hierarchical)
//
// Part of Phase 2: AI/ML Platform Integration
package orchestration

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"
)

// Version of the orchestration package
const Version = "0.1.0"

// Role represents an agent's role
type Role string

const (
	RoleCoordinator Role = "coordinator"
	RoleWorker      Role = "worker"
	RoleReviewer    Role = "reviewer"
	RoleSpecialist  Role = "specialist"
)

// Status represents execution status
type Status string

const (
	StatusPending   Status = "pending"
	StatusRunning   Status = "running"
	StatusCompleted Status = "completed"
	StatusFailed    Status = "failed"
	StatusCanceled  Status = "canceled"
)

// Agent represents an AI agent
type Agent struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Description string            `json:"description,omitempty"`
	Role        Role              `json:"role"`
	Model       string            `json:"model"`
	SystemPrompt string           `json:"system_prompt,omitempty"`
	Tools       []string          `json:"tools,omitempty"`
	Config      map[string]string `json:"config,omitempty"`

	// Runtime state
	status Status
	mu     sync.Mutex
}

// NewAgent creates a new agent
func NewAgent(id, name string, role Role, model string) *Agent {
	return &Agent{
		ID:     id,
		Name:   name,
		Role:   role,
		Model:  model,
		status: StatusPending,
		Config: make(map[string]string),
	}
}

// Status returns the agent's status
func (a *Agent) Status() Status {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.status
}

// SetStatus sets the agent's status
func (a *Agent) SetStatus(s Status) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.status = s
}

// Tool represents a tool that agents can use
type Tool struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Parameters  json.RawMessage `json:"parameters"`
	Execute     ToolFunc        `json:"-"`
}

// ToolFunc is the function signature for tool execution
type ToolFunc func(ctx context.Context, params map[string]interface{}) (interface{}, error)

// ToolRegistry manages available tools
type ToolRegistry struct {
	mu    sync.RWMutex
	tools map[string]*Tool
}

// NewToolRegistry creates a new tool registry
func NewToolRegistry() *ToolRegistry {
	return &ToolRegistry{
		tools: make(map[string]*Tool),
	}
}

// Register adds a tool to the registry
func (r *ToolRegistry) Register(tool *Tool) error {
	if tool.Name == "" {
		return errors.New("tool name is required")
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.tools[tool.Name]; exists {
		return fmt.Errorf("tool %s already registered", tool.Name)
	}

	r.tools[tool.Name] = tool
	return nil
}

// Get retrieves a tool by name
func (r *ToolRegistry) Get(name string) (*Tool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	tool, exists := r.tools[name]
	if !exists {
		return nil, fmt.Errorf("tool %s not found", name)
	}
	return tool, nil
}

// List returns all registered tools
func (r *ToolRegistry) List() []*Tool {
	r.mu.RLock()
	defer r.mu.RUnlock()

	tools := make([]*Tool, 0, len(r.tools))
	for _, t := range r.tools {
		tools = append(tools, t)
	}
	return tools
}

// Execute runs a tool by name
func (r *ToolRegistry) Execute(ctx context.Context, name string, params map[string]interface{}) (interface{}, error) {
	tool, err := r.Get(name)
	if err != nil {
		return nil, err
	}

	if tool.Execute == nil {
		return nil, fmt.Errorf("tool %s has no execute function", name)
	}

	return tool.Execute(ctx, params)
}

// Memory types
type MemoryType string

const (
	MemoryShortTerm MemoryType = "short_term"
	MemoryLongTerm  MemoryType = "long_term"
	MemoryWorking   MemoryType = "working"
	MemoryEpisodic  MemoryType = "episodic"
)

// MemoryEntry represents a memory item
type MemoryEntry struct {
	ID        string            `json:"id"`
	Type      MemoryType        `json:"type"`
	Content   string            `json:"content"`
	Embedding []float32         `json:"embedding,omitempty"`
	Metadata  map[string]string `json:"metadata,omitempty"`
	CreatedAt time.Time         `json:"created_at"`
	ExpiresAt *time.Time        `json:"expires_at,omitempty"`
}

// MemoryStore manages agent memories
type MemoryStore struct {
	mu       sync.RWMutex
	entries  map[string]*MemoryEntry
	byType   map[MemoryType][]*MemoryEntry
	maxSize  int
}

// NewMemoryStore creates a new memory store
func NewMemoryStore(maxSize int) *MemoryStore {
	return &MemoryStore{
		entries: make(map[string]*MemoryEntry),
		byType:  make(map[MemoryType][]*MemoryEntry),
		maxSize: maxSize,
	}
}

// Store saves a memory entry
func (m *MemoryStore) Store(entry *MemoryEntry) error {
	if entry.ID == "" {
		return errors.New("entry ID is required")
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	// Check capacity
	if len(m.entries) >= m.maxSize {
		// Remove oldest short-term memory
		m.evictOldest()
	}

	m.entries[entry.ID] = entry
	m.byType[entry.Type] = append(m.byType[entry.Type], entry)
	return nil
}

// evictOldest removes the oldest short-term memory
func (m *MemoryStore) evictOldest() {
	var oldest *MemoryEntry
	var oldestKey string

	for k, e := range m.entries {
		if e.Type == MemoryShortTerm || e.Type == MemoryWorking {
			if oldest == nil || e.CreatedAt.Before(oldest.CreatedAt) {
				oldest = e
				oldestKey = k
			}
		}
	}

	if oldestKey != "" {
		delete(m.entries, oldestKey)
	}
}

// Retrieve gets a memory by ID
func (m *MemoryStore) Retrieve(id string) (*MemoryEntry, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	entry, exists := m.entries[id]
	if !exists {
		return nil, fmt.Errorf("memory %s not found", id)
	}

	// Check expiration
	if entry.ExpiresAt != nil && time.Now().After(*entry.ExpiresAt) {
		return nil, fmt.Errorf("memory %s has expired", id)
	}

	return entry, nil
}

// Search searches memories by type and content
func (m *MemoryStore) Search(memType MemoryType, query string, limit int) []*MemoryEntry {
	m.mu.RLock()
	defer m.mu.RUnlock()

	entries := m.byType[memType]
	if limit > len(entries) {
		limit = len(entries)
	}

	// Simple search (could be enhanced with embeddings)
	result := make([]*MemoryEntry, 0, limit)
	for _, e := range entries {
		if len(result) >= limit {
			break
		}
		result = append(result, e)
	}

	return result
}

// Clear removes all memories of a type
func (m *MemoryStore) Clear(memType MemoryType) {
	m.mu.Lock()
	defer m.mu.Unlock()

	for _, e := range m.byType[memType] {
		delete(m.entries, e.ID)
	}
	m.byType[memType] = nil
}

// Event types
type EventType string

const (
	EventAgentStarted   EventType = "agent.started"
	EventAgentCompleted EventType = "agent.completed"
	EventAgentFailed    EventType = "agent.failed"
	EventTaskStarted    EventType = "task.started"
	EventTaskCompleted  EventType = "task.completed"
	EventTaskFailed     EventType = "task.failed"
	EventToolCalled     EventType = "tool.called"
	EventToolCompleted  EventType = "tool.completed"
	EventMessage        EventType = "message"
)

// Event represents an orchestration event
type Event struct {
	Type      EventType              `json:"type"`
	Source    string                 `json:"source"`
	Target    string                 `json:"target,omitempty"`
	Data      map[string]interface{} `json:"data,omitempty"`
	Timestamp time.Time              `json:"timestamp"`
}

// EventHandler is a function that handles events
type EventHandler func(event Event)

// EventBus manages event distribution
type EventBus struct {
	mu       sync.RWMutex
	handlers map[EventType][]EventHandler
	all      []EventHandler
}

// NewEventBus creates a new event bus
func NewEventBus() *EventBus {
	return &EventBus{
		handlers: make(map[EventType][]EventHandler),
	}
}

// Subscribe adds a handler for an event type
func (b *EventBus) Subscribe(eventType EventType, handler EventHandler) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.handlers[eventType] = append(b.handlers[eventType], handler)
}

// SubscribeAll adds a handler for all events
func (b *EventBus) SubscribeAll(handler EventHandler) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.all = append(b.all, handler)
}

// Publish sends an event to all subscribers
func (b *EventBus) Publish(event Event) {
	b.mu.RLock()
	defer b.mu.RUnlock()

	event.Timestamp = time.Now()

	// Call type-specific handlers
	for _, h := range b.handlers[event.Type] {
		go h(event)
	}

	// Call all-event handlers
	for _, h := range b.all {
		go h(event)
	}
}

// Task represents a unit of work
type Task struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description,omitempty"`
	Input       map[string]interface{} `json:"input,omitempty"`
	Output      interface{}            `json:"output,omitempty"`
	Status      Status                 `json:"status"`
	AgentID     string                 `json:"agent_id,omitempty"`
	DependsOn   []string               `json:"depends_on,omitempty"`
	StartedAt   *time.Time             `json:"started_at,omitempty"`
	CompletedAt *time.Time             `json:"completed_at,omitempty"`
	Error       string                 `json:"error,omitempty"`
}

// Workflow represents a sequence of tasks
type Workflow struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description,omitempty"`
	Tasks       []*Task `json:"tasks"`
	Status      Status  `json:"status"`
}

// NewWorkflow creates a new workflow
func NewWorkflow(id, name string) *Workflow {
	return &Workflow{
		ID:     id,
		Name:   name,
		Tasks:  make([]*Task, 0),
		Status: StatusPending,
	}
}

// AddTask adds a task to the workflow
func (w *Workflow) AddTask(task *Task) {
	w.Tasks = append(w.Tasks, task)
}

// GetReadyTasks returns tasks that are ready to execute
func (w *Workflow) GetReadyTasks() []*Task {
	ready := make([]*Task, 0)

	completedTasks := make(map[string]bool)
	for _, t := range w.Tasks {
		if t.Status == StatusCompleted {
			completedTasks[t.ID] = true
		}
	}

	for _, t := range w.Tasks {
		if t.Status != StatusPending {
			continue
		}

		// Check dependencies
		allDepsComplete := true
		for _, depID := range t.DependsOn {
			if !completedTasks[depID] {
				allDepsComplete = false
				break
			}
		}

		if allDepsComplete {
			ready = append(ready, t)
		}
	}

	return ready
}

// ExecutionStrategy defines how tasks are executed
type ExecutionStrategy string

const (
	StrategySequential  ExecutionStrategy = "sequential"
	StrategyParallel    ExecutionStrategy = "parallel"
	StrategyHierarchical ExecutionStrategy = "hierarchical"
	StrategyReactive    ExecutionStrategy = "reactive"
)

// Orchestrator manages agent coordination
type Orchestrator struct {
	mu       sync.RWMutex
	agents   map[string]*Agent
	tools    *ToolRegistry
	memory   *MemoryStore
	events   *EventBus
	strategy ExecutionStrategy
}

// NewOrchestrator creates a new orchestrator
func NewOrchestrator(strategy ExecutionStrategy) *Orchestrator {
	return &Orchestrator{
		agents:   make(map[string]*Agent),
		tools:    NewToolRegistry(),
		memory:   NewMemoryStore(1000),
		events:   NewEventBus(),
		strategy: strategy,
	}
}

// RegisterAgent adds an agent to the orchestrator
func (o *Orchestrator) RegisterAgent(agent *Agent) error {
	if agent.ID == "" {
		return errors.New("agent ID is required")
	}

	o.mu.Lock()
	defer o.mu.Unlock()

	if _, exists := o.agents[agent.ID]; exists {
		return fmt.Errorf("agent %s already registered", agent.ID)
	}

	o.agents[agent.ID] = agent
	return nil
}

// GetAgent returns an agent by ID
func (o *Orchestrator) GetAgent(id string) (*Agent, error) {
	o.mu.RLock()
	defer o.mu.RUnlock()

	agent, exists := o.agents[id]
	if !exists {
		return nil, fmt.Errorf("agent %s not found", id)
	}
	return agent, nil
}

// ListAgents returns all registered agents
func (o *Orchestrator) ListAgents() []*Agent {
	o.mu.RLock()
	defer o.mu.RUnlock()

	agents := make([]*Agent, 0, len(o.agents))
	for _, a := range o.agents {
		agents = append(agents, a)
	}
	return agents
}

// Tools returns the tool registry
func (o *Orchestrator) Tools() *ToolRegistry {
	return o.tools
}

// Memory returns the memory store
func (o *Orchestrator) Memory() *MemoryStore {
	return o.memory
}

// Events returns the event bus
func (o *Orchestrator) Events() *EventBus {
	return o.events
}

// ExecuteWorkflow executes a workflow
func (o *Orchestrator) ExecuteWorkflow(ctx context.Context, workflow *Workflow) error {
	workflow.Status = StatusRunning

	o.events.Publish(Event{
		Type:   EventTaskStarted,
		Source: "orchestrator",
		Data:   map[string]interface{}{"workflow_id": workflow.ID},
	})

	switch o.strategy {
	case StrategySequential:
		return o.executeSequential(ctx, workflow)
	case StrategyParallel:
		return o.executeParallel(ctx, workflow)
	default:
		return o.executeSequential(ctx, workflow)
	}
}

// executeSequential executes tasks one at a time
func (o *Orchestrator) executeSequential(ctx context.Context, workflow *Workflow) error {
	for _, task := range workflow.Tasks {
		select {
		case <-ctx.Done():
			workflow.Status = StatusCanceled
			return ctx.Err()
		default:
		}

		if err := o.executeTask(ctx, task); err != nil {
			workflow.Status = StatusFailed
			return err
		}
	}

	workflow.Status = StatusCompleted
	o.events.Publish(Event{
		Type:   EventTaskCompleted,
		Source: "orchestrator",
		Data:   map[string]interface{}{"workflow_id": workflow.ID},
	})

	return nil
}

// executeParallel executes tasks in parallel where possible
func (o *Orchestrator) executeParallel(ctx context.Context, workflow *Workflow) error {
	for {
		readyTasks := workflow.GetReadyTasks()
		if len(readyTasks) == 0 {
			// Check if all tasks are complete
			allComplete := true
			for _, t := range workflow.Tasks {
				if t.Status != StatusCompleted {
					allComplete = false
					break
				}
			}
			if allComplete {
				break
			}
			// Check if there's a failure
			for _, t := range workflow.Tasks {
				if t.Status == StatusFailed {
					workflow.Status = StatusFailed
					return fmt.Errorf("task %s failed: %s", t.ID, t.Error)
				}
			}
			// No ready tasks but not complete - deadlock
			workflow.Status = StatusFailed
			return errors.New("workflow deadlock: no tasks ready but not all complete")
		}

		// Execute ready tasks in parallel
		var wg sync.WaitGroup
		errChan := make(chan error, len(readyTasks))

		for _, task := range readyTasks {
			wg.Add(1)
			go func(t *Task) {
				defer wg.Done()
				if err := o.executeTask(ctx, t); err != nil {
					errChan <- err
				}
			}(task)
		}

		wg.Wait()
		close(errChan)

		// Check for errors
		for err := range errChan {
			if err != nil {
				workflow.Status = StatusFailed
				return err
			}
		}
	}

	workflow.Status = StatusCompleted
	o.events.Publish(Event{
		Type:   EventTaskCompleted,
		Source: "orchestrator",
		Data:   map[string]interface{}{"workflow_id": workflow.ID},
	})

	return nil
}

// executeTask executes a single task
func (o *Orchestrator) executeTask(ctx context.Context, task *Task) error {
	now := time.Now()
	task.Status = StatusRunning
	task.StartedAt = &now

	o.events.Publish(Event{
		Type:   EventTaskStarted,
		Source: "orchestrator",
		Data:   map[string]interface{}{"task_id": task.ID},
	})

	// Simulate task execution (in real impl, would call LLM/agent)
	select {
	case <-ctx.Done():
		task.Status = StatusCanceled
		return ctx.Err()
	case <-time.After(10 * time.Millisecond):
		// Task completed
	}

	completed := time.Now()
	task.Status = StatusCompleted
	task.CompletedAt = &completed
	task.Output = map[string]interface{}{"result": "completed"}

	o.events.Publish(Event{
		Type:   EventTaskCompleted,
		Source: "orchestrator",
		Data:   map[string]interface{}{"task_id": task.ID},
	})

	return nil
}

// Close shuts down the orchestrator
func (o *Orchestrator) Close() error {
	o.mu.Lock()
	defer o.mu.Unlock()

	// Clear all agents
	o.agents = make(map[string]*Agent)
	return nil
}
