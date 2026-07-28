#!/usr/bin/env bash
# o9nn Monorepo - Run Benchmarks
# Phase 1: Foundation & Consolidation

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Change to repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

# Get package filter from arguments
PACKAGE_FILTER="${1:-}"

echo ""
echo "=================================="
echo "  o9nn Monorepo Benchmarks"
echo "=================================="
echo ""

# Create benchmark results directory
RESULTS_DIR="benchmark-results"
mkdir -p "$RESULTS_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Run Turbo benchmarks
if [ -n "$PACKAGE_FILTER" ]; then
    log_info "Running benchmarks for: $PACKAGE_FILTER"
    pnpm turbo benchmark --filter="$PACKAGE_FILTER" || log_warn "Some benchmarks failed"
else
    log_info "Running all benchmarks..."
    pnpm turbo benchmark || log_warn "Some benchmarks failed"
fi

# Run Go benchmarks
log_info "Running Go benchmarks..."
go test -bench=. -benchmem ./packages/... 2>/dev/null | tee "$RESULTS_DIR/go_bench_$TIMESTAMP.txt" || log_warn "Go benchmarks skipped"

# Run Python benchmarks
if command -v pytest &> /dev/null; then
    log_info "Running Python benchmarks..."
    pytest packages/ --benchmark-only 2>/dev/null | tee "$RESULTS_DIR/py_bench_$TIMESTAMP.txt" || log_warn "Python benchmarks skipped"
fi

echo ""
log_success "Benchmarks complete!"
echo ""
echo "Results saved to: $RESULTS_DIR/"
echo ""
