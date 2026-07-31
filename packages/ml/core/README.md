# @o9nn/ml-core

CogML Core - Unified ML Framework Layer for the o9nn ecosystem.

Part of **Phase 2: AI/ML Platform Integration** of the o9nn monorepo development plan.

## Features

### Unified Tensor Operations
- Abstract tensor interface supporting PyTorch, JAX, and TensorFlow backends
- Common operations: arithmetic, linear algebra, reductions, activations
- Automatic differentiation support (via backend)
- Device-agnostic code (CPU, CUDA, MPS, TPU)

### Data Loading & Preprocessing
- Dataset abstraction with map/filter/shuffle operations
- Efficient DataLoader with batching and shuffling
- Common transforms: normalize, standardize, one-hot encoding
- Train/test split and k-fold cross-validation utilities

### Model Building
- Sequential and functional model APIs
- Common layers: Linear, ReLU, Sigmoid, Tanh, Softmax, Dropout
- Loss functions: MSE, CrossEntropy, BCE
- Optimizers: SGD (with momentum), Adam
- Learning rate schedulers: StepLR, CosineAnnealing

## Installation

```bash
pnpm add @o9nn/ml-core
```

## Usage

### Creating Tensors

```typescript
import { TensorFactory, Device, DataType } from '@o9nn/ml-core';

const factory = new TensorFactory();

// Create tensors
const zeros = factory.zeros([3, 4]);
const ones = factory.ones([2, 3]);
const rand = factory.rand([64, 128]);
const randn = factory.randn([32, 32]);

// Create from data
const data = factory.tensor([[1, 2, 3], [4, 5, 6]]);

// Tensor operations
const sum = data.sum();
const mean = data.mean();
const transposed = data.transpose();
const result = data.matmul(transposed);
```

### Data Loading

```typescript
import { Dataset, DataLoader, Transforms, DatasetUtils } from '@o9nn/ml-core';

// Create dataset
const data = [
  { data: [1, 2, 3], label: 0 },
  { data: [4, 5, 6], label: 1 },
  // ...
];
const dataset = new Dataset(data);

// Apply transforms
const normalized = dataset.map(sample => ({
  ...sample,
  data: Transforms.normalize()(sample.data),
}));

// Train/test split
const { train, test } = DatasetUtils.trainTestSplit(normalized, 0.2);

// Create data loader
const trainLoader = new DataLoader(train, {
  batchSize: 32,
  shuffle: true,
});

// Iterate over batches
for (const batch of trainLoader) {
  console.log(`Batch ${batch.index}: ${batch.size} samples`);
}
```

### Building Models

```typescript
import { createModel, MSELoss, Adam, Backend, Device } from '@o9nn/ml-core';

// Build a simple neural network
const model = createModel()
  .linear(784, 256)
  .relu()
  .dropout(0.2)
  .linear(256, 128)
  .relu()
  .linear(128, 10)
  .softmax()
  .build('classifier', {
    backend: Backend.PYTORCH,
    device: Device.CUDA,
  });

// Create loss and optimizer
const criterion = new MSELoss();
const optimizer = new Adam(model.parameters(), 0.001);

// Training loop
model.train();
for (const batch of trainLoader) {
  optimizer.zeroGrad();
  const output = model.forward(batch.inputs);
  const loss = criterion.compute(output, batch.targets);
  // Backward pass and optimization handled by backend
  optimizer.step();
}

// Evaluation
model.eval();
for (const batch of testLoader) {
  const output = model.forward(batch.inputs);
  // Compute metrics
}
```

### Using Transforms

```typescript
import { Transforms } from '@o9nn/ml-core';

// Individual transforms
const normalize = Transforms.normalize(0, 1);
const standardize = Transforms.standardize();
const oneHot = Transforms.oneHot(10);
const addNoise = Transforms.addNoise(0.1);

// Compose transforms
const pipeline = Transforms.compose(
  normalize,
  addNoise
);

const processed = pipeline([1, 2, 3, 4, 5]);
```

## API Reference

### Tensor Module

| Class/Function | Description |
|---------------|-------------|
| `Tensor` | In-memory tensor implementation |
| `TensorFactory` | Factory for creating tensors |
| `TensorOps` | Tensor utility operations |

### Data Module

| Class/Function | Description |
|---------------|-------------|
| `Dataset` | In-memory dataset |
| `TensorDataset` | Dataset for tensor samples |
| `DataLoader` | Batched data iteration |
| `TensorDataLoader` | DataLoader for tensors |
| `Transforms` | Common data transforms |
| `DatasetUtils` | Dataset utility functions |

### Model Module

| Class/Function | Description |
|---------------|-------------|
| `Sequential` | Sequential model container |
| `LinearLayer` | Fully connected layer |
| `ReLULayer` | ReLU activation |
| `DropoutLayer` | Dropout regularization |
| `MSELoss` | Mean squared error loss |
| `CrossEntropyLoss` | Cross entropy loss |
| `SGD` | SGD optimizer |
| `Adam` | Adam optimizer |
| `StepLRScheduler` | Step learning rate scheduler |
| `CosineAnnealingScheduler` | Cosine annealing scheduler |
| `createModel` | Model builder factory |

## Integration with Backends

While this package provides a pure TypeScript/JavaScript implementation for testing and development, the actual computation in production should use native backends:

- **PyTorch**: `@o9nn/ml-torch`
- **JAX**: `@o9nn/ml-jax`
- **ONNX Runtime**: `@o9nn/ml-onnx`

The abstract interfaces (`ITensor`, `IModel`, etc.) allow seamless switching between backends.

## License

MIT © o9nn Organization
