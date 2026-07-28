# @o9nn/ml-torch

PyTorch integration for the o9nn ecosystem.

## Features

- PyTorch Lightning integration
- Distributed training support
- Model optimization utilities
- TorchScript export

## Installation

```bash
pip install o9nn-ml-torch
```

## Usage

```python
from o9nn.ml.torch import create_model, train

model = create_model("resnet50", pretrained=True)
trainer = train(model, train_loader, val_loader)
```

## License

MIT © o9nn Organization
