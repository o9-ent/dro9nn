package cogsdk

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

// AgentInfo represents agent information.
type AgentInfo struct {
	ID        string      `json:"id"`
	Name      string      `json:"name"`
	Status    string      `json:"status"`
	Model     ModelConfig `json:"model"`
	Tools     []string    `json:"tools"`
	CreatedAt time.Time   `json:"createdAt"`
	UpdatedAt time.Time   `json:"updatedAt"`
}

// AgentMessage represents an agent message.
type AgentMessage struct {
	Role       string `json:"role"`
	Content    string `json:"content"`
	Name       string `json:"name,omitempty"`
	ToolCallID string `json:"toolCallId,omitempty"`
}

// ToolCall represents a tool call.
type ToolCall struct {
	ID        string                 `json:"id"`
	Name      string                 `json:"name"`
	Arguments map[string]interface{} `json:"arguments"`
}

// AgentResponse represents an agent response.
type AgentResponse struct {
	ID           string         `json:"id"`
	AgentID      string         `json:"agentId"`
	Message      AgentMessage   `json:"message"`
	ToolCalls    []ToolCall     `json:"toolCalls,omitempty"`
	Usage        UsageInfo      `json:"usage"`
	FinishReason string         `json:"finishReason"`
}

// ConversationHistory represents conversation history.
type ConversationHistory struct {
	Messages   []AgentMessage `json:"messages"`
	Summary    string         `json:"summary,omitempty"`
	TokenCount int            `json:"tokenCount"`
}

// AgentManager manages AI agents.
type AgentManager struct {
	client *Client
}

// NewAgentManager creates a new agent manager.
func NewAgentManager(client *Client) *AgentManager {
	return &AgentManager{client: client}
}

// List returns all available agents.
func (m *AgentManager) List(ctx context.Context) ([]AgentInfo, error) {
	data, err := m.client.Get(ctx, "/api/v1/agents")
	if err != nil {
		return nil, err
	}

	var agents []AgentInfo
	if err := json.Unmarshal(data, &agents); err != nil {
		return nil, fmt.Errorf("failed to parse agents: %w", err)
	}

	return agents, nil
}

// Get returns information about a specific agent.
func (m *AgentManager) Get(ctx context.Context, agentID string) (*AgentInfo, error) {
	data, err := m.client.Get(ctx, fmt.Sprintf("/api/v1/agents/%s", agentID))
	if err != nil {
		return nil, err
	}

	var agent AgentInfo
	if err := json.Unmarshal(data, &agent); err != nil {
		return nil, fmt.Errorf("failed to parse agent: %w", err)
	}

	return &agent, nil
}

// Create creates a new agent.
func (m *AgentManager) Create(ctx context.Context, config *AgentConfig) (*AgentInfo, error) {
	data, err := m.client.Post(ctx, "/api/v1/agents", config)
	if err != nil {
		return nil, err
	}

	var agent AgentInfo
	if err := json.Unmarshal(data, &agent); err != nil {
		return nil, fmt.Errorf("failed to parse agent: %w", err)
	}

	return &agent, nil
}

// Delete deletes an agent.
func (m *AgentManager) Delete(ctx context.Context, agentID string) error {
	_, err := m.client.Delete(ctx, fmt.Sprintf("/api/v1/agents/%s", agentID))
	return err
}

// Chat sends a message to an agent.
func (m *AgentManager) Chat(ctx context.Context, agentID, message string, history []AgentMessage) (*AgentResponse, error) {
	body := map[string]interface{}{
		"message": message,
	}
	if len(history) > 0 {
		body["history"] = history
	}

	data, err := m.client.Post(ctx, fmt.Sprintf("/api/v1/agents/%s/chat", agentID), body)
	if err != nil {
		return nil, err
	}

	var response AgentResponse
	if err := json.Unmarshal(data, &response); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &response, nil
}

// ExecuteToolResult sends a tool execution result to an agent.
func (m *AgentManager) ExecuteToolResult(ctx context.Context, agentID, toolCallID string, result interface{}) (*AgentResponse, error) {
	body := map[string]interface{}{
		"toolCallId": toolCallID,
		"result":     result,
	}

	data, err := m.client.Post(ctx, fmt.Sprintf("/api/v1/agents/%s/tool-result", agentID), body)
	if err != nil {
		return nil, err
	}

	var response AgentResponse
	if err := json.Unmarshal(data, &response); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &response, nil
}

// GetHistory returns the conversation history for an agent.
func (m *AgentManager) GetHistory(ctx context.Context, agentID string, sessionID *string) (*ConversationHistory, error) {
	endpoint := fmt.Sprintf("/api/v1/agents/%s/history", agentID)
	if sessionID != nil {
		endpoint += fmt.Sprintf("?sessionId=%s", *sessionID)
	}

	data, err := m.client.Get(ctx, endpoint)
	if err != nil {
		return nil, err
	}

	var history ConversationHistory
	if err := json.Unmarshal(data, &history); err != nil {
		return nil, fmt.Errorf("failed to parse history: %w", err)
	}

	return &history, nil
}

// ClearHistory clears the conversation history for an agent.
func (m *AgentManager) ClearHistory(ctx context.Context, agentID string, sessionID *string) error {
	endpoint := fmt.Sprintf("/api/v1/agents/%s/history", agentID)
	if sessionID != nil {
		endpoint += fmt.Sprintf("?sessionId=%s", *sessionID)
	}

	_, err := m.client.Delete(ctx, endpoint)
	return err
}

// AgentBuilder helps build agent configurations.
type AgentBuilder struct {
	config AgentConfig
}

// NewAgentBuilder creates a new agent builder.
func NewAgentBuilder(name string) *AgentBuilder {
	return &AgentBuilder{
		config: AgentConfig{
			Name: name,
		},
	}
}

// WithModel sets the model configuration.
func (b *AgentBuilder) WithModel(model ModelConfig) *AgentBuilder {
	b.config.Model = model
	return b
}

// AddTool adds a tool to the agent.
func (b *AgentBuilder) AddTool(tool ToolConfig) *AgentBuilder {
	b.config.Tools = append(b.config.Tools, tool)
	return b
}

// WithMemory sets the memory configuration.
func (b *AgentBuilder) WithMemory(memory MemoryConfig) *AgentBuilder {
	b.config.Memory = &memory
	return b
}

// WithMaxIterations sets the maximum iterations.
func (b *AgentBuilder) WithMaxIterations(max int) *AgentBuilder {
	b.config.MaxIterations = max
	return b
}

// Build returns the agent configuration.
func (b *AgentBuilder) Build() (*AgentConfig, error) {
	if b.config.Name == "" {
		return nil, fmt.Errorf("agent name is required")
	}
	if b.config.Model.Name == "" {
		return nil, fmt.Errorf("model is required")
	}
	return &b.config, nil
}
