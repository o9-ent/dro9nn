package orchestration

import (
	"context"
	"sync"
	"testing"
	"time"
)

func TestNewAgent(t *testing.T) {
	agent := NewAgent("agent-1", "Test Agent", RoleWorker, "llama-7b")

	if agent.ID != "agent-1" {
		t.Errorf("ID = %v, want %v", agent.ID, "agent-1")
	}
	if agent.Name != "Test Agent" {
		t.Errorf("Name = %v, want %v", agent.Name, "Test Agent")
	}
	if agent.Role != RoleWorker {
		t.Errorf("Role = %v, want %v", agent.Role, RoleWorker)
	}
	if agent.Status() != StatusPending {
		t.Errorf("Status = %v, want %v", agent.Status(), StatusPending)
	}
}

func TestAgentStatus(t *testing.T) {
	agent := NewAgent("agent-1", "Test", RoleWorker, "llama-7b")

	agent.SetStatus(StatusRunning)
	if agent.Status() != StatusRunning {
		t.Errorf("Status = %v, want %v", agent.Status(), StatusRunning)
	}

	agent.SetStatus(StatusCompleted)
	if agent.Status() != StatusCompleted {
		t.Errorf("Status = %v, want %v", agent.Status(), StatusCompleted)
	}
}

func TestToolRegistry(t *testing.T) {
	registry := NewToolRegistry()

	tool := &Tool{
		Name:        "search",
		Description: "Search the web",
		Execute: func(ctx context.Context, params map[string]interface{}) (interface{}, error) {
			return "search results", nil
		},
	}

	// Register
	err := registry.Register(tool)
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	// Get
	retrieved, err := registry.Get("search")
	if err != nil {
		t.Fatalf("Get() error = %v", err)
	}
	if retrieved.Name != "search" {
		t.Errorf("Name = %v, want %v", retrieved.Name, "search")
	}

	// List
	tools := registry.List()
	if len(tools) != 1 {
		t.Errorf("len(tools) = %v, want %v", len(tools), 1)
	}
}

func TestToolRegistry_DuplicateRegistration(t *testing.T) {
	registry := NewToolRegistry()

	tool := &Tool{Name: "search", Description: "Search"}
	_ = registry.Register(tool)

	err := registry.Register(tool)
	if err == nil {
		t.Errorf("Register() should error on duplicate")
	}
}

func TestToolRegistry_Execute(t *testing.T) {
	registry := NewToolRegistry()

	tool := &Tool{
		Name: "add",
		Execute: func(ctx context.Context, params map[string]interface{}) (interface{}, error) {
			a := params["a"].(float64)
			b := params["b"].(float64)
			return a + b, nil
		},
	}
	_ = registry.Register(tool)

	ctx := context.Background()
	result, err := registry.Execute(ctx, "add", map[string]interface{}{"a": 1.0, "b": 2.0})
	if err != nil {
		t.Fatalf("Execute() error = %v", err)
	}

	if result.(float64) != 3.0 {
		t.Errorf("result = %v, want %v", result, 3.0)
	}
}

func TestToolRegistry_NotFound(t *testing.T) {
	registry := NewToolRegistry()

	_, err := registry.Get("nonexistent")
	if err == nil {
		t.Errorf("Get() should error for nonexistent tool")
	}
}

func TestMemoryStore(t *testing.T) {
	store := NewMemoryStore(100)

	entry := &MemoryEntry{
		ID:        "mem-1",
		Type:      MemoryShortTerm,
		Content:   "Test memory",
		CreatedAt: time.Now(),
	}

	// Store
	err := store.Store(entry)
	if err != nil {
		t.Fatalf("Store() error = %v", err)
	}

	// Retrieve
	retrieved, err := store.Retrieve("mem-1")
	if err != nil {
		t.Fatalf("Retrieve() error = %v", err)
	}
	if retrieved.Content != "Test memory" {
		t.Errorf("Content = %v, want %v", retrieved.Content, "Test memory")
	}
}

func TestMemoryStore_Search(t *testing.T) {
	store := NewMemoryStore(100)

	for i := 0; i < 5; i++ {
		_ = store.Store(&MemoryEntry{
			ID:        string(rune('a' + i)),
			Type:      MemoryShortTerm,
			Content:   "Memory content",
			CreatedAt: time.Now(),
		})
	}

	results := store.Search(MemoryShortTerm, "", 3)
	if len(results) != 3 {
		t.Errorf("len(results) = %v, want %v", len(results), 3)
	}
}

func TestMemoryStore_Clear(t *testing.T) {
	store := NewMemoryStore(100)

	_ = store.Store(&MemoryEntry{ID: "1", Type: MemoryShortTerm, CreatedAt: time.Now()})
	_ = store.Store(&MemoryEntry{ID: "2", Type: MemoryLongTerm, CreatedAt: time.Now()})

	store.Clear(MemoryShortTerm)

	_, err := store.Retrieve("1")
	if err == nil {
		t.Errorf("Retrieve() should error after clear")
	}

	_, err = store.Retrieve("2")
	if err != nil {
		t.Errorf("Long term memory should still exist")
	}
}

