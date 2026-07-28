# GNN Demo

This example demonstrates Graph Neural Network capabilities of the o9nn platform.

## Overview

Graph Neural Networks (GNNs) are neural networks designed to work with graph-structured data. The o9nn platform supports various GNN architectures including:

- **GCN** (Graph Convolutional Networks)
- **GAT** (Graph Attention Networks)
- **GraphSAGE** (Sample and Aggregate)
- **GIN** (Graph Isomorphism Network)
- **MPNN** (Message Passing Neural Networks)

## Node Classification

```python
import asyncio
from o9nn_sdk import create_sdk, ModelManager
from o9nn_sdk.types import GNNConfig, Backend, Device

async def node_classification():
    client = create_sdk(base_url="http://localhost:8080")
    
    async with client:
        models = ModelManager(client)
        
        # Configure GNN model
        gnn_config = GNNConfig(
            type="gat",
            num_layers=3,
            hidden_dim=256,
            num_heads=8,
            dropout=0.1,
        )
        
        # Load model
        model = await models.load({
            "name": "node-classifier",
            "backend": Backend.PYTORCH,
            "device": Device.CUDA,
            "options": gnn_config.model_dump(),
        })
        
        # Prepare graph data
        graph_data = {
            "nodes": [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6], [0.7, 0.8, 0.9]],
            "edges": [[0, 1], [1, 2], [2, 0]],
        }
        
        # Run inference
        result = await models.infer(model.id, graph_data)
        print(f"Node predictions: {result.output}")

asyncio.run(node_classification())
```

## Graph Classification

```python
import asyncio
from o9nn_sdk import create_sdk, ModelManager
from o9nn_sdk.types import GNNConfig

async def graph_classification():
    client = create_sdk(base_url="http://localhost:8080")
    
    async with client:
        models = ModelManager(client)
        
        # Configure GIN for graph classification
        gnn_config = GNNConfig(
            type="gin",
            num_layers=5,
            hidden_dim=128,
        )
        
        # Load model
        model = await models.load({
            "name": "graph-classifier",
            "backend": "pytorch",
            "device": "cuda",
            "options": gnn_config.model_dump(),
        })
        
        # Prepare batch of graphs
        graphs = [
            {
                "nodes": [[1, 0], [0, 1], [1, 1]],
                "edges": [[0, 1], [1, 2]],
            },
            {
                "nodes": [[0, 1], [1, 0], [1, 1], [0, 0]],
                "edges": [[0, 1], [1, 2], [2, 3], [3, 0]],
            },
        ]
        
        result = await models.infer(model.id, {"graphs": graphs})
        print(f"Graph classifications: {result.output}")

asyncio.run(graph_classification())
```

## Link Prediction

```python
import asyncio
from o9nn_sdk import create_sdk, ModelManager
from o9nn_sdk.types import GNNConfig

async def link_prediction():
    client = create_sdk(base_url="http://localhost:8080")
    
    async with client:
        models = ModelManager(client)
        
        # Configure GraphSAGE for link prediction
        gnn_config = GNNConfig(
            type="graphsage",
            num_layers=2,
            hidden_dim=64,
            aggregator="mean",
        )
        
        model = await models.load({
            "name": "link-predictor",
            "backend": "pytorch",
            "device": "cpu",
            "options": gnn_config.model_dump(),
        })
        
        # Graph with node features
        graph = {
            "nodes": [[0.5, 0.5], [0.1, 0.9], [0.9, 0.1], [0.5, 0.5]],
            "edges": [[0, 1], [1, 2], [2, 3]],
            "predict_edges": [[0, 2], [0, 3], [1, 3]],
        }
        
        result = await models.infer(model.id, graph)
        print(f"Link probabilities: {result.output}")

asyncio.run(link_prediction())
```

## Using with DGL

```python
import dgl
import torch
import asyncio
from o9nn_sdk import create_sdk, ModelManager

def create_dgl_graph():
    # Create a simple graph
    src = torch.tensor([0, 1, 2, 3])
    dst = torch.tensor([1, 2, 3, 0])
    g = dgl.graph((src, dst))
    
    # Add node features
    g.ndata['feat'] = torch.randn(4, 16)
    
    return g

async def inference_with_dgl():
    client = create_sdk(base_url="http://localhost:8080")
    
    async with client:
        models = ModelManager(client)
        
        # Create DGL graph
        g = create_dgl_graph()
        
        # Convert to serializable format
        graph_data = {
            "nodes": g.ndata['feat'].tolist(),
            "edges": torch.stack(g.edges()).T.tolist(),
        }
        
        result = await models.infer("gnn-model", graph_data)
        
        # Convert back to tensor
        output = torch.tensor(result.output)
        print(f"Output shape: {output.shape}")

asyncio.run(inference_with_dgl())
```

## Supported Features

| Feature | Status |
|---------|--------|
| Node Classification | ✅ |
| Graph Classification | ✅ |
| Link Prediction | ✅ |
| Graph Regression | ✅ |
| Node Embedding | ✅ |
| Heterogeneous Graphs | 🔄 Coming Soon |
| Temporal Graphs | 🔄 Coming Soon |
