// Package cogsdk provides a Go client for the o9nn cognitive computing platform.
package cogsdk

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Version is the SDK version.
const Version = "0.1.0"

// Config holds the SDK configuration.
type Config struct {
	BaseURL string
	APIKey  string
	Timeout time.Duration
}

// DefaultConfig returns a default configuration.
func DefaultConfig() *Config {
	return &Config{
		BaseURL: "http://localhost:8080",
		Timeout: 30 * time.Second,
	}
}

// Client is the o9nn API client.
type Client struct {
	config     *Config
	httpClient *http.Client
}

// NewClient creates a new o9nn client.
func NewClient(config *Config) *Client {
	if config == nil {
		config = DefaultConfig()
	}
	return &Client{
		config: config,
		httpClient: &http.Client{
			Timeout: config.Timeout,
		},
	}
}

// APIError represents an API error response.
type APIError struct {
	StatusCode int
	Message    string
	Body       string
}

func (e *APIError) Error() string {
	return fmt.Sprintf("API error: %d - %s", e.StatusCode, e.Message)
}

// Request makes an HTTP request to the API.
func (c *Client) Request(ctx context.Context, method, endpoint string, body interface{}) ([]byte, error) {
	url := c.config.BaseURL + endpoint

	var reqBody io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewReader(jsonBody)
	}

	req, err := http.NewRequestWithContext(ctx, method, url, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if c.config.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.config.APIKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, &APIError{
			StatusCode: resp.StatusCode,
			Message:    http.StatusText(resp.StatusCode),
			Body:       string(respBody),
		}
	}

	return respBody, nil
}

// Get makes a GET request.
func (c *Client) Get(ctx context.Context, endpoint string) ([]byte, error) {
	return c.Request(ctx, http.MethodGet, endpoint, nil)
}

// Post makes a POST request.
func (c *Client) Post(ctx context.Context, endpoint string, body interface{}) ([]byte, error) {
	return c.Request(ctx, http.MethodPost, endpoint, body)
}

// Put makes a PUT request.
func (c *Client) Put(ctx context.Context, endpoint string, body interface{}) ([]byte, error) {
	return c.Request(ctx, http.MethodPut, endpoint, body)
}

// Delete makes a DELETE request.
func (c *Client) Delete(ctx context.Context, endpoint string) ([]byte, error) {
	return c.Request(ctx, http.MethodDelete, endpoint, nil)
}

// Models returns a ModelManager for the client.
func (c *Client) Models() *ModelManager {
	return NewModelManager(c)
}

// Agents returns an AgentManager for the client.
func (c *Client) Agents() *AgentManager {
	return NewAgentManager(c)
}
