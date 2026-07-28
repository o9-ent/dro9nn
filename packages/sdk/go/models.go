package cogsdk

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

// ModelInfo represents model information.
type ModelInfo struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Version      string    `json:"version"`
	Backend      Backend   `json:"backend"`
	Size         int64     `json:"size"`
	Quantization string    `json:"quantization,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// UsageInfo represents token usage information.
type UsageInfo struct {
	PromptTokens     int `json:"promptTokens"`
	CompletionTokens int `json:"completionTokens"`
	TotalTokens      int `json:"totalTokens"`
}

// InferenceResult represents an inference result.
type InferenceResult struct {
	ID      string      `json:"id"`
	ModelID string      `json:"modelId"`
	Output  interface{} `json:"output"`
	Usage   UsageInfo   `json:"usage"`
	Latency float64     `json:"latency"`
}

// GenerationOptions represents generation options.
type GenerationOptions struct {
	InferenceOptions
	Prompt            string   `json:"prompt"`
	StopSequences     []string `json:"stopSequences,omitempty"`
	RepetitionPenalty float64  `json:"repetitionPenalty,omitempty"`
	PresencePenalty   float64  `json:"presencePenalty,omitempty"`
	FrequencyPenalty  float64  `json:"frequencyPenalty,omitempty"`
}

// ModelManager manages ML models.
type ModelManager struct {
	client *Client
}

// NewModelManager creates a new model manager.
func NewModelManager(client *Client) *ModelManager {
	return &ModelManager{client: client}
}

// List returns all available models.
func (m *ModelManager) List(ctx context.Context, backend *Backend) ([]ModelInfo, error) {
	endpoint := "/api/v1/models"
	if backend != nil {
		endpoint += fmt.Sprintf("?backend=%s", *backend)
	}

	data, err := m.client.Get(ctx, endpoint)
	if err != nil {
		return nil, err
	}

	var models []ModelInfo
	if err := json.Unmarshal(data, &models); err != nil {
		return nil, fmt.Errorf("failed to parse models: %w", err)
	}

	return models, nil
}

// Get returns information about a specific model.
func (m *ModelManager) Get(ctx context.Context, modelID string) (*ModelInfo, error) {
	data, err := m.client.Get(ctx, fmt.Sprintf("/api/v1/models/%s", modelID))
	if err != nil {
		return nil, err
	}

	var model ModelInfo
	if err := json.Unmarshal(data, &model); err != nil {
		return nil, fmt.Errorf("failed to parse model: %w", err)
	}

	return &model, nil
}

// Load loads a model with the given configuration.
func (m *ModelManager) Load(ctx context.Context, config *ModelConfig) (*ModelInfo, error) {
	data, err := m.client.Post(ctx, "/api/v1/models/load", config)
	if err != nil {
		return nil, err
	}

	var model ModelInfo
	if err := json.Unmarshal(data, &model); err != nil {
		return nil, fmt.Errorf("failed to parse model: %w", err)
	}

	return &model, nil
}

// Unload unloads a model.
func (m *ModelManager) Unload(ctx context.Context, modelID string) error {
	_, err := m.client.Delete(ctx, fmt.Sprintf("/api/v1/models/%s", modelID))
	return err
}

// Infer runs inference on a model.
func (m *ModelManager) Infer(ctx context.Context, modelID string, input interface{}, options *InferenceOptions) (*InferenceResult, error) {
	body := map[string]interface{}{
		"input": input,
	}
	if options != nil {
		body["options"] = options
	}

	data, err := m.client.Post(ctx, fmt.Sprintf("/api/v1/models/%s/infer", modelID), body)
	if err != nil {
		return nil, err
	}

	var result InferenceResult
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to parse result: %w", err)
	}

	return &result, nil
}

// Generate generates text using a language model.
func (m *ModelManager) Generate(ctx context.Context, modelID string, options *GenerationOptions) (*InferenceResult, error) {
	data, err := m.client.Post(ctx, fmt.Sprintf("/api/v1/models/%s/generate", modelID), options)
	if err != nil {
		return nil, err
	}

	var result InferenceResult
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to parse result: %w", err)
	}

	return &result, nil
}
