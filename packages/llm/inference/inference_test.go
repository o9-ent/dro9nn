package inference

import (
	"context"
	"testing"
	"time"
)

func TestDefaultConfig(t *testing.T) {
	config := DefaultConfig("llama-7b")

	if config.Model != "llama-7b" {
		t.Errorf("Model = %v, want %v", config.Model, "llama-7b")
	}
	if config.MaxTokens != 1024 {
		t.Errorf("MaxTokens = %v, want %v", config.MaxTokens, 1024)
	}
	if config.Temperature != 0.7 {
		t.Errorf("Temperature = %v, want %v", config.Temperature, 0.7)
	}
}

func TestMockClient_Generate(t *testing.T) {
	client := NewMockClient()
	ctx := context.Background()
	config := DefaultConfig("mock-7b")

	resp, err := client.Generate(ctx, "Hello, world!", config)
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}

	if resp.Content == "" {
		t.Errorf("Content should not be empty")
	}
	if resp.Model != "mock-7b" {
		t.Errorf("Model = %v, want %v", resp.Model, "mock-7b")
	}
	if resp.FinishReason != "stop" {
		t.Errorf("FinishReason = %v, want %v", resp.FinishReason, "stop")
	}
	if resp.Usage == nil {
		t.Errorf("Usage should not be nil")
	}
}

func TestMockClient_SetResponse(t *testing.T) {
	client := NewMockClient()
	ctx := context.Background()
	config := DefaultConfig("custom-model")

	customResp := &Response{
		Content:      "Custom response",
		Model:        "custom-model",
		FinishReason: "stop",
	}
	client.SetResponse("custom-model", customResp)

	resp, err := client.Generate(ctx, "test", config)
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}

	if resp.Content != "Custom response" {
		t.Errorf("Content = %v, want %v", resp.Content, "Custom response")
	}
}

func TestMockClient_Chat(t *testing.T) {
	client := NewMockClient()
	ctx := context.Background()
	config := DefaultConfig("mock-7b")

	messages := []Message{
		{Role: RoleSystem, Content: "You are a helpful assistant."},
		{Role: RoleUser, Content: "Hello!"},
	}

	resp, err := client.Chat(ctx, messages, config)
	if err != nil {
		t.Fatalf("Chat() error = %v", err)
	}

	if resp.Content == "" {
		t.Errorf("Content should not be empty")
	}
}

func TestMockClient_ListModels(t *testing.T) {
	client := NewMockClient()
	ctx := context.Background()

	models, err := client.ListModels(ctx)
	if err != nil {
		t.Fatalf("ListModels() error = %v", err)
	}

	if len(models) != 2 {
		t.Errorf("len(models) = %v, want %v", len(models), 2)
	}
}

func TestMockClient_GetModel(t *testing.T) {
	client := NewMockClient()
	ctx := context.Background()

	model, err := client.GetModel(ctx, "mock-7b")
	if err != nil {
		t.Fatalf("GetModel() error = %v", err)
	}

	if model.ID != "mock-7b" {
		t.Errorf("ID = %v, want %v", model.ID, "mock-7b")
	}
}

func TestMockClient_GetModel_NotFound(t *testing.T) {
	client := NewMockClient()
	ctx := context.Background()

	_, err := client.GetModel(ctx, "nonexistent")
	if err != ErrModelNotFound {
		t.Errorf("GetModel() error = %v, want %v", err, ErrModelNotFound)
	}
}

func TestMockClient_GenerateStream(t *testing.T) {
	client := NewMockClient()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	config := DefaultConfig("mock-7b")

	ch, err := client.GenerateStream(ctx, "Hello", config)
	if err != nil {
		t.Fatalf("GenerateStream() error = %v", err)
	}

	var content string
	for chunk := range ch {
		if chunk.Error != nil {
			t.Fatalf("Chunk error = %v", chunk.Error)
		}
		content += chunk.Content
	}

	if content == "" {
		t.Errorf("Streamed content should not be empty")
	}
}

func TestClientPool(t *testing.T) {
	pool := NewClientPool()
	mock1 := NewMockClient()
	mock2 := NewMockClient()

	pool.Register(BackendLocal, mock1)
	pool.Register(BackendOllama, mock2)

	// Get registered client
	client, err := pool.Get(BackendLocal)
	if err != nil {
		t.Fatalf("Get() error = %v", err)
	}
	if client != mock1 {
		t.Errorf("Got wrong client")
	}

	// Get default client
	client, err = pool.Get("")
	if err != nil {
		t.Fatalf("Get() default error = %v", err)
	}
	if client != mock1 {
		t.Errorf("Default should be first registered")
	}

	// Set different default
	err = pool.SetDefault(BackendOllama)
	if err != nil {
		t.Fatalf("SetDefault() error = %v", err)
	}

	client, err = pool.Get("")
	if err != nil {
		t.Fatalf("Get() error = %v", err)
	}
	if client != mock2 {
		t.Errorf("Default should be ollama now")
	}

	// Close all
	err = pool.Close()
	if err != nil {
		t.Fatalf("Close() error = %v", err)
	}
}