func TestMemoryStore_Expiration(t *testing.T) {
	store := NewMemoryStore(100)

	past := time.Now().Add(-time.Hour)
	_ = store.Store(&MemoryEntry{
		ID:        "expired",
		Type:      MemoryShortTerm,
		CreatedAt: time.Now(),
		ExpiresAt: &past,
	})

	_, err := store.Retrieve("expired")
	if err == nil {
		t.Errorf("Retrieve() should error for expired memory")
	}
}

func TestEventBus(t *testing.T) {
	bus := NewEventBus()

	var received Event
	var wg sync.WaitGroup
	wg.Add(1)

	bus.Subscribe(EventAgentStarted, func(e Event) {
		received = e
		wg.Done()
	})

	bus.Publish(Event{
		Type:   EventAgentStarted,
		Source: "test",
		Data:   map[string]interface{}{"key": "value"},
	})

	wg.Wait()

	if received.Type != EventAgentStarted {
		t.Errorf("Type = %v, want %v", received.Type, EventAgentStarted)
	}
	if received.Source != "test" {
		t.Errorf("Source = %v, want %v", received.Source, "test")
	}
}

func TestEventBus_SubscribeAll(t *testing.T) {
	bus := NewEventBus()

	var count int
	var mu sync.Mutex
	var wg sync.WaitGroup
	wg.Add(3)

	bus.SubscribeAll(func(e Event) {
		mu.Lock()
		count++
		mu.Unlock()
		wg.Done()
	})

	bus.Publish(Event{Type: EventAgentStarted, Source: "test"})
	bus.Publish(Event{Type: EventAgentCompleted, Source: "test"})
	bus.Publish(Event{Type: EventTaskStarted, Source: "test"})

	wg.Wait()

	if count != 3 {
		t.Errorf("count = %v, want %v", count, 3)
	}
}

func TestWorkflow(t *testing.T) {
	workflow := NewWorkflow("wf-1", "Test Workflow")

	task1 := &Task{ID: "task-1", Name: "Task 1", Status: StatusPending}
	task2 := &Task{ID: "task-2", Name: "Task 2", Status: StatusPending, DependsOn: []string{"task-1"}}

	workflow.AddTask(task1)
	workflow.AddTask(task2)

	if len(workflow.Tasks) != 2 {
		t.Errorf("len(Tasks) = %v, want %v", len(workflow.Tasks), 2)
	}

	// Initially only task1 should be ready
	ready := workflow.GetReadyTasks()
	if len(ready) != 1 || ready[0].ID != "task-1" {
		t.Errorf("GetReadyTasks() = %v, want task-1", ready)
	}

	// After task1 completes, task2 should be ready
	task1.Status = StatusCompleted
	ready = workflow.GetReadyTasks()
	if len(ready) != 1 || ready[0].ID != "task-2" {
		t.Errorf("GetReadyTasks() = %v, want task-2", ready)
	}
}

func TestOrchestrator(t *testing.T) {
	orch := NewOrchestrator(StrategySequential)

	agent := NewAgent("agent-1", "Test Agent", RoleWorker, "llama-7b")
	err := orch.RegisterAgent(agent)
	if err != nil {
		t.Fatalf("RegisterAgent() error = %v", err)
	}

	retrieved, err := orch.GetAgent("agent-1")
	if err != nil {
		t.Fatalf("GetAgent() error = %v", err)
	}
	if retrieved.ID != "agent-1" {
		t.Errorf("ID = %v, want %v", retrieved.ID, "agent-1")
	}

	agents := orch.ListAgents()
	if len(agents) != 1 {
		t.Errorf("len(agents) = %v, want %v", len(agents), 1)
	}
}

func TestOrchestrator_DuplicateAgent(t *testing.T) {
	orch := NewOrchestrator(StrategySequential)

	agent := NewAgent("agent-1", "Test", RoleWorker, "llama-7b")
	_ = orch.RegisterAgent(agent)

	err := orch.RegisterAgent(agent)
	if err == nil {
		t.Errorf("RegisterAgent() should error on duplicate")
	}
}

func TestOrchestrator_ExecuteWorkflowSequential(t *testing.T) {
	orch := NewOrchestrator(StrategySequential)

	workflow := NewWorkflow("wf-1", "Test")
	workflow.AddTask(&Task{ID: "task-1", Name: "Task 1", Status: StatusPending})
	workflow.AddTask(&Task{ID: "task-2", Name: "Task 2", Status: StatusPending})

	ctx := context.Background()
	err := orch.ExecuteWorkflow(ctx, workflow)
	if err != nil {
		t.Fatalf("ExecuteWorkflow() error = %v", err)
	}

	if workflow.Status != StatusCompleted {
		t.Errorf("Status = %v, want %v", workflow.Status, StatusCompleted)
	}

	for _, task := range workflow.Tasks {
		if task.Status != StatusCompleted {
			t.Errorf("Task %s status = %v, want %v", task.ID, task.Status, StatusCompleted)
		}
	}
}

