# Contributing to o9nn

Thank you for your interest in contributing to the o9nn monorepo! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Release Process](#release-process)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- Python >= 3.10
- Go >= 1.22
- Git

### Repository Structure

```
dro9nn/
├── packages/           # Shared packages
│   ├── core/           # Core utilities
│   ├── ml/             # ML framework integrations
│   ├── llm/            # LLM infrastructure
│   ├── agents/         # Agent systems
│   ├── gnn/            # Graph Neural Networks
│   ├── esn/            # Echo State Networks
│   ├── sdk/            # Client SDKs
│   └── cli/            # CLI tools
├── apps/               # Applications
├── infra/              # Infrastructure configs
├── docs/               # Documentation
└── tools/              # Development tools
```

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/o9nn/dro9nn.git
   cd dro9nn
   ```

2. **Install dependencies**
   ```bash
   # Node.js dependencies
   pnpm install

   # Python dependencies
   pip install -e ".[dev]"

   # Go dependencies
   go work sync
   ```

3. **Build all packages**
   ```bash
   pnpm turbo build
   ```

4. **Run tests**
   ```bash
   pnpm turbo test
   ```

## Making Changes

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or modifications
- `chore/` - Maintenance tasks

Example: `feature/add-gnn-attention-layer`

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

Examples:
```
feat(ml): add PyTorch lightning integration
fix(core): resolve memory leak in tensor operations
docs(readme): update installation instructions
```

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make your changes**
   - Follow the coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Run quality checks**
   ```bash
   pnpm turbo lint
   pnpm turbo typecheck
   pnpm turbo test
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature
   ```
   Then create a Pull Request on GitHub.

5. **PR Requirements**
   - Clear description of changes
   - All CI checks passing
   - At least one approved review
   - No merge conflicts

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Document public APIs with JSDoc

### Python

- Follow PEP 8 style guide
- Use type hints
- Run Ruff for linting
- Document functions with docstrings

### Go

- Follow the official Go style guide
- Use `gofmt` for formatting
- Run `golangci-lint`
- Document exported functions

### C++

- Follow the `.clang-format` configuration
- Use modern C++ (C++17 or later)
- Document public APIs

## Testing Guidelines

### Unit Tests

- Test individual functions and components
- Aim for >80% code coverage
- Use descriptive test names

### Integration Tests

- Test component interactions
- Use real dependencies where practical
- Clean up test resources

### Running Tests

```bash
# All tests
pnpm turbo test

# Specific package
pnpm turbo test --filter=@o9nn/core

# Python tests
pytest packages/ml/

# Go tests
go test ./packages/...
```

## Documentation

- Update README.md for significant changes
- Add JSDoc/docstrings for public APIs
- Create guides for complex features
- Keep CHANGELOG.md updated

## Release Process

Releases are automated through GitHub Actions:

1. **Version Bump**
   - Update version in package.json/pyproject.toml
   - Update CHANGELOG.md

2. **Create Tag**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. **Automated Release**
   - CI builds and tests
   - Publishes to npm/PyPI
   - Creates GitHub Release

## Getting Help

- Open an issue for bugs or feature requests
- Join our Discord for discussions
- Check existing documentation

## Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to o9nn! 🎉
