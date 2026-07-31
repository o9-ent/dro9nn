# @o9nn/gnn

Graph Neural Network Hub for the o9nn ecosystem.

## Features

- **Graph Data Structures**: Flexible graph representation with node features, edge indices, and attributes
- **GNN Layers**: GCN, GAT, GraphSAGE implementations
- **Message Passing Framework**: Extensible base for custom GNN architectures
- **Graph Operations**: Adjacency conversions, normalization, batching
- **Model Factories**: Quick creation of standard GNN architectures

## Installation

```bash
pnpm add @o9nn/gnn
```

## Usage

### Creating Graphs

```typescript
import { GraphUtils } from '@o9nn/gnn';

// Create a simple graph
const nodeFeatures = [
  [1, 0, 0],  // Node 0 features
  [0, 1, 0],  // Node 1 features
  [0, 0, 1],  // Node 2 features
];

const edges: [number, number][] = [
  [0, 1],  // Edge from node 0 to node 1
  [1, 0],  // Edge from node 1 to node 0
  [1, 2],  // Edge from node 1 to node 2
  [2, 1],  // Edge from node 2 to node 1
];

const graph = GraphUtils.createGraph(nodeFeatures, edges);
```

### Using GNN Layers

```typescript
import { GCNLayer, GATLayer, GraphSAGELayer } from '@o9nn/gnn';

// Graph Convolutional Network layer
const gcn = new GCNLayer(16, 32);  // 16 input, 32 output channels
const output = gcn.forward(graph.x, graph.edgeIndex);

// Graph Attention Network layer with 4 heads
const gat = new GATLayer(16, 32, 4);

// GraphSAGE layer with mean aggregation
const sage = new GraphSAGELayer(16, 32, 'mean');
```

### Building GNN Models

```typescript
import { createGCN, createGAT, createGraphSAGE } from '@o9nn/gnn';

// Create 2-layer GCN for node classification
const gcnModel = createGCN(
  16,   // input channels
  32,   // hidden channels
  7,    // output channels (num classes)
  2,    // number of layers
  0.5   // dropout rate
);

// Create GAT with 8 attention heads
const gatModel = createGAT(16, 32, 7, 2, 8, 0.6);

// Create GraphSAGE with max aggregation
const sageModel = createGraphSAGE(16, 32, 7, 2, 'max', 0.5);
```

### Forward Pass

```typescript
// Node classification
const nodeEmbeddings = gcnModel.forward(graph);
// nodeEmbeddings.shape = [numNodes, numClasses]

// Training mode (with dropout)
const trainingOutput = gcnModel.forward(graph, true);
```

### Graph Batching

```typescript
import { GraphUtils } from '@o9nn/gnn';

const graphs = [graph1, graph2, graph3];
const batchedGraph = GraphUtils.batchGraphs(graphs);

// Process batch
const batchOutput = model.forward(batchedGraph);
// Use batch.ptr to separate outputs per graph
```

### Graph Utilities

```typescript
import { GraphUtils } from '@o9nn/gnn';

// Convert to adjacency matrix
const adj = GraphUtils.toAdjacencyMatrix(edgeIndex, numNodes);

// Add self-loops
const withLoops = GraphUtils.addSelfLoops(edgeIndex, numNodes);

// Compute node degrees
const degrees = GraphUtils.computeDegrees(edgeIndex, numNodes);

// Symmetric normalization
const normAdj = GraphUtils.normalizeAdjacency(edgeIndex, numNodes);
```

## API Reference

### Graph Types

- `GraphData` - Main graph data container
- `BatchedGraph` - Batched graph for mini-batch training
- `EdgeIndex` - Edge list format [sources, targets]

### GNN Layers

- `GCNLayer` - Graph Convolutional Network (Kipf & Welling, 2017)
- `GATLayer` - Graph Attention Network (Veličković et al., 2018)
- `GraphSAGELayer` - GraphSAGE (Hamilton et al., 2017)

### Model Factories

- `createGCN()` - Create GCN model
- `createGAT()` - Create GAT model
- `createGraphSAGE()` - Create GraphSAGE model

### Utilities

- `GraphUtils.createGraph()` - Create graph from features and edges
- `GraphUtils.batchGraphs()` - Batch multiple graphs
- `GraphUtils.toAdjacencyMatrix()` - Convert to adjacency matrix
- `GraphUtils.addSelfLoops()` - Add self-loops
- `GraphUtils.computeDegrees()` - Compute node degrees
- `GraphUtils.normalizeAdjacency()` - Symmetric normalization

## License

MIT © o9nn Organization
