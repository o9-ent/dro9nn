// Package cmd provides the REPL command.
package cmd

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/spf13/cobra"
)

var replCmd = &cobra.Command{
	Use:   "repl",
	Short: "Start interactive REPL",
	Long: `Start an interactive Read-Eval-Print Loop for model interaction.

The REPL provides an interactive environment for:
  - Direct model interaction
  - Testing prompts
  - Exploring model capabilities

Commands within REPL:
  /help       Show help
  /model      Switch model
  /clear      Clear conversation history
  /history    Show conversation history
  /system     Set system prompt
  /exit       Exit REPL

Examples:
  cogctl repl
  cogctl repl --model llama-2-7b-chat
  cogctl repl --system "You are a helpful assistant."`,
	RunE: func(cmd *cobra.Command, args []string) error {
		model, _ := cmd.Flags().GetString("model")
		systemPrompt, _ := cmd.Flags().GetString("system")
		temperature, _ := cmd.Flags().GetFloat64("temperature")
		maxTokens, _ := cmd.Flags().GetInt("max-tokens")

		return runREPL(model, systemPrompt, temperature, maxTokens)
	},
}

type replState struct {
	model        string
	systemPrompt string
	temperature  float64
	maxTokens    int
	history      []message
}

type message struct {
	role    string
	content string
}

func runREPL(model, systemPrompt string, temperature float64, maxTokens int) error {
	if model == "" {
		model = "llama-2-7b-chat"
	}

	state := &replState{
		model:        model,
		systemPrompt: systemPrompt,
		temperature:  temperature,
		maxTokens:    maxTokens,
		history:      make([]message, 0),
	}

	fmt.Println("o9nn Cognitive REPL")
	fmt.Println("===================")
	fmt.Printf("Model: %s\n", state.model)
	if state.systemPrompt != "" {
		fmt.Printf("System: %s\n", state.systemPrompt)
	}
	fmt.Println()
	fmt.Println("Type /help for commands, /exit to quit")
	fmt.Println()

	reader := bufio.NewReader(os.Stdin)

	for {
		fmt.Print(">>> ")
		input, err := reader.ReadString('\n')
		if err != nil {
			return err
		}

		input = strings.TrimSpace(input)
		if input == "" {
			continue
		}

		// Handle commands
		if strings.HasPrefix(input, "/") {
			if shouldExit := handleREPLCommand(state, input); shouldExit {
				return nil
			}
			continue
		}

		// Process input
		if err := processREPLInput(state, input); err != nil {
			fmt.Printf("Error: %v\n", err)
		}
	}
}

func handleREPLCommand(state *replState, input string) bool {
	parts := strings.Fields(input)
	command := parts[0]

	switch command {
	case "/exit", "/quit", "/q":
		fmt.Println("Goodbye!")
		return true

	case "/help", "/h":
		printREPLHelp()

	case "/model":
		if len(parts) > 1 {
			state.model = parts[1]
			fmt.Printf("Model changed to: %s\n", state.model)
		} else {
			fmt.Printf("Current model: %s\n", state.model)
		}

	case "/clear":
		state.history = make([]message, 0)
		fmt.Println("Conversation history cleared.")

	case "/history":
		if len(state.history) == 0 {
			fmt.Println("No conversation history.")
		} else {
			fmt.Println("Conversation history:")
			for i, msg := range state.history {
				fmt.Printf("  [%d] %s: %s\n", i+1, msg.role, truncateString(msg.content, 50))
			}
		}

	case "/system":
		if len(parts) > 1 {
			state.systemPrompt = strings.Join(parts[1:], " ")
			fmt.Printf("System prompt set to: %s\n", state.systemPrompt)
		} else {
			if state.systemPrompt == "" {
				fmt.Println("No system prompt set.")
			} else {
				fmt.Printf("Current system prompt: %s\n", state.systemPrompt)
			}
		}

	case "/temperature":
		if len(parts) > 1 {
			var temp float64
			if _, err := fmt.Sscanf(parts[1], "%f", &temp); err == nil {
				state.temperature = temp
				fmt.Printf("Temperature set to: %.2f\n", state.temperature)
			} else {
				fmt.Println("Invalid temperature value.")
			}
		} else {
			fmt.Printf("Current temperature: %.2f\n", state.temperature)
		}

	case "/tokens":
		if len(parts) > 1 {
			var tokens int
			if _, err := fmt.Sscanf(parts[1], "%d", &tokens); err == nil {
				state.maxTokens = tokens
				fmt.Printf("Max tokens set to: %d\n", state.maxTokens)
			} else {
				fmt.Println("Invalid token value.")
			}
		} else {
			fmt.Printf("Current max tokens: %d\n", state.maxTokens)
		}

	default:
		fmt.Printf("Unknown command: %s (type /help for commands)\n", command)
	}

	return false
}

func printREPLHelp() {
	fmt.Println(`
REPL Commands:
  /help, /h            Show this help message
  /exit, /quit, /q     Exit the REPL
  /model [name]        Show or set the current model
  /clear               Clear conversation history
  /history             Show conversation history
  /system [prompt]     Show or set system prompt
  /temperature [value] Show or set temperature (0.0-2.0)
  /tokens [count]      Show or set max tokens

Tips:
  - Multi-line input: end a line with \ to continue
  - Use Ctrl+C to cancel current input
  - Use Ctrl+D to exit
`)
}

func processREPLInput(state *replState, input string) error {
	// Add user message to history
	state.history = append(state.history, message{
		role:    "user",
		content: input,
	})

	// TODO: Implement actual API call to model
	// For now, simulate a response
	fmt.Println()
	response := simulateResponse(state, input)
	fmt.Println(response)
	fmt.Println()

	// Add assistant message to history
	state.history = append(state.history, message{
		role:    "assistant",
		content: response,
	})

	return nil
}

func simulateResponse(state *replState, input string) string {
	// This is a placeholder - in production, this would call the actual API
	return fmt.Sprintf("[%s] Response to: %s\n(Note: This is a simulated response. Connect to the o9nn API for actual model interaction.)", state.model, truncateString(input, 30))
}

func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}

func init() {
	rootCmd.AddCommand(replCmd)

	replCmd.Flags().StringP("model", "m", "", "model to use (default: llama-2-7b-chat)")
	replCmd.Flags().StringP("system", "s", "", "system prompt")
	replCmd.Flags().Float64P("temperature", "t", 0.7, "sampling temperature")
	replCmd.Flags().IntP("max-tokens", "n", 1024, "maximum tokens to generate")
}
