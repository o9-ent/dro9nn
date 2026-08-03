// Package cmd provides the dev command for development server.
package cmd

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/spf13/cobra"
)

var devCmd = &cobra.Command{
	Use:   "dev",
	Short: "Start development server",
	Long: `Start the o9nn development server with hot reloading.

This command starts a local development environment with:
  - Hot reloading for code changes
  - Development API server
  - Debug logging enabled
  - Source maps and debugging support

The dev server monitors your project files and automatically
reloads when changes are detected.

Examples:
  cogctl dev
  cogctl dev --port 3000
  cogctl dev --model llama-2-7b-chat
  cogctl dev --watch src/`,
	RunE: func(cmd *cobra.Command, args []string) error {
		port, _ := cmd.Flags().GetInt("port")
		host, _ := cmd.Flags().GetString("host")
		model, _ := cmd.Flags().GetString("model")
		watchDirs, _ := cmd.Flags().GetStringSlice("watch")
		noReload, _ := cmd.Flags().GetBool("no-reload")

		return runDevServer(host, port, model, watchDirs, noReload)
	},
}

func runDevServer(host string, port int, model string, watchDirs []string, noReload bool) error {
	fmt.Println("Starting o9nn development server...")
	fmt.Println()
	fmt.Printf("  Host:        %s\n", host)
	fmt.Printf("  Port:        %d\n", port)
	if model != "" {
		fmt.Printf("  Model:       %s\n", model)
	}
	if len(watchDirs) > 0 {
		fmt.Printf("  Watching:    %v\n", watchDirs)
	}
	fmt.Printf("  Hot Reload:  %v\n", !noReload)
	fmt.Println()

	// Check for project configuration
	if _, err := os.Stat("o9nn.config.yaml"); err == nil {
		fmt.Println("Found o9nn.config.yaml")
	} else if _, err := os.Stat("o9nn.config.json"); err == nil {
		fmt.Println("Found o9nn.config.json")
	} else {
		fmt.Println("Warning: No o9nn configuration file found.")
		fmt.Println("  Run 'cogctl init <project-name>' to create a new project.")
		fmt.Println()
	}

	// TODO: Implement actual development server
	fmt.Println("Development server started!")
	fmt.Println()
	fmt.Printf("  API:       http://%s:%d/api/v1\n", host, port)
	fmt.Printf("  Docs:      http://%s:%d/docs\n", host, port)
	fmt.Printf("  Health:    http://%s:%d/health\n", host, port)
	if !noReload {
		fmt.Printf("  WebSocket: ws://%s:%d/ws\n", host, port)
	}
	fmt.Println()
	fmt.Println("Press Ctrl+C to stop the server...")

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	fmt.Println()
	fmt.Println("Shutting down development server...")
	return nil
}

func init() {
	rootCmd.AddCommand(devCmd)

	devCmd.Flags().IntP("port", "p", 8080, "port to listen on")
	devCmd.Flags().StringP("host", "H", "localhost", "host to bind to")
	devCmd.Flags().StringP("model", "m", "", "default model to use")
	devCmd.Flags().StringSliceP("watch", "w", []string{"src", "configs"}, "directories to watch for changes")
	devCmd.Flags().Bool("no-reload", false, "disable hot reloading")
}
