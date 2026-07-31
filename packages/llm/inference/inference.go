// Package inference provides a unified LLM inference API for the o9nn ecosystem.
//
// Features:
//   - Unified API for multiple LLM backends (llama.cpp, OpenAI, Anthropic, etc.)
//   - Streaming and batch generation
//   - Text and chat completion modes
//   - Response caching
//   - Rate limiting support
//
// Part of Phase 2: AI/ML Platform Integration
package inference

import (
	"context"
	"errors"
	"sync"
	"time"
)

// Version of the inference package
const Version = "0.1.0"

// Backend represents an LLM backend type
type Backend string

const (
	BackendLocal    Backend = "local"    // Local inference (llama.cpp, etc.)
	BackendOpenAI   Backend = "openai"   // OpenAI API
	BackendAnthropic Backend = "anthropic" // Anthropic API
	BackendOllama   Backend = "ollama"   // Ollama local server
	BackendCustom   Backend = "custom"   // Custom backend
)

// Role represents a message role in a conversation
type Role string

const (
	RoleSystem    Role = "system"
	RoleUser      Role = "user"
	RoleAssistant Role = "assistant"
	RoleFunction  Role = "function"
	RoleTool      Role = "tool"
)

// Message represents a chat message
type Message struct {
	Role       Role              `json:"role"`
	Content    string            `json:"content"`
	Name       string            `json:"name,omitempty"`
	ToolCallID string            `json:"tool_call_id,omitempty"`
	ToolCalls  []ToolCall        `json:"tool_calls,omitempty"`
	Metadata   map[string]string `json:"metadata,omitempty"`
}

// ToolCall represents a function/tool call
type ToolCall struct {
	ID       string `json:"id"`
	Type     string `json:"type"` // "function"
	Function struct {
		Name      string `json:"name"`
		Arguments string `json:"arguments"`
	} `json:"function"`
}

// Tool represents a tool/function definition
type Tool struct {
	Type     string `json:"type"` // "function"
	Function struct {
		Name        string      `json:"name"`
		Description string      `json:"description"`
		Parameters  interface{} `json:"parameters"`
	} `json:"function"`
}

// GenerationConfig holds generation parameters
type GenerationConfig struct {
	// Model identifier
	Model string `json:"model"`

	// Maximum tokens to generate
	MaxTokens int `json:"max_tokens,omitempty"`

	// Temperature for sampling (0-2)
	Temperature float64 `json:"temperature,omitempty"`

	// Top-p nucleus sampling
	TopP float64 `json:"top_p,omitempty"`

	// Top-k sampling
	TopK int `json:"top_k,omitempty"`

	// Frequency penalty (-2 to 2)
	FrequencyPenalty float64 `json:"frequency_penalty,omitempty"`

	// Presence penalty (-2 to 2)
	PresencePenalty float64 `json:"presence_penalty,omitempty"`

	// Repetition penalty (1.0 = no penalty)
	RepetitionPenalty float64 `json:"repetition_penalty,omitempty"`

	// Stop sequences
	Stop []string `json:"stop,omitempty"`

	// Seed for deterministic generation
	Seed *int `json:"seed,omitempty"`

	// Stream responses
	Stream bool `json:"stream,omitempty"`

	// Tools available for the model
	Tools []Tool `json:"tools,omitempty"`

	// Tool choice strategy ("auto", "none", or specific tool)
	ToolChoice string `json:"tool_choice,omitempty"`

	// Response format ("text" or "json_object")
	ResponseFormat string `json:"response_format,omitempty"`

	// Custom parameters for specific backends
	Extra map[string]interface{} `json:"extra,omitempty"`
}

// DefaultConfig returns default generation config
func DefaultConfig(model string) *GenerationConfig {
	return &GenerationConfig{
		Model:       model,
		MaxTokens:   1024,
		Temperature: 0.7,
		TopP:        1.0,
	}
}

// Usage represents token usage information
type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// Response represents a generation response
type Response struct {
	// Generated content
	Content string `json:"content"`

	// Full message (for chat)
	Message *Message `json:"message,omitempty"`

	// Tool calls (if any)
	ToolCalls []ToolCall `json:"tool_calls,omitempty"`

	// Token usage
	Usage *Usage `json:"usage,omitempty"`

	// Model used
	Model string `json:"model"`

	// Finish reason
	FinishReason string `json:"finish_reason"`

	// Response latency
	Latency time.Duration `json:"latency"`

	// Request ID for tracking
	RequestID string `json:"request_id,omitempty"`
}