func TestClientPool_NotFound(t *testing.T) {
	pool := NewClientPool()

	_, err := pool.Get(BackendOpenAI)
	if err != ErrModelNotFound {
		t.Errorf("Get() error = %v, want %v", err, ErrModelNotFound)
	}
}

func TestCachedClient(t *testing.T) {
	mock := NewMockClient()
	cached := NewCachedClient(mock, time.Hour)
	ctx := context.Background()
	config := DefaultConfig("mock-7b")

	// First call
	resp1, err := cached.Generate(ctx, "test prompt", config)
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}

	// Second call should return cached
	resp2, err := cached.Generate(ctx, "test prompt", config)
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}

	// Same response (from cache)
	if resp1.Content != resp2.Content {
		t.Errorf("Cached response should be identical")
	}
}

func TestMessage(t *testing.T) {
	msg := Message{
		Role:    RoleUser,
		Content: "Hello",
		Metadata: map[string]string{
			"source": "test",
		},
	}

	if msg.Role != RoleUser {
		t.Errorf("Role = %v, want %v", msg.Role, RoleUser)
	}
	if msg.Content != "Hello" {
		t.Errorf("Content = %v, want %v", msg.Content, "Hello")
	}
}

func TestToolCall(t *testing.T) {
	tc := ToolCall{
		ID:   "call_123",
		Type: "function",
	}
	tc.Function.Name = "get_weather"
	tc.Function.Arguments = `{"location": "NYC"}`

	if tc.ID != "call_123" {
		t.Errorf("ID = %v, want %v", tc.ID, "call_123")
	}
	if tc.Function.Name != "get_weather" {
		t.Errorf("Function.Name = %v, want %v", tc.Function.Name, "get_weather")
	}
}

func TestGenerationConfig(t *testing.T) {
	seed := 42
	config := &GenerationConfig{
		Model:             "test-model",
		MaxTokens:         2048,
		Temperature:       0.8,
		TopP:              0.95,
		TopK:              50,
		FrequencyPenalty:  0.5,
		PresencePenalty:   0.5,
		RepetitionPenalty: 1.1,
		Stop:              []string{"\n\n"},
		Seed:              &seed,
		Stream:            true,
		ResponseFormat:    "json_object",
	}

	if config.Model != "test-model" {
		t.Errorf("Model = %v, want %v", config.Model, "test-model")
	}
	if *config.Seed != 42 {
		t.Errorf("Seed = %v, want %v", *config.Seed, 42)
	}
}

func TestUsage(t *testing.T) {
	usage := &Usage{
		PromptTokens:     100,
		CompletionTokens: 50,
		TotalTokens:      150,
	}

	if usage.TotalTokens != 150 {
		t.Errorf("TotalTokens = %v, want %v", usage.TotalTokens, 150)
	}
}

func TestModelInfo(t *testing.T) {
	info := &ModelInfo{
		ID:           "llama-7b",
		Name:         "LLaMA 7B",
		Description:  "Meta's LLaMA 7B model",
		Backend:      BackendLocal,
		Context:      4096,
		Parameters:   7_000_000_000,
		Quantization: "Q4_K_M",
	}

	if info.ID != "llama-7b" {
		t.Errorf("ID = %v, want %v", info.ID, "llama-7b")
	}
	if info.Parameters != 7_000_000_000 {
		t.Errorf("Parameters = %v, want %v", info.Parameters, 7_000_000_000)
	}
}

func TestDefaultClientConfig(t *testing.T) {
	config := DefaultClientConfig(BackendOpenAI)

	if config.Backend != BackendOpenAI {
		t.Errorf("Backend = %v, want %v", config.Backend, BackendOpenAI)
	}
	if config.Timeout != 30*time.Second {
		t.Errorf("Timeout = %v, want %v", config.Timeout, 30*time.Second)
	}
	if config.MaxRetries != 3 {
		t.Errorf("MaxRetries = %v, want %v", config.MaxRetries, 3)
	}
}

func BenchmarkMockClient_Generate(b *testing.B) {
	client := NewMockClient()
	ctx := context.Background()
	config := DefaultConfig("mock-7b")
	prompt := "What is the meaning of life?"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = client.Generate(ctx, prompt, config)
	}
}

func BenchmarkCachedClient_Generate(b *testing.B) {
	mock := NewMockClient()
	cached := NewCachedClient(mock, time.Hour)
	ctx := context.Background()
	config := DefaultConfig("mock-7b")
	prompt := "What is the meaning of life?"

	// Prime the cache
	_, _ = cached.Generate(ctx, prompt, config)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = cached.Generate(ctx, prompt, config)
	}
}
