#!/usr/bin/env bash
# o9nn Monorepo - Clean Build Artifacts
# Phase 1: Foundation & Consolidation

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Change to repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

echo ""
echo "=================================="
echo "  o9nn Monorepo Clean"
echo "=================================="
echo ""

# Clean Turbo cache
log_info "Cleaning Turbo cache..."
rm -rf .turbo
rm -rf node_modules/.cache

# Clean Node.js build artifacts
log_info "Cleaning Node.js build artifacts..."
find packages -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find apps -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find packages -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true

# Clean Go build artifacts
log_info "Cleaning Go build artifacts..."
go clean -cache 2>/dev/null || true

# Clean Python build artifacts
log_info "Cleaning Python build artifacts..."
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true
find . -name "*.pyo" -delete 2>/dev/null || true
find . -name ".pytest_cache" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.egg-info" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".mypy_cache" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".ruff_cache" -type d -exec rm -rf {} + 2>/dev/null || true

# Clean coverage reports
log_info "Cleaning coverage reports..."
find . -name "coverage" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "coverage.xml" -delete 2>/dev/null || true
find . -name "coverage.out" -delete 2>/dev/null || true

# Clean test artifacts
log_info "Cleaning test artifacts..."
find . -name ".vitest" -type d -exec rm -rf {} + 2>/dev/null || true

# Optionally clean node_modules
if [ "${CLEAN_MODULES:-false}" = "true" ]; then
    log_info "Cleaning node_modules..."
    find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
fi

echo ""
log_success "Clean complete!"
echo ""
echo "Run 'pnpm install' to reinstall dependencies"
echo ""