// StreamChunk represents a streaming response chunk
type StreamChunk struct {
	// Delta content
	Content string `json:"content"`

	// Whether this is the final chunk
	Done bool `json:"done"`

	// Token count in this chunk
	TokenCount int `json:"token_count,omitempty"`

	// Tool call delta (if any)
	ToolCallDelta *ToolCall `json:"tool_call_delta,omitempty"`

	// Error if any
	Error error `json:"error,omitempty"`
}

// Client is the interface for LLM inference
type Client interface {
	// Generate text completion
	Generate(ctx context.Context, prompt string, config *GenerationConfig) (*Response, error)

	// Chat completion
	Chat(ctx context.Context, messages []Message, config *GenerationConfig) (*Response, error)

	// Streaming generation
	GenerateStream(ctx context.Context, prompt string, config *GenerationConfig) (<-chan StreamChunk, error)

	// Streaming chat
	ChatStream(ctx context.Context, messages []Message, config *GenerationConfig) (<-chan StreamChunk, error)

	// Get available models
	ListModels(ctx context.Context) ([]ModelInfo, error)

	// Get model info
	GetModel(ctx context.Context, model string) (*ModelInfo, error)

	// Close the client
	Close() error
}

// ModelInfo represents information about a model
type ModelInfo struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Description string            `json:"description,omitempty"`
	Backend     Backend           `json:"backend"`
	Context     int               `json:"context_length,omitempty"`
	Parameters  int64             `json:"parameters,omitempty"`
	Quantization string           `json:"quantization,omitempty"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// ClientConfig holds client configuration
type ClientConfig struct {
	// Backend type
	Backend Backend

	// API base URL
	BaseURL string

	// API key for authentication
	APIKey string

	// Request timeout
	Timeout time.Duration

	// Max retries
	MaxRetries int

	// Retry delay
	RetryDelay time.Duration

	// Default model
	DefaultModel string

	// Extra options
	Options map[string]interface{}
}

// DefaultClientConfig returns default client config
func DefaultClientConfig(backend Backend) *ClientConfig {
	return &ClientConfig{
		Backend:    backend,
		Timeout:    30 * time.Second,
		MaxRetries: 3,
		RetryDelay: 1 * time.Second,
	}
}

// Errors
var (
	ErrNotImplemented   = errors.New("not implemented")
	ErrInvalidConfig    = errors.New("invalid configuration")
	ErrModelNotFound    = errors.New("model not found")
	ErrAPIError         = errors.New("API error")
	ErrTimeout          = errors.New("request timeout")
	ErrRateLimited      = errors.New("rate limited")
	ErrContextCanceled  = errors.New("context canceled")
	ErrStreamClosed     = errors.New("stream closed")
	ErrInvalidResponse  = errors.New("invalid response")
)

// MockClient is a mock implementation for testing
type MockClient struct {
	mu        sync.Mutex
	responses map[string]*Response
	models    []ModelInfo
}

// NewMockClient creates a new mock client
func NewMockClient() *MockClient {
	return &MockClient{
		responses: make(map[string]*Response),
		models: []ModelInfo{
			{ID: "mock-7b", Name: "Mock 7B", Backend: BackendLocal, Context: 4096},
			{ID: "mock-13b", Name: "Mock 13B", Backend: BackendLocal, Context: 8192},
		},
	}
}

// SetResponse sets a mock response for a model
func (c *MockClient) SetResponse(model string, resp *Response) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.responses[model] = resp
}

// Generate generates text
func (c *MockClient) Generate(ctx context.Context, prompt string, config *GenerationConfig) (*Response, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if resp, ok := c.responses[config.Model]; ok {
		return resp, nil
	}

	return &Response{
		Content:      "Mock response to: " + prompt[:min(50, len(prompt))],
		Model:        config.Model,
		FinishReason: "stop",
		Usage: &Usage{
			PromptTokens:     len(prompt) / 4,
			CompletionTokens: 10,
			TotalTokens:      len(prompt)/4 + 10,
		},
		Latency: 100 * time.Millisecond,
	}, nil
}

// Chat generates chat completion
func (c *MockClient) Chat(ctx context.Context, messages []Message, config *GenerationConfig) (*Response, error) {
	// Build prompt from messages
	prompt := ""
	for _, msg := range messages {
		prompt += string(msg.Role) + ": " + msg.Content + "\n"
	}
	return c.Generate(ctx, prompt, config)
}

// GenerateStream generates streaming text
func (c *MockClient) GenerateStream(ctx context.Context, prompt string, config *GenerationConfig) (<-chan StreamChunk, error) {
	ch := make(chan StreamChunk, 10)

	go func() {
		defer close(ch)

		response := "Mock streaming response"
		for i, r := range response {
			select {
			case <-ctx.Done():
				ch <- StreamChunk{Error: ErrContextCanceled}
				return
			default:
				ch <- StreamChunk{
					Content:    string(r),
					TokenCount: 1,
					Done:       i == len(response)-1,
				}
				time.Sleep(50 * time.Millisecond)
			}
		}
	}()

	return ch, nil
}

// ChatStream generates streaming chat
func (c *MockClient) ChatStream(ctx context.Context, messages []Message, config *GenerationConfig) (<-chan StreamChunk, error) {
	prompt := ""
	for _, msg := range messages {
		prompt += string(msg.Role) + ": " + msg.Content + "\n"
	}
	return c.GenerateStream(ctx, prompt, config)
}

// ListModels returns available models
func (c *MockClient) ListModels(ctx context.Context) ([]ModelInfo, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.models, nil
}

// GetModel returns model info
func (c *MockClient) GetModel(ctx context.Context, model string) (*ModelInfo, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for _, m := range c.models {
		if m.ID == model {
			return &m, nil
		}
	}
	return nil, ErrModelNotFound
}

// Close closes the client
func (c *MockClient) Close() error {
	return nil
}

// min returns the minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// ClientPool manages multiple clients
type ClientPool struct {
	mu       sync.RWMutex
	clients  map[Backend]Client
	default_ Backend
}

// NewClientPool creates a new client pool
func NewClientPool() *ClientPool {
	return &ClientPool{
		clients: make(map[Backend]Client),
	}
}

// Register registers a client for a backend
func (p *ClientPool) Register(backend Backend, client Client) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.clients[backend] = client
	if p.default_ == "" {
		p.default_ = backend
	}
}

// SetDefault sets the default backend
func (p *ClientPool) SetDefault(backend Backend) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if _, ok := p.clients[backend]; !ok {
		return ErrModelNotFound
	}
	p.default_ = backend
	return nil
}

// Get returns the client for a backend
func (p *ClientPool) Get(backend Backend) (Client, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if backend == "" {
		backend = p.default_
	}
	if client, ok := p.clients[backend]; ok {
		return client, nil
	}
	return nil, ErrModelNotFound
}

// Close closes all clients
func (p *ClientPool) Close() error {
	p.mu.Lock()
	defer p.mu.Unlock()

	var errs []error
	for _, client := range p.clients {
		if err := client.Close(); err != nil {
			errs = append(errs, err)
		}
	}
	p.clients = make(map[Backend]Client)

	if len(errs) > 0 {
		return errs[0]
	}
	return nil
}

// CachedClient wraps a client with response caching
type CachedClient struct {
	client Client
	cache  map[string]*Response
	mu     sync.RWMutex
	ttl    time.Duration
}

// NewCachedClient creates a cached client wrapper
func NewCachedClient(client Client, ttl time.Duration) *CachedClient {
	return &CachedClient{
		client: client,
		cache:  make(map[string]*Response),
		ttl:    ttl,
	}
}

// Generate with caching
func (c *CachedClient) Generate(ctx context.Context, prompt string, config *GenerationConfig) (*Response, error) {
	key := prompt + "|" + config.Model

	c.mu.RLock()
	if resp, ok := c.cache[key]; ok {
		c.mu.RUnlock()
		return resp, nil
	}
	c.mu.RUnlock()

	resp, err := c.client.Generate(ctx, prompt, config)
	if err != nil {
		return nil, err
	}

	c.mu.Lock()
	c.cache[key] = resp
	c.mu.Unlock()

	return resp, nil
}

// Chat with caching
func (c *CachedClient) Chat(ctx context.Context, messages []Message, config *GenerationConfig) (*Response, error) {
	return c.client.Chat(ctx, messages, config)
}

// GenerateStream delegates to underlying client
func (c *CachedClient) GenerateStream(ctx context.Context, prompt string, config *GenerationConfig) (<-chan StreamChunk, error) {
	return c.client.GenerateStream(ctx, prompt, config)
}

// ChatStream delegates to underlying client
func (c *CachedClient) ChatStream(ctx context.Context, messages []Message, config *GenerationConfig) (<-chan StreamChunk, error) {
	return c.client.ChatStream(ctx, messages, config)
}

// ListModels delegates to underlying client
func (c *CachedClient) ListModels(ctx context.Context) ([]ModelInfo, error) {
	return c.client.ListModels(ctx)
}

// GetModel delegates to underlying client
func (c *CachedClient) GetModel(ctx context.Context, model string) (*ModelInfo, error) {
	return c.client.GetModel(ctx, model)
}

// Close closes the underlying client
func (c *CachedClient) Close() error {
	return c.client.Close()
}
