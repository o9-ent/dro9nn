# @o9nn/core

Core utilities and shared types for the o9nn monorepo ecosystem.

## Installation

```bash
npm install @o9nn/core
# or
pnpm add @o9nn/core
# or
yarn add @o9nn/core
```

## Usage

```typescript
import { Logger, Config, ValidationError } from '@o9nn/core';
import type { ModelConfig, InferenceOptions } from '@o9nn/core/types';

// Create a logger instance
const logger = new Logger('my-app');
logger.info('Application started');

// Load configuration
const config = Config.load({
  modelPath: './models/my-model',
  backend: 'pytorch',
});

// Use validation utilities
try {
  config.validate();
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Configuration invalid:', error.details);
  }
}
```

## Modules

### Types

Common TypeScript types used across the monorepo:

- `ModelConfig` - Configuration for ML models
- `InferenceOptions` - Options for model inference
- `TrainingConfig` - Training configuration
- `DataLoaderConfig` - Data loading configuration

### Utilities

Shared utility functions:

- `Logger` - Structured logging utility
- `Config` - Configuration management
- `Validation` - Input validation helpers
- `Timer` - Performance timing utilities

### Constants

Shared constants and enums:

- `Backend` - Supported ML backends (PyTorch, JAX, ONNX)
- `DataType` - Tensor data types
- `Device` - Compute devices (CPU, GPU, TPU)

## API Reference

See the [API documentation](https://docs.o9nn.org/packages/core) for detailed information.

## License

MIT © o9nn Organization
