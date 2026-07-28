// Package cmd provides configuration management commands.
package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
	"gopkg.in/yaml.v3"
)

var configCmd = &cobra.Command{
	Use:   "config",
	Short: "Configuration management",
	Long: `Commands for managing o9nn configuration.

Configuration is stored in ~/.o9nn/config.yaml by default.

Available subcommands:
  get    - Get a configuration value
  set    - Set a configuration value
  list   - List all configuration values
  init   - Initialize default configuration`,
}

var configGetCmd = &cobra.Command{
	Use:   "get [key]",
	Short: "Get a configuration value",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		key := args[0]
		config, err := loadConfig()
		if err != nil {
			return err
		}

		if value, ok := config[key]; ok {
			fmt.Println(value)
		} else {
			return fmt.Errorf("key not found: %s", key)
		}
		return nil
	},
}

var configSetCmd = &cobra.Command{
	Use:   "set [key] [value]",
	Short: "Set a configuration value",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		key := args[0]
		value := args[1]

		config, err := loadConfig()
		if err != nil {
			// Create new config if doesn't exist
			config = make(map[string]interface{})
		}

		config[key] = value

		if err := saveConfig(config); err != nil {
			return err
		}

		fmt.Printf("Set %s = %s\n", key, value)
		return nil
	},
}

var configListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all configuration values",
	RunE: func(cmd *cobra.Command, args []string) error {
		config, err := loadConfig()
		if err != nil {
			return err
		}

		for key, value := range config {
			fmt.Printf("%s = %v\n", key, value)
		}
		return nil
	},
}

var configInitCmd = &cobra.Command{
	Use:   "init",
	Short: "Initialize default configuration",
	RunE: func(cmd *cobra.Command, args []string) error {
		force, _ := cmd.Flags().GetBool("force")

		// Check if config already exists
		configPath := getConfigPath()
		if _, err := os.Stat(configPath); err == nil && !force {
			return fmt.Errorf("configuration already exists at %s (use --force to overwrite)", configPath)
		}

		// Create default config
		defaultConfig := map[string]interface{}{
			"api_url":    "http://localhost:8080",
			"model_path": "~/.o9nn/models",
			"log_level":  "info",
		}

		if err := saveConfig(defaultConfig); err != nil {
			return err
		}

		fmt.Printf("Configuration initialized at %s\n", configPath)
		return nil
	},
}

func getConfigPath() string {
	if configFile != "" {
		return configFile
	}
	home, _ := os.UserHomeDir()
	return home + "/.o9nn/config.yaml"
}

func loadConfig() (map[string]interface{}, error) {
	configPath := getConfigPath()
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("could not read config: %w", err)
	}

	var config map[string]interface{}
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("could not parse config: %w", err)
	}

	return config, nil
}

func saveConfig(config map[string]interface{}) error {
	configPath := getConfigPath()

	// Ensure directory exists - use filepath.Dir for proper directory extraction
	configDir := filepath.Dir(configPath)
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return fmt.Errorf("could not create config directory: %w", err)
	}

	data, err := yaml.Marshal(config)
	if err != nil {
		return fmt.Errorf("could not serialize config: %w", err)
	}

	if err := os.WriteFile(configPath, data, 0644); err != nil {
		return fmt.Errorf("could not write config: %w", err)
	}

	return nil
}

func init() {
	configCmd.AddCommand(configGetCmd)
	configCmd.AddCommand(configSetCmd)
	configCmd.AddCommand(configListCmd)
	configCmd.AddCommand(configInitCmd)

	configInitCmd.Flags().BoolP("force", "f", false, "overwrite existing configuration")
}
