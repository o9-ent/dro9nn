/**
 * Tests for @o9nn/gnn
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  GraphData,
  GraphUtils,
  GCNLayer,
  GATLayer,
  GraphSAGELayer,
  GNNModel,
  createGCN,
  createGAT,
  createGraphSAGE,
  EdgeIndex,
} from '../src';
import { TensorFactory } from '@o9nn/ml-core';

describe('GraphUtils', () => {
  const factory = new TensorFactory();

  describe('createGraph', () => {
    it('should create graph from node features and edges', () => {
      const nodeFeatures = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
      const edges: [number, number][] = [
        [0, 1],
        [1, 0],
        [1, 2],
        [2, 1],
      ];

      const graph = GraphUtils.createGraph(nodeFeatures, edges);

      expect(graph.numNodes).toBe(3);
      expect(graph.numEdges).toBe(4);
      expect(graph.x.shape).toEqual([3, 3]);
      expect(graph.edgeIndex[0]).toEqual([0, 1, 1, 2]);
      expect(graph.edgeIndex[1]).toEqual([1, 0, 2, 1]);
    });

    it('should create graph with labels', () => {
      const nodeFeatures = [
        [1, 0],
        [0, 1],
      ];
      const edges: [number, number][] = [[0, 1]];
      const labels = [0, 1];

      const graph = GraphUtils.createGraph(nodeFeatures, edges, labels);

      expect(graph.y).toBeDefined();
      expect(graph.y!.flatten()).toEqual([0, 1]);
    });

    it('should create graph with edge weights', () => {
      const nodeFeatures = [
        [1, 0],
        [0, 1],
      ];
      const edges: [number, number][] = [
        [0, 1],
        [1, 0],
      ];
      const weights = [0.5, 1.0];

      const graph = GraphUtils.createGraph(nodeFeatures, edges, undefined, weights);

      expect(graph.edgeAttr).toBeDefined();
      expect(graph.edgeAttr!.flatten()).toEqual([0.5, 1.0]);
    });
  });

  describe('toAdjacencyMatrix', () => {
    it('should convert edge index to adjacency matrix', () => {
      const edgeIndex: EdgeIndex = [
        [0, 1, 1],
        [1, 0, 2],
      ];
      const numNodes = 3;

      const adj = GraphUtils.toAdjacencyMatrix(edgeIndex, numNodes);

      expect(adj.shape).toEqual([3, 3]);
      const data = adj.toArray() as number[][];
      expect(data[0][1]).toBe(1);
      expect(data[1][0]).toBe(1);
      expect(data[1][2]).toBe(1);
      expect(data[0][0]).toBe(0);
      expect(data[2][2]).toBe(0);
    });
  });

  describe('toEdgeIndex', () => {
    it('should convert adjacency matrix to edge index', () => {
      const adj = factory.tensor([
        [0, 1, 0],
        [1, 0, 1],
        [0, 1, 0],
      ]);

      const edgeIndex = GraphUtils.toEdgeIndex(adj);

      expect(edgeIndex[0]).toEqual([0, 1, 1, 2]);
      expect(edgeIndex[1]).toEqual([1, 0, 2, 1]);
    });
  });

  describe('addSelfLoops', () => {
    it('should add self-loops to edge index', () => {
      const edgeIndex: EdgeIndex = [[0, 1], [1, 0]];
      const numNodes = 3;

      const withLoops = GraphUtils.addSelfLoops(edgeIndex, numNodes);

      expect(withLoops[0]).toEqual([0, 1, 0, 1, 2]);
      expect(withLoops[1]).toEqual([1, 0, 0, 1, 2]);
    });
  });

  describe('computeDegrees', () => {
    it('should compute node in-degrees', () => {
      const edgeIndex: EdgeIndex = [
        [0, 1, 1, 2],
        [1, 0, 2, 1],
      ];
      const numNodes = 3;

      const degrees = GraphUtils.computeDegrees(edgeIndex, numNodes);

      expect(degrees.flatten()).toEqual([1, 2, 1]);
    });
  });

  describe('normalizeAdjacency', () => {
    it('should compute symmetric normalized adjacency', () => {
      const edgeIndex: EdgeIndex = [
        [0, 1],
        [1, 0],
      ];
      const numNodes = 2;

      const normAdj = GraphUtils.normalizeAdjacency(edgeIndex, numNodes);

      expect(normAdj.shape).toEqual([2, 2]);
      const data = normAdj.toArray() as number[][];
      // D^(-1/2) * A * D^(-1/2) where D = [1, 1]
      // So normAdj should be the same as adj since all degrees are 1
      expect(data[0][1]).toBe(1);
      expect(data[1][0]).toBe(1);
    });
  });

  describe('batchGraphs', () => {
    it('should batch multiple graphs', () => {
      const graph1 = GraphUtils.createGraph(
        [
          [1, 0],
          [0, 1],
        ],
        [[0, 1]],
        [0, 1]
      );
      const graph2 = GraphUtils.createGraph(
        [
          [1, 1],
          [0, 0],
          [1, 0],
        ],
        [
          [0, 1],
          [1, 2],
        ],
        [0, 0, 1]
      );

      const batched = GraphUtils.batchGraphs([graph1, graph2]);

      expect(batched.numGraphs).toBe(2);
      expect(batched.numNodes).toBe(5);
      expect(batched.numEdges).toBe(3);
      expect(batched.ptr).toEqual([0, 2, 5]);
      expect(batched.batch).toEqual([0, 0, 1, 1, 1]);
      // Edge indices should be offset
      expect(batched.edgeIndex[0]).toEqual([0, 2, 3]);
      expect(batched.edgeIndex[1]).toEqual([1, 3, 4]);
    });

    it('should throw error for empty graph list', () => {
      expect(() => GraphUtils.batchGraphs([])).toThrow('Cannot batch empty graph list');
    });
  });
});

describe('GCNLayer', () => {
  it('should create layer with correct dimensions', () => {
    const layer = new GCNLayer(16, 32);

    expect(layer.type).toBe('gcn');
    const params = layer.parameters();
    expect(params.length).toBe(2); // weight + bias
    expect(params[0].data.shape).toEqual([16, 32]);
    expect(params[1].data.shape).toEqual([32]);
  });

  it('should forward pass correctly', () => {
    const layer = new GCNLayer(3, 2);
    const graph = GraphUtils.createGraph(
      [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      [
        [0, 1],
        [1, 0],
        [1, 2],
        [2, 1],
      ]
    );

    const output = layer.forward(graph.x, graph.edgeIndex);

    expect(output.shape).toEqual([3, 2]);
  });

  it('should create layer without bias', () => {
    const layer = new GCNLayer(16, 32, false);

    const params = layer.parameters();
    expect(params.length).toBe(1); // only weight
  });
});

describe('GATLayer', () => {
  it('should create layer with attention heads', () => {
    const layer = new GATLayer(16, 32, 4);

    expect(layer.type).toBe('gat');
    const params = layer.parameters();
    expect(params.length).toBe(4); // weightSrc, weightTgt, attention, bias
  });

  it('should forward pass correctly', () => {
    const layer = new GATLayer(3, 4, 2);
    const graph = GraphUtils.createGraph(
      [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      [
        [0, 1],
        [1, 0],
        [1, 2],
        [2, 1],
      ]
    );

    const output = layer.forward(graph.x, graph.edgeIndex);

    expect(output.shape).toEqual([3, 4]);
  });
});

describe('GraphSAGELayer', () => {
  it('should create layer with aggregator', () => {
    const layer = new GraphSAGELayer(16, 32, 'mean');

    expect(layer.type).toBe('graphsage');
    expect(layer.config.aggregator).toBe('mean');
  });

  it('should forward pass correctly', () => {
    const layer = new GraphSAGELayer(3, 2, 'sum');
    const graph = GraphUtils.createGraph(
      [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      [
        [0, 1],
        [1, 0],
        [1, 2],
        [2, 1],
      ]
    );

    const output = layer.forward(graph.x, graph.edgeIndex);

    expect(output.shape).toEqual([3, 2]);
  });

  it('should support max aggregation', () => {
    const layer = new GraphSAGELayer(3, 2, 'max');
    const graph = GraphUtils.createGraph(
      [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      [
        [0, 1],
        [1, 0],
      ]
    );

    const output = layer.forward(graph.x, graph.edgeIndex);

    expect(output.shape).toEqual([3, 2]);
  });
});

describe('GNNModel', () => {
  it('should stack multiple GNN layers', () => {
    const model = new GNNModel([
      new GCNLayer(16, 32),
      new GCNLayer(32, 16),
    ]);

    const params = model.parameters();
    expect(params.length).toBe(4); // 2 layers * 2 params
  });

  it('should forward pass through all layers', () => {
    const model = new GNNModel(
      [new GCNLayer(3, 4), new GCNLayer(4, 2)],
      { activation: 'relu' }
    );

    const graph = GraphUtils.createGraph(
      [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      [
        [0, 1],
        [1, 0],
        [1, 2],
        [2, 1],
      ]
    );

    const output = model.forward(graph);

    expect(output.shape).toEqual([3, 2]);
  });

  it('should apply dropout during training', () => {
    const model = new GNNModel(
      [new GCNLayer(3, 4), new GCNLayer(4, 2)],
      { dropout: 0.5 }
    );

    const graph = GraphUtils.createGraph(
      [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      [
        [0, 1],
        [1, 0],
      ]
    );

    // Just check it runs without error
    const output = model.forward(graph, true);
    expect(output.shape).toEqual([3, 2]);
  });
});

describe('Model Factories', () => {
  describe('createGCN', () => {
    it('should create GCN with default settings', () => {
      const model = createGCN(16, 32, 7);

      expect(model.parameters().length).toBe(4);
    });

    it('should create single layer GCN', () => {
      const model = createGCN(16, 32, 7, 1);

      expect(model.parameters().length).toBe(2);
    });

    it('should create multi-layer GCN', () => {
      const model = createGCN(16, 32, 7, 3);

      expect(model.parameters().length).toBe(6);
    });
  });

  describe('createGAT', () => {
    it('should create GAT with default settings', () => {
      const model = createGAT(16, 32, 7);

      expect(model.parameters().length).toBeGreaterThan(0);
    });

    it('should create single layer GAT', () => {
      const model = createGAT(16, 32, 7, 1);

      const params = model.parameters();
      expect(params.length).toBe(4); // weightSrc, weightTgt, attention, bias
    });
  });

  describe('createGraphSAGE', () => {
    it('should create GraphSAGE with default settings', () => {
      const model = createGraphSAGE(16, 32, 7);

      expect(model.parameters().length).toBe(6);
    });

    it('should create GraphSAGE with max aggregator', () => {
      const model = createGraphSAGE(16, 32, 7, 2, 'max');

      expect(model.parameters().length).toBe(6);
    });
  });
});

describe('End-to-end node classification', () => {
  it('should perform forward pass for node classification', () => {
    // Simple Karate Club-like graph
    const graph = GraphUtils.createGraph(
      [
        [1, 0, 0, 1],
        [0, 1, 0, 1],
        [0, 0, 1, 1],
        [1, 1, 0, 0],
      ],
      [
        [0, 1],
        [1, 0],
        [1, 2],
        [2, 1],
        [2, 3],
        [3, 2],
        [3, 0],
        [0, 3],
      ],
      [0, 0, 1, 1]
    );

    const model = createGCN(4, 8, 2, 2, 0);

    const output = model.forward(graph);

    expect(output.shape).toEqual([4, 2]);
    // Check that output contains valid numbers
    const data = output.flatten();
    for (const val of data) {
      expect(Number.isFinite(val)).toBe(true);
    }
  });

  it('should perform forward pass for graph classification', () => {
    const graph1 = GraphUtils.createGraph(
      [
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      [
        [0, 1],
        [1, 2],
      ],
      [0, 0, 0]
    );
    const graph2 = GraphUtils.createGraph(
      [[1, 0], [0, 1]],
      [[0, 1]],
      [1, 1]
    );

    const batched = GraphUtils.batchGraphs([graph1, graph2]);
    const model = createGCN(2, 4, 2, 2, 0);

    const output = model.forward(batched);

    expect(output.shape).toEqual([5, 2]);
  });
});
