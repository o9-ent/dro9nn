// Package config provides configuration management for cogctl.
package config

import (
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

// Config represents the cogctl configuration.
type Config struct {
	// API configuration
	APIURL string `yaml:"api_url"`
	APIKey string `yaml:"api_key"`

	// Model configuration
	ModelPath string `yaml:"model_path"`
	ModelDefault string `yaml:"model_default"`

	// Server configuration
	ServerPort int    `yaml:"server_port"`
	ServerHost string `yaml:"server_host"`

	// Logging configuration
	LogLevel  string `yaml:"log_level"`
	LogFormat string `yaml:"log_format"`
}

// DefaultConfig returns the default configuration.
func DefaultConfig() *Config {
	return &Config{
		APIURL:     "http://localhost:8080",
		ModelPath:  "~/.o9nn/models",
		ServerPort: 8080,
		ServerHost: "localhost",
		LogLevel:   "info",
		LogFormat:  "text",
	}
}

// Load loads configuration from a file.
func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	config := DefaultConfig()
	if err := yaml.Unmarshal(data, config); err != nil {
		return nil, err
	}

	return config, nil
}

// Save saves configuration to a file.
func (c *Config) Save(path string) error {
	// Ensure directory exists
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	data, err := yaml.Marshal(c)
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}

// ExpandPath expands ~ in paths to the home directory.
func ExpandPath(path string) string {
	if len(path) > 0 && path[0] == '~' {
		home, err := os.UserHomeDir()
		if err == nil {
			return filepath.Join(home, path[1:])
		}
	}
	return path
}
