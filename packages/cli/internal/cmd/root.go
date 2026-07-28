// Package cmd provides the CLI command structure for cogctl.
package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var (
	// Version information
	version = "dev"
	commit  = "none"
	date    = "unknown"

	// Global flags
	configFile string
	verbose    bool
)

// SetVersionInfo sets the version information for the CLI.
func SetVersionInfo(v, c, d string) {
	version = v
	commit = c
	date = d
}

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "cogctl",
	Short: "o9nn Cognitive Platform CLI",
	Long: `cogctl is a command-line interface for the o9nn cognitive computing platform.

It provides tools for:
  - Model management (download, convert, serve)
  - Development environment setup
  - Project scaffolding
  - Deployment orchestration
  - Interactive REPL

Examples:
  cogctl model list                    List available models
  cogctl model download llama-2-7b     Download a model
  cogctl serve --model llama-2-7b      Start inference server
  cogctl init my-project --template agent  Create a new project`,
	SilenceUsage: true,
}

// Execute adds all child commands to the root command and sets flags appropriately.
func Execute() error {
	return rootCmd.Execute()
}

func init() {
	cobra.OnInitialize(initConfig)

	// Global flags
	rootCmd.PersistentFlags().StringVar(&configFile, "config", "", "config file (default is $HOME/.o9nn/config.yaml)")
	rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "verbose output")

	// Add subcommands
	rootCmd.AddCommand(versionCmd)
	rootCmd.AddCommand(modelCmd)
	rootCmd.AddCommand(serveCmd)
	rootCmd.AddCommand(initCmd)
	rootCmd.AddCommand(configCmd)
}

func initConfig() {
	if configFile != "" {
		// Use config file from the flag
		return
	}

	// Find home directory
	home, err := os.UserHomeDir()
	if err != nil {
		fmt.Fprintln(os.Stderr, "Warning: could not find home directory:", err)
		return
	}

	// Default config location
	configFile = home + "/.o9nn/config.yaml"
}

// versionCmd represents the version command
var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print version information",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Printf("cogctl version %s\n", version)
		fmt.Printf("  commit: %s\n", commit)
		fmt.Printf("  built:  %s\n", date)
	},
}
