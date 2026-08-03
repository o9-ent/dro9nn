# @o9nn/esn

Echo State Network and Reservoir Computing implementations in Go.

Part of Phase 2: AI/ML Platform Integration.

## Features

- Classic Echo State Networks with leaky integrator neurons
- Ridge regression training (offline learning)
- Time series prediction
- Chaotic system modeling
- Configurable reservoir parameters

## Installation

```bash
go get github.com/o9nn/dro9nn/packages/esn
```

## Usage

### Creating an ESN

```go
package main

import (
    "fmt"
    "math"
    "github.com/o9nn/dro9nn/packages/esn"
)

func main() {
    // Create configuration
    config := esn.DefaultConfig(1, 1, 500) // 1 input, 1 output, 500 reservoir neurons
    config.SpectralRadius = 0.95
    config.LeakingRate = 0.3
    config.Washout = 100

    // Create ESN
    network, err := esn.New(config)
    if err != nil {
        panic(err)
    }

    // Generate training data (sine wave prediction)
    n := 1000
    inputs := make([]*esn.Vector, n)
    targets := make([]*esn.Vector, n)
    for i := 0; i < n; i++ {
        inputs[i] = esn.NewVectorFromSlice([]float64{math.Sin(float64(i) * 0.1)})
        targets[i] = esn.NewVectorFromSlice([]float64{math.Sin(float64(i+1) * 0.1)})
    }

    // Train
    err = network.Fit(inputs, targets)
    if err != nil {
        panic(err)
    }

    // Predict
    testInput := esn.NewVectorFromSlice([]float64{math.Sin(0.0)})
    output, err := network.Predict(testInput)
    if err != nil {
        panic(err)
    }

    fmt.Printf("Prediction: %v\n", output.Data[0])
}
```

### Configuration Options

```go
config := &esn.Config{
    InputSize:          1,       // Dimension of input vectors
    OutputSize:         1,       // Dimension of output vectors
    ReservoirSize:      500,     // Number of reservoir neurons
    SpectralRadius:     0.9,     // Echo state property (< 1 for stability)
    InputScaling:       0.5,     // Scale factor for input weights
    LeakingRate:        0.3,     // Leaky integration rate (0 < α ≤ 1)
    Sparsity:           0.9,     // Sparsity of reservoir connections
    Noise:              0.0001,  // Regularization noise
    Washout:            100,     // Initial steps to discard
    RegularizationCoef: 1e-6,    // Ridge regression coefficient (λ)
    Seed:               42,      // Random seed for reproducibility
}
```

### Manual State Updates

```go
// Single step update
state := network.Update(input)

// Collect states for entire sequence
states, err := network.CollectStates(inputs)

// Reset reservoir state
network.Reset()

// Get current state
currentState := network.State()
```

### Sequence Prediction

```go
// Predict on entire sequence
outputs, err := network.PredictSequence(testInputs)
```

## Mathematical Background

The reservoir state update equation:

```
x(t+1) = (1 - α)x(t) + α·tanh(W_in·u(t+1) + W·x(t))
```

Where:
- `x(t)` - reservoir state vector
- `u(t)` - input vector
- `α` - leaking rate
- `W_in` - input weight matrix
- `W` - reservoir weight matrix (scaled to spectral radius)

The output is computed as:

```
y(t) = W_out · [x(t); u(t)]
```

Where `W_out` is trained using ridge regression:

```
W_out = (X^T X + λI)^(-1) X^T Y
```

## API Reference

### Types

- `Config` - ESN configuration parameters
- `ESN` - Echo State Network instance
- `Vector` - 1D float array
- `Matrix` - 2D float array (row-major)

### Functions

- `New(config)` - Create new ESN
- `DefaultConfig(in, out, reservoir)` - Get default configuration
- `Fit(inputs, targets)` - Train on input-output pairs
- `Predict(input)` - Generate output for single input
- `PredictSequence(inputs)` - Generate outputs for sequence
- `Update(input)` - Perform single reservoir update
- `CollectStates(inputs)` - Run reservoir and collect states
- `Reset()` - Reset reservoir state
- `State()` - Get current state copy

## License

MIT © o9nn Organization
