# @o9nn/esn

Echo State Network and Reservoir Computing implementations.

## Features

- Classic Echo State Networks
- Deep ESN architectures
- Leaky integrator neurons
- Online and offline learning
- Time series prediction
- Chaotic system modeling

## Installation

```bash
pip install o9nn-esn
```

## Usage

```python
from o9nn.esn import ESN, create_reservoir

# Create ESN
esn = ESN(
    reservoir_size=1000,
    spectral_radius=0.9,
    input_scaling=0.5,
    leaking_rate=0.3
)

# Train
esn.fit(X_train, y_train)

# Predict
predictions = esn.predict(X_test)
```

## Mathematical Background

The reservoir state update:
```
x(t+1) = (1 - α)x(t) + α·tanh(W_in·u(t+1) + W·x(t))
```

Where:
- `x(t)` - reservoir state
- `u(t)` - input
- `α` - leaking rate
- `W_in` - input weight matrix
- `W` - reservoir weight matrix

## License

MIT © o9nn Organization
