# @o9nn/gnn

Graph Neural Network implementations for the o9nn ecosystem.

## Features

- GCN (Graph Convolutional Network)
- GAT (Graph Attention Network)
- GraphSAGE
- GIN (Graph Isomorphism Network)
- MPNN (Message Passing Neural Network)

## Installation

```bash
pip install o9nn-gnn
```

## Usage

```python
from o9nn.gnn import GCN, GraphDataLoader
import torch

# Create model
model = GCN(
    in_channels=16,
    hidden_channels=32,
    out_channels=7,
    num_layers=2
)

# Load graph data
loader = GraphDataLoader(dataset, batch_size=32)

# Train
for batch in loader:
    out = model(batch.x, batch.edge_index)
```

## Supported Backends

- DGL
- PyTorch Geometric
- NetworkX (for preprocessing)

## License

MIT © o9nn Organization
