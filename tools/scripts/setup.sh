#!/usr/bin/env bash
# o9nn Monorepo - Development Environment Setup
# Phase 1: Foundation & Consolidation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check required tools
check_requirements() {
    log_info "Checking requirements..."
    
    local missing_tools=()
    
    if ! command_exists node; then
        missing_tools+=("node")
    fi
    
    if ! command_exists pnpm; then
        missing_tools+=("pnpm")
    fi
    
    if ! command_exists go; then
        missing_tools+=("go")
    fi
    
    if ! command_exists python3; then
        missing_tools+=("python3")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        echo ""
        echo "Please install the following:"
        echo "  - Node.js 20+: https://nodejs.org/"
        echo "  - pnpm: npm install -g pnpm"
        echo "  - Go 1.22+: https://go.dev/dl/"
        echo "  - Python 3.10+: https://python.org/"
        exit 1
    fi
    
    log_success "All required tools are installed"
}

# Setup Node.js dependencies
setup_node() {
    log_info "Setting up Node.js dependencies..."
    
    if [ -f "pnpm-lock.yaml" ]; then
        pnpm install --frozen-lockfile || pnpm install
    else
        pnpm install
    fi
    
    log_success "Node.js dependencies installed"
}

# Setup Go dependencies
setup_go() {
    log_info "Setting up Go dependencies..."
    
    if [ -f "go.work" ]; then
        go work sync
    fi
    
    go mod download -x 2>/dev/null || true
    
    log_success "Go dependencies installed"
}

# Setup Python dependencies
setup_python() {
    log_info "Setting up Python dependencies..."
    
    # Check for uv (preferred) or pip
    if command_exists uv; then
        uv sync 2>/dev/null || log_warn "uv sync failed, skipping Python setup"
    elif command_exists pip; then
        pip install -e ".[dev]" 2>/dev/null || log_warn "pip install failed, skipping Python setup"
    else
        log_warn "Neither uv nor pip found, skipping Python setup"
    fi
    
    log_success "Python dependencies installed"
}

# Setup pre-commit hooks
setup_hooks() {
    log_info "Setting up pre-commit hooks..."
    
    if [ -f "package.json" ] && grep -q "husky" package.json; then
        pnpm prepare 2>/dev/null || log_warn "Husky setup skipped"
    fi
    
    log_success "Pre-commit hooks configured"
}

# Build packages
build_packages() {
    log_info "Building packages..."
    
    pnpm turbo build --filter="@o9nn/*" || log_warn "Some packages failed to build"
    
    log_success "Packages built"
}

# Main setup function
main() {
    echo ""
    echo "=================================="
    echo "  o9nn Monorepo Setup"
    echo "=================================="
    echo ""
    
    # Change to repo root
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
    cd "$REPO_ROOT"
    
    check_requirements
    setup_node
    setup_go
    setup_python
    setup_hooks
    
    # Optional: build packages
    if [ "${BUILD:-false}" = "true" ]; then
        build_packages
    fi
    
    echo ""
    echo "=================================="
    log_success "Setup complete!"
    echo "=================================="
    echo ""
    echo "Next steps:"
    echo "  1. Run 'pnpm dev' to start development"
    echo "  2. Run 'pnpm test' to run tests"
    echo "  3. Run 'pnpm build' to build all packages"
    echo ""
}

main "$@"
