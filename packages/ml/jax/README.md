# @o9nn/ml-jax

JAX integration for the o9nn ecosystem.

## Features

- Flax neural network modules
- Optax optimizers integration
- XLA compilation
- TPU support

## Installation

```bash
pip install o9nn-ml-jax
```

## Usage

```python
from o9nn.ml.jax import create_model, train

model = create_model("transformer")
state = train(model, train_data)
```

## License

MIT © o9nn Organization