func TestOrchestrator_ExecuteWorkflowParallel(t *testing.T) {
	orch := NewOrchestrator(StrategyParallel)

	workflow := NewWorkflow("wf-1", "Test")
	workflow.AddTask(&Task{ID: "task-1", Name: "Task 1", Status: StatusPending})
	workflow.AddTask(&Task{ID: "task-2", Name: "Task 2", Status: StatusPending})
	workflow.AddTask(&Task{ID: "task-3", Name: "Task 3", Status: StatusPending, DependsOn: []string{"task-1", "task-2"}})

	ctx := context.Background()
	err := orch.ExecuteWorkflow(ctx, workflow)
	if err != nil {
		t.Fatalf("ExecuteWorkflow() error = %v", err)
	}

	if workflow.Status != StatusCompleted {
		t.Errorf("Status = %v, want %v", workflow.Status, StatusCompleted)
	}
}

func TestOrchestrator_CancelWorkflow(t *testing.T) {
	orch := NewOrchestrator(StrategySequential)

	workflow := NewWorkflow("wf-1", "Test")
	for i := 0; i < 10; i++ {
		workflow.AddTask(&Task{ID: string(rune('a' + i)), Status: StatusPending})
	}

	ctx, cancel := context.WithCancel(context.Background())
	cancel() // Cancel immediately

	err := orch.ExecuteWorkflow(ctx, workflow)
	if err == nil {
		t.Errorf("ExecuteWorkflow() should error on canceled context")
	}

	if workflow.Status != StatusCanceled {
		t.Errorf("Status = %v, want %v", workflow.Status, StatusCanceled)
	}
}

func TestOrchestrator_Tools(t *testing.T) {
	orch := NewOrchestrator(StrategySequential)

	tool := &Tool{
		Name: "test-tool",
		Execute: func(ctx context.Context, params map[string]interface{}) (interface{}, error) {
			return "result", nil
		},
	}
	err := orch.Tools().Register(tool)
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	tools := orch.Tools().List()
	if len(tools) != 1 {
		t.Errorf("len(tools) = %v, want %v", len(tools), 1)
	}
}

func TestOrchestrator_Memory(t *testing.T) {
	orch := NewOrchestrator(StrategySequential)

	entry := &MemoryEntry{
		ID:        "mem-1",
		Type:      MemoryShortTerm,
		Content:   "Test",
		CreatedAt: time.Now(),
	}
	err := orch.Memory().Store(entry)
	if err != nil {
		t.Fatalf("Store() error = %v", err)
	}

	retrieved, err := orch.Memory().Retrieve("mem-1")
	if err != nil {
		t.Fatalf("Retrieve() error = %v", err)
	}
	if retrieved.Content != "Test" {
		t.Errorf("Content = %v, want %v", retrieved.Content, "Test")
	}
}

func TestOrchestrator_Events(t *testing.T) {
	orch := NewOrchestrator(StrategySequential)

	var received int
	var mu sync.Mutex
	var wg sync.WaitGroup
	wg.Add(2) // Expect 2 events: one for task, one for workflow

	orch.Events().Subscribe(EventTaskCompleted, func(e Event) {
		mu.Lock()
		received++
		mu.Unlock()
		wg.Done()
	})

	workflow := NewWorkflow("wf-1", "Test")
	workflow.AddTask(&Task{ID: "task-1", Status: StatusPending})

	ctx := context.Background()
	_ = orch.ExecuteWorkflow(ctx, workflow)

	wg.Wait()

	if received != 2 {
		t.Errorf("received = %v, want 2 (task + workflow)", received)
	}
}

func TestOrchestrator_Close(t *testing.T) {
	orch := NewOrchestrator(StrategySequential)

	_ = orch.RegisterAgent(NewAgent("a1", "Agent 1", RoleWorker, "llama"))
	_ = orch.RegisterAgent(NewAgent("a2", "Agent 2", RoleWorker, "llama"))

	err := orch.Close()
	if err != nil {
		t.Fatalf("Close() error = %v", err)
	}

	agents := orch.ListAgents()
	if len(agents) != 0 {
		t.Errorf("len(agents) = %v, want 0 after close", len(agents))
	}
}

func BenchmarkOrchestrator_ExecuteWorkflow(b *testing.B) {
	orch := NewOrchestrator(StrategyParallel)
	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		workflow := NewWorkflow("wf", "Test")
		for j := 0; j < 10; j++ {
			workflow.AddTask(&Task{ID: string(rune('a' + j)), Status: StatusPending})
		}
		_ = orch.ExecuteWorkflow(ctx, workflow)
	}
}
