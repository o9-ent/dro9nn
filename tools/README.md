# o9nn Development Tools

This directory contains shared development tools and scripts for the o9nn monorepo.

## Structure

```
tools/
├── scripts/           # Build and development scripts
│   ├── setup.sh       # Environment setup
│   ├── clean.sh       # Clean build artifacts
│   └── benchmark.sh   # Run benchmarks
├── generators/        # Code generators
└── README.md
```

## Scripts

### Environment Setup

```bash
./tools/scripts/setup.sh
```

Sets up the complete development environment including:
- Node.js dependencies (pnpm)
- Python dependencies (uv)
- Go dependencies (go mod)
- Pre-commit hooks

### Clean Build Artifacts

```bash
./tools/scripts/clean.sh
```

Removes all build artifacts, caches, and temporary files.

### Run Benchmarks

```bash
./tools/scripts/benchmark.sh [package]
```

Runs performance benchmarks for specified packages.

## Development

### Adding New Tools

1. Create the tool script in the appropriate directory
2. Make it executable: `chmod +x tools/your-script.sh`
3. Document usage in this README
4. Add any dependencies to the root package.json or pyproject.toml

### Code Generators

The `generators/` directory contains templates for scaffolding new packages:
- `new-package`: Create a new workspace package
- `new-component`: Create a new component
- `new-test`: Generate test boilerplate

## License

MIT © o9nn Organization
