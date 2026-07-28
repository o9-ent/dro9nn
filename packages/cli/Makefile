# o9nn CLI Makefile
# Build and development commands for cogctl

.PHONY: all build install test lint clean

# Build info
VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
COMMIT ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
DATE ?= $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")

# Go build flags
LDFLAGS = -ldflags "-s -w \
	-X 'github.com/o9nn/dro9nn/packages/cli/internal/cmd.version=$(VERSION)' \
	-X 'github.com/o9nn/dro9nn/packages/cli/internal/cmd.commit=$(COMMIT)' \
	-X 'github.com/o9nn/dro9nn/packages/cli/internal/cmd.date=$(DATE)'"

# Binary name
BINARY = cogctl

# Output directory
OUT_DIR = ./bin

all: build

# Build the CLI
build:
	@echo "Building $(BINARY)..."
	@mkdir -p $(OUT_DIR)
	go build $(LDFLAGS) -o $(OUT_DIR)/$(BINARY) ./cmd/cogctl

# Install to $GOPATH/bin
install:
	@echo "Installing $(BINARY)..."
	go install $(LDFLAGS) ./cmd/cogctl

# Run tests
test:
	@echo "Running tests..."
	go test -v -race ./...

# Lint the code
lint:
	@echo "Running linter..."
	golangci-lint run ./...

# Clean build artifacts
clean:
	@echo "Cleaning..."
	rm -rf $(OUT_DIR)
	go clean

# Cross-compile for all platforms
cross-compile:
	@echo "Cross-compiling for multiple platforms..."
	@mkdir -p $(OUT_DIR)
	GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o $(OUT_DIR)/$(BINARY)-linux-amd64 ./cmd/cogctl
	GOOS=linux GOARCH=arm64 go build $(LDFLAGS) -o $(OUT_DIR)/$(BINARY)-linux-arm64 ./cmd/cogctl
	GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o $(OUT_DIR)/$(BINARY)-darwin-amd64 ./cmd/cogctl
	GOOS=darwin GOARCH=arm64 go build $(LDFLAGS) -o $(OUT_DIR)/$(BINARY)-darwin-arm64 ./cmd/cogctl
	GOOS=windows GOARCH=amd64 go build $(LDFLAGS) -o $(OUT_DIR)/$(BINARY)-windows-amd64.exe ./cmd/cogctl

# Development - build and run
dev: build
	$(OUT_DIR)/$(BINARY) --help

# Generate completions
completions: build
	@mkdir -p $(OUT_DIR)/completions
	$(OUT_DIR)/$(BINARY) completion bash > $(OUT_DIR)/completions/$(BINARY).bash
	$(OUT_DIR)/$(BINARY) completion zsh > $(OUT_DIR)/completions/$(BINARY).zsh
	$(OUT_DIR)/$(BINARY) completion fish > $(OUT_DIR)/completions/$(BINARY).fish
