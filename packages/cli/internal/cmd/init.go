// Package cmd provides the init command for project scaffolding.
package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
)

var initCmd = &cobra.Command{
	Use:   "init [project-name]",
	Short: "Initialize a new o9nn project",
	Long: `Create a new o9nn project with the specified template.

Available templates:
  - agent: AI agent project with tool calling
  - inference: Model inference server
  - training: Model training pipeline
  - plugin: o9nn plugin/extension
  - minimal: Minimal project structure

Examples:
  cogctl init my-agent --template agent
  cogctl init my-server --template inference
  cogctl init my-project`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		projectName := args[0]
		template, _ := cmd.Flags().GetString("template")
		outputDir, _ := cmd.Flags().GetString("output")

		if outputDir == "" {
			outputDir = projectName
		}

		fmt.Printf("Creating new o9nn project: %s\n", projectName)
		fmt.Printf("  Template: %s\n", template)
		fmt.Printf("  Directory: %s\n", outputDir)

		// Create project directory
		if err := os.MkdirAll(outputDir, 0755); err != nil {
			return fmt.Errorf("failed to create directory: %w", err)
		}

		// Create project structure based on template
		if err := createProjectStructure(outputDir, projectName, template); err != nil {
			return fmt.Errorf("failed to create project: %w", err)
		}

		fmt.Println()
		fmt.Println("Project created successfully!")
		fmt.Println()
		fmt.Println("Next steps:")
		fmt.Printf("  cd %s\n", outputDir)
		fmt.Println("  pnpm install  # or: pip install -e .")
		fmt.Println("  cogctl dev    # Start development server")

		return nil
	},
}

func createProjectStructure(outputDir, projectName, template string) error {
	// Create common directories
	dirs := []string{
		"src",
		"tests",
		"configs",
	}

	for _, dir := range dirs {
		if err := os.MkdirAll(filepath.Join(outputDir, dir), 0755); err != nil {
			return err
		}
	}

	// Create README.md
	readmeContent := fmt.Sprintf(`# %s

An o9nn project using the %s template.

## Getting Started

1. Install dependencies:
   `+"`"+`bash
   pnpm install
   # or
   pip install -e .
   `+"`"+`

2. Start development:
   `+"`"+`bash
   cogctl dev
   `+"`"+`

## Project Structure

`+"`"+"`"+"`"+`
%s/
├── src/           # Source code
├── tests/         # Test files
├── configs/       # Configuration files
└── README.md      # This file
`+"`"+"`"+"`"+`

## License

MIT
`, projectName, template, projectName)

	if err := os.WriteFile(filepath.Join(outputDir, "README.md"), []byte(readmeContent), 0644); err != nil {
		return err
	}

	// Create config file
	configContent := fmt.Sprintf(`# o9nn Configuration
# Project: %s
# Template: %s

project:
  name: %s
  version: 0.1.0

# Model configuration
model:
  path: ./models
  default: null

# Server configuration
server:
  port: 8080
  host: localhost

# Logging configuration
logging:
  level: info
  format: json
`, projectName, template, projectName)

	if err := os.WriteFile(filepath.Join(outputDir, "o9nn.config.yaml"), []byte(configContent), 0644); err != nil {
		return err
	}

	// Create template-specific files
	switch template {
	case "agent":
		return createAgentTemplate(outputDir, projectName)
	case "inference":
		return createInferenceTemplate(outputDir, projectName)
	default:
		return createMinimalTemplate(outputDir, projectName)
	}
}

func createAgentTemplate(outputDir, projectName string) error {
	// Create agent source file
	agentContent := `"""
Agent implementation.
"""

from o9nn_sdk import AgentBuilder, create_tool, create_sdk

def create_agent():
    """Create and configure the agent."""
    sdk = create_sdk()
    
    # Define tools
    search_tool = create_tool(
        name="search",
        description="Search for information",
        execute=lambda query: f"Results for: {query}",
    )
    
    # Build agent
    agent = (
        AgentBuilder("my-agent")
        .with_model({"name": "llama-2-7b-chat", "backend": "llama.cpp"})
        .add_tool(search_tool)
        .build()
    )
    
    return agent

if __name__ == "__main__":
    agent = create_agent()
    print(f"Agent created: {agent}")
`
	return os.WriteFile(filepath.Join(outputDir, "src", "agent.py"), []byte(agentContent), 0644)
}

func createInferenceTemplate(outputDir, projectName string) error {
	// Create inference server source file
	serverContent := `"""
Inference server implementation.
"""

from o9nn_sdk import create_sdk, ModelManager

def main():
    """Start the inference server."""
    sdk = create_sdk()
    
    print("Starting inference server...")
    print("  Model: llama-2-7b-chat")
    print("  Port: 8080")
    
    # TODO: Implement actual server logic
    print("Server ready!")

if __name__ == "__main__":
    main()
`
	return os.WriteFile(filepath.Join(outputDir, "src", "server.py"), []byte(serverContent), 0644)
}

func createMinimalTemplate(outputDir, projectName string) error {
	// Create minimal main file
	mainContent := `"""
Main entry point.
"""

def main():
    """Main function."""
    print("Hello from o9nn!")

if __name__ == "__main__":
    main()
`
	return os.WriteFile(filepath.Join(outputDir, "src", "main.py"), []byte(mainContent), 0644)
}

func init() {
	initCmd.Flags().StringP("template", "t", "minimal", "project template (agent, inference, training, plugin, minimal)")
	initCmd.Flags().StringP("output", "o", "", "output directory (default: project name)")
}
