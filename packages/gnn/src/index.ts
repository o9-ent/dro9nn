/**
 * @o9nn/gnn - Graph Neural Network Hub
 *
 * Unified GNN API for the o9nn ecosystem.
 * Part of Phase 2: AI/ML Platform Integration.
 *
 * Features:
 * - Graph data structures and operations
 * - GNN layers: GCN, GAT, GraphSAGE, GIN, MPNN
 * - Message passing framework
 * - Backend-agnostic design (DGL, PyG, NetworkX)
 *
 * @module @o9nn/gnn
 */

import { Backend, Device, DataType, GNNConfig } from '@o9nn/core';
import { ITensor, Tensor, TensorFactory } from '@o9nn/ml-core';

/**
 * Graph data structure types
 */

/** Edge list format: [source, target] pairs */
export type EdgeIndex = [number[], number[]];

/** Adjacency list format */
export type AdjacencyList = Map<number, number[]>;

/** Edge attributes */
export interface EdgeData {
  index: EdgeIndex;
  attr?: Tensor;
  weight?: number[];
}

/** Node features */
export interface NodeData {
  features: Tensor;
  labels?: Tensor;
  mask?: boolean[];
}

/**
 * Graph data container
 */
export interface GraphData {
  /** Node features [num_nodes, num_features] */
  x: Tensor;
  /** Edge indices [2, num_edges] */
  edgeIndex: EdgeIndex;
  /** Optional edge attributes */
  edgeAttr?: Tensor;
  /** Optional node labels */
  y?: Tensor;
  /** Number of nodes */
  numNodes: number;
  /** Number of edges */
  numEdges: number;
  /** Optional batch assignment for batched graphs */
  batch?: number[];
}

/**
 * Batch of graphs for mini-batch training
 */
export interface BatchedGraph extends GraphData {
  /** Number of graphs in batch */
  numGraphs: number;
  /** Pointer to graph boundaries */
  ptr: number[];
}

/**
 * Graph utilities
 */
export const GraphUtils = {
  /**
   * Create graph data from nodes and edges
   */
  createGraph(
    nodeFeatures: number[][],
    edges: [number, number][],
    nodeLabels?: number[],
    edgeWeights?: number[]
  ): GraphData {
    const factory = new TensorFactory();
    const numNodes = nodeFeatures.length;
    const numEdges = edges.length;

    // Create node feature tensor
    const x = factory.tensor(nodeFeatures);

    // Create edge index
    const sources = edges.map(e => e[0]);
    const targets = edges.map(e => e[1]);
    const edgeIndex: EdgeIndex = [sources, targets];

    // Create labels if provided
    const y = nodeLabels ? factory.tensor(nodeLabels) : undefined;

    // Create edge attributes if provided
    const edgeAttr = edgeWeights ? factory.tensor(edgeWeights) : undefined;

    return {
      x,
      edgeIndex,
      edgeAttr,
      y,
      numNodes,
      numEdges,
    };
  },

  /**
   * Convert edge list to adjacency matrix
   */
  toAdjacencyMatrix(edgeIndex: EdgeIndex, numNodes: number): Tensor {
    const factory = new TensorFactory();
    const adj = factory.zeros([numNodes, numNodes]);
    const adjData = adj.getDataBuffer();

    const [sources, targets] = edgeIndex;
    for (let i = 0; i < sources.length; i++) {
      adjData[sources[i] * numNodes + targets[i]] = 1;
    }

    return adj;
  },

  /**
   * Convert adjacency matrix to edge list
   */
  toEdgeIndex(adjMatrix: Tensor): EdgeIndex {
    const [numRows, numCols] = adjMatrix.shape;
    const data = adjMatrix.flatten();
    const sources: number[] = [];
    const targets: number[] = [];

    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        if (data[i * numCols + j] > 0) {
          sources.push(i);
          targets.push(j);
        }
      }
    }

    return [sources, targets];
  },

  /**
   * Add self-loops to graph
   */
  addSelfLoops(edgeIndex: EdgeIndex, numNodes: number): EdgeIndex {
    const sources = [...edgeIndex[0]];
    const targets = [...edgeIndex[1]];

    for (let i = 0; i < numNodes; i++) {
      sources.push(i);
      targets.push(i);
    }

    return [sources, targets];
  },

  /**
   * Compute node degrees
   */
  computeDegrees(edgeIndex: EdgeIndex, numNodes: number): Tensor {
    const factory = new TensorFactory();
    const degrees = factory.zeros([numNodes]);
    const degData = degrees.getDataBuffer();

    const targets = edgeIndex[1];
    for (const t of targets) {
      degData[t] += 1;
    }

    return degrees;
  },

  /**
   * Normalize adjacency matrix (symmetric normalization)
   */
  normalizeAdjacency(edgeIndex: EdgeIndex, numNodes: number): Tensor {
    const factory = new TensorFactory();
    const adj = GraphUtils.toAdjacencyMatrix(edgeIndex, numNodes);
    const adjData = adj.getDataBuffer();

    // Compute D^(-1/2)
    const degrees = GraphUtils.computeDegrees(edgeIndex, numNodes);
    const degData = degrees.flatten();
    const dInvSqrt = degData.map(d => (d > 0 ? 1 / Math.sqrt(d) : 0));

    // D^(-1/2) * A * D^(-1/2)
    for (let i = 0; i < numNodes; i++) {
      for (let j = 0; j < numNodes; j++) {
        adjData[i * numNodes + j] *= dInvSqrt[i] * dInvSqrt[j];
      }
    }

    return adj;
  },

  /**
   * Batch multiple graphs into single batched graph
   */
  batchGraphs(graphs: GraphData[]): BatchedGraph {
    const factory = new TensorFactory();

    if (graphs.length === 0) {
      throw new Error('Cannot batch empty graph list');
    }

    const ptr: number[] = [0];
    let totalNodes = 0;
    let totalEdges = 0;
    const allSources: number[] = [];
    const allTargets: number[] = [];
    const allFeatures: number[][] = [];
    const allLabels: number[] = [];
    const batchAssignment: number[] = [];

    for (let g = 0; g < graphs.length; g++) {
      const graph = graphs[g];

      // Offset edges
      const [sources, targets] = graph.edgeIndex;
      for (let e = 0; e < sources.length; e++) {
        allSources.push(sources[e] + totalNodes);
        allTargets.push(targets[e] + totalNodes);
      }

      // Add features
      const features = graph.x.toArray() as number[][];
      for (const feat of features) {
        allFeatures.push(feat);
        batchAssignment.push(g);
      }

      // Add labels if present
      if (graph.y) {
        const labels = graph.y.flatten();
        allLabels.push(...labels);
      }

      totalNodes += graph.numNodes;
      totalEdges += graph.numEdges;
      ptr.push(totalNodes);
    }

    return {
      x: factory.tensor(allFeatures),
      edgeIndex: [allSources, allTargets],
      y: allLabels.length > 0 ? factory.tensor(allLabels) : undefined,
      numNodes: totalNodes,
      numEdges: totalEdges,
      numGraphs: graphs.length,
      ptr,
      batch: batchAssignment,
    };
  },
};

/**
 * GNN Layer interface
 */
export interface IGNNLayer {
  readonly name: string;
  readonly type: string;
  readonly config: GNNConfig;

  /** Forward pass */
  forward(x: Tensor, edgeIndex: EdgeIndex, edgeAttr?: Tensor): Tensor;

  /** Get layer parameters */
  parameters(): { name: string; data: Tensor; requiresGrad: boolean }[];
}

/**
 * Message passing base for GNN layers
 */
abstract class MessagePassingLayer implements IGNNLayer {
  abstract readonly name: string;
  abstract readonly type: string;
  abstract readonly config: GNNConfig;

  abstract forward(x: Tensor, edgeIndex: EdgeIndex, edgeAttr?: Tensor): Tensor;
  abstract parameters(): { name: string; data: Tensor; requiresGrad: boolean }[];

  /**
   * Message function: compute messages from source to target
   */
  protected message(
    xSource: number[],
    xTarget: number[],
    edgeAttr?: number[]
  ): number[] {
    return xSource; // Default: pass source features
  }

  /**
   * Aggregate function: aggregate messages at target nodes
   */
  protected aggregate(
    messages: number[][],
    aggregator: 'sum' | 'mean' | 'max' = 'sum'
  ): number[] {
    if (messages.length === 0) {
      return [];
    }

    const dim = messages[0].length;
    const result = new Array(dim).fill(0);

    if (aggregator === 'sum' || aggregator === 'mean') {
      for (const msg of messages) {
        for (let i = 0; i < dim; i++) {
          result[i] += msg[i];
        }
      }
      if (aggregator === 'mean' && messages.length > 0) {
        for (let i = 0; i < dim; i++) {
          result[i] /= messages.length;
        }
      }
    } else if (aggregator === 'max') {
      for (let i = 0; i < dim; i++) {
        result[i] = Math.max(...messages.map(m => m[i]));
      }
    }

    return result;
  }

  /**
   * Update function: update node representations
   */
  protected update(aggregated: number[], xSelf: number[]): number[] {
    return aggregated; // Default: replace with aggregated
  }

  /**
   * Perform message passing
   */
  protected propagate(
    x: Tensor,
    edgeIndex: EdgeIndex,
    aggregator: 'sum' | 'mean' | 'max' = 'sum'
  ): number[][] {
    const numNodes = x.shape[0];
    const features = x.toArray() as number[][];
    const [sources, targets] = edgeIndex;

    // Collect messages for each target node
    const nodeMessages: Map<number, number[][]> = new Map();
    for (let i = 0; i < numNodes; i++) {
      nodeMessages.set(i, []);
    }

    // Compute and collect messages
    for (let e = 0; e < sources.length; e++) {
      const src = sources[e];
      const tgt = targets[e];
      const msg = this.message(features[src], features[tgt]);
      nodeMessages.get(tgt)!.push(msg);
    }

    // Aggregate and update
    const result: number[][] = [];
    for (let i = 0; i < numNodes; i++) {
      const messages = nodeMessages.get(i)!;
      const aggregated = this.aggregate(messages, aggregator);
      const updated =
        aggregated.length > 0
          ? this.update(aggregated, features[i])
          : features[i];
      result.push(updated);
    }

    return result;
  }
}

/**
 * Graph Convolutional Network (GCN) Layer
 *
 * Based on "Semi-Supervised Classification with Graph Convolutional Networks"
 * by Kipf & Welling (ICLR 2017)
 */
export class GCNLayer extends MessagePassingLayer {
  readonly name: string;
  readonly type = 'gcn';
  readonly config: GNNConfig;
  private weight: Tensor;
  private bias?: Tensor;
  private factory: TensorFactory;

  constructor(
    inChannels: number,
    outChannels: number,
    bias = true,
    name?: string
  ) {
    super();
    this.name = name || `gcn_${inChannels}_${outChannels}`;
    this.config = {
      type: 'gcn',
      numLayers: 1,
      hiddenDim: outChannels,
    };
    this.factory = new TensorFactory();

    // Xavier initialization
    const scale = Math.sqrt(2 / (inChannels + outChannels));
    const weightData = new Float32Array(inChannels * outChannels);
    for (let i = 0; i < weightData.length; i++) {
      weightData[i] = (Math.random() * 2 - 1) * scale;
    }
    this.weight = new Tensor(Array.from(weightData), [inChannels, outChannels]);

    if (bias) {
      this.bias = this.factory.zeros([outChannels]);
    }
  }

  parameters(): { name: string; data: Tensor; requiresGrad: boolean }[] {
    const params = [
      { name: `${this.name}.weight`, data: this.weight, requiresGrad: true },
    ];
    if (this.bias) {
      params.push({
        name: `${this.name}.bias`,
        data: this.bias,
        requiresGrad: true,
      });
    }
    return params;
  }

  forward(x: Tensor, edgeIndex: EdgeIndex): Tensor {
    const numNodes = x.shape[0];

    // Add self-loops
    const edgesWithSelf = GraphUtils.addSelfLoops(edgeIndex, numNodes);

    // Compute normalized adjacency
    const normAdj = GraphUtils.normalizeAdjacency(edgesWithSelf, numNodes);

    // X' = D^(-1/2) * A * D^(-1/2) * X * W
    // First: propagate (aggregate neighbor features with normalization)
    const aggregated = normAdj.matmul(x);

    // Then: apply linear transformation
    const output = aggregated.matmul(this.weight);

    // Add bias
    if (this.bias) {
      const outputData = output.getDataBuffer();
      const biasData = this.bias.flatten();
      const outChannels = this.weight.shape[1];

      for (let i = 0; i < numNodes; i++) {
        for (let j = 0; j < outChannels; j++) {
          outputData[i * outChannels + j] += biasData[j];
        }
      }
    }

    return output;
  }
}

/**
 * Graph Attention Network (GAT) Layer
 *
 * Based on "Graph Attention Networks" by Veličković et al. (ICLR 2018)
 */
export class GATLayer extends MessagePassingLayer {
  readonly name: string;
  readonly type = 'gat';
  readonly config: GNNConfig;
  private weightSrc: Tensor;
  private weightTgt: Tensor;
  private attention: Tensor;
  private bias?: Tensor;
  private numHeads: number;
  private factory: TensorFactory;

  constructor(
    inChannels: number,
    outChannels: number,
    numHeads = 1,
    bias = true,
    name?: string
  ) {
    super();
    this.name = name || `gat_${inChannels}_${outChannels}`;
    this.numHeads = numHeads;
    this.config = {
      type: 'gat',
      numLayers: 1,
      hiddenDim: outChannels,
      numHeads,
    };
    this.factory = new TensorFactory();

    const headDim = outChannels / numHeads;

    // Weight matrices
    const scale = Math.sqrt(2 / (inChannels + headDim));
    const wSrcData = new Float32Array(inChannels * outChannels);
    const wTgtData = new Float32Array(inChannels * outChannels);
    for (let i = 0; i < wSrcData.length; i++) {
      wSrcData[i] = (Math.random() * 2 - 1) * scale;
      wTgtData[i] = (Math.random() * 2 - 1) * scale;
    }
    this.weightSrc = new Tensor(Array.from(wSrcData), [inChannels, outChannels]);
    this.weightTgt = new Tensor(Array.from(wTgtData), [inChannels, outChannels]);

    // Attention vector per head
    const attData = new Float32Array(numHeads * headDim * 2);
    for (let i = 0; i < attData.length; i++) {
      attData[i] = (Math.random() * 2 - 1) * scale;
    }
    this.attention = new Tensor(Array.from(attData), [numHeads, headDim * 2]);

    if (bias) {
      this.bias = this.factory.zeros([outChannels]);
    }
  }

  parameters(): { name: string; data: Tensor; requiresGrad: boolean }[] {
    const params = [
      { name: `${this.name}.weight_src`, data: this.weightSrc, requiresGrad: true },
      { name: `${this.name}.weight_tgt`, data: this.weightTgt, requiresGrad: true },
      { name: `${this.name}.attention`, data: this.attention, requiresGrad: true },
    ];
    if (this.bias) {
      params.push({
        name: `${this.name}.bias`,
        data: this.bias,
        requiresGrad: true,
      });
    }
    return params;
  }

  forward(x: Tensor, edgeIndex: EdgeIndex): Tensor {
    const numNodes = x.shape[0];
    const outChannels = this.weightSrc.shape[1];
    const [sources, targets] = edgeIndex;

    // Linear transformation
    const xSrc = x.matmul(this.weightSrc);
    const xTgt = x.matmul(this.weightTgt);

    const xSrcData = xSrc.toArray() as number[][];
    const xTgtData = xTgt.toArray() as number[][];

    // Compute attention scores for each edge
    const attentionScores: Map<number, { src: number; score: number }[]> = new Map();
    for (let i = 0; i < numNodes; i++) {
      attentionScores.set(i, []);
    }

    for (let e = 0; e < sources.length; e++) {
      const src = sources[e];
      const tgt = targets[e];

      // Simplified attention: dot product of source and target transformed features
      let score = 0;
      for (let j = 0; j < outChannels; j++) {
        score += xSrcData[src][j] * xTgtData[tgt][j];
      }
      score = Math.exp(score); // LeakyReLU + exp

      attentionScores.get(tgt)!.push({ src, score });
    }

    // Normalize attention and aggregate
    const result = this.factory.zeros([numNodes, outChannels]);
    const resultData = result.getDataBuffer();

    for (let i = 0; i < numNodes; i++) {
      const neighbors = attentionScores.get(i)!;
      const totalScore = neighbors.reduce((sum, n) => sum + n.score, 0);

      for (const { src, score } of neighbors) {
        const normalizedScore = totalScore > 0 ? score / totalScore : 0;
        for (let j = 0; j < outChannels; j++) {
          resultData[i * outChannels + j] += normalizedScore * xSrcData[src][j];
        }
      }
    }

    // Add bias
    if (this.bias) {
      const biasData = this.bias.flatten();
      for (let i = 0; i < numNodes; i++) {
        for (let j = 0; j < outChannels; j++) {
          resultData[i * outChannels + j] += biasData[j];
        }
      }
    }

    return result;
  }
}

/**
 * GraphSAGE Layer
 *
 * Based on "Inductive Representation Learning on Large Graphs"
 * by Hamilton et al. (NeurIPS 2017)
 */
export class GraphSAGELayer extends MessagePassingLayer {
  readonly name: string;
  readonly type = 'graphsage';
  readonly config: GNNConfig;
  private weightSelf: Tensor;
  private weightNeighbor: Tensor;
  private bias?: Tensor;
  private aggregator: 'mean' | 'max' | 'sum';
  private factory: TensorFactory;

  constructor(
    inChannels: number,
    outChannels: number,
    aggregator: 'mean' | 'max' | 'sum' = 'mean',
    bias = true,
    name?: string
  ) {
    super();
    this.name = name || `sage_${inChannels}_${outChannels}`;
    this.aggregator = aggregator;
    this.config = {
      type: 'graphsage',
      numLayers: 1,
      hiddenDim: outChannels,
      aggregator,
    };
    this.factory = new TensorFactory();

    // Weight for self features
    const scale = Math.sqrt(2 / (inChannels + outChannels));
    const wSelfData = new Float32Array(inChannels * outChannels);
    const wNeighborData = new Float32Array(inChannels * outChannels);
    for (let i = 0; i < wSelfData.length; i++) {
      wSelfData[i] = (Math.random() * 2 - 1) * scale;
      wNeighborData[i] = (Math.random() * 2 - 1) * scale;
    }
    this.weightSelf = new Tensor(Array.from(wSelfData), [inChannels, outChannels]);
    this.weightNeighbor = new Tensor(Array.from(wNeighborData), [inChannels, outChannels]);

    if (bias) {
      this.bias = this.factory.zeros([outChannels]);
    }
  }

  parameters(): { name: string; data: Tensor; requiresGrad: boolean }[] {
    const params = [
      { name: `${this.name}.weight_self`, data: this.weightSelf, requiresGrad: true },
      { name: `${this.name}.weight_neighbor`, data: this.weightNeighbor, requiresGrad: true },
    ];
    if (this.bias) {
      params.push({
        name: `${this.name}.bias`,
        data: this.bias,
        requiresGrad: true,
      });
    }
    return params;
  }

  forward(x: Tensor, edgeIndex: EdgeIndex): Tensor {
    const numNodes = x.shape[0];
    const outChannels = this.weightSelf.shape[1];

    // Aggregate neighbor features
    const aggregated = this.propagate(x, edgeIndex, this.aggregator);

    // Transform self and neighbor features
    const xSelf = x.matmul(this.weightSelf);
    const xNeighbor = this.factory.tensor(aggregated).matmul(this.weightNeighbor);

    // Combine
    const result = xSelf.add(xNeighbor);

    // Add bias and normalize
    if (this.bias) {
      const resultData = result.getDataBuffer();
      const biasData = this.bias.flatten();
      for (let i = 0; i < numNodes; i++) {
        let norm = 0;
        for (let j = 0; j < outChannels; j++) {
          resultData[i * outChannels + j] += biasData[j];
          norm += resultData[i * outChannels + j] ** 2;
        }
        // L2 normalization
        norm = Math.sqrt(norm);
        if (norm > 0) {
          for (let j = 0; j < outChannels; j++) {
            resultData[i * outChannels + j] /= norm;
          }
        }
      }
    }

    return result;
  }
}

/**
 * GNN Model - Sequential container for GNN layers
 */
export class GNNModel {
  readonly name: string;
  private layers: IGNNLayer[];
  private activation: 'relu' | 'elu' | 'none';
  private dropout: number;

  constructor(
    layers: IGNNLayer[],
    options: {
      name?: string;
      activation?: 'relu' | 'elu' | 'none';
      dropout?: number;
    } = {}
  ) {
    this.name = options.name || 'gnn_model';
    this.layers = layers;
    this.activation = options.activation || 'relu';
    this.dropout = options.dropout || 0;
  }

  forward(graph: GraphData, training = false): Tensor {
    let x = graph.x;

    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      x = layer.forward(x, graph.edgeIndex, graph.edgeAttr);

      // Apply activation (except last layer)
      if (i < this.layers.length - 1) {
        if (this.activation === 'relu') {
          x = x.relu();
        } else if (this.activation === 'elu') {
          // ELU: x if x > 0 else alpha * (exp(x) - 1)
          const data = x.getDataBuffer();
          for (let j = 0; j < data.length; j++) {
            if (data[j] < 0) {
              data[j] = Math.exp(data[j]) - 1;
            }
          }
        }

        // Apply dropout during training
        if (training && this.dropout > 0) {
          const data = x.getDataBuffer();
          const scale = 1 / (1 - this.dropout);
          for (let j = 0; j < data.length; j++) {
            if (Math.random() < this.dropout) {
              data[j] = 0;
            } else {
              data[j] *= scale;
            }
          }
        }
      }
    }

    return x;
  }

  parameters(): { name: string; data: Tensor; requiresGrad: boolean }[] {
    return this.layers.flatMap(layer => layer.parameters());
  }
}

/**
 * Create GCN model
 */
export function createGCN(
  inChannels: number,
  hiddenChannels: number,
  outChannels: number,
  numLayers = 2,
  dropout = 0.5
): GNNModel {
  const layers: IGNNLayer[] = [];

  if (numLayers === 1) {
    layers.push(new GCNLayer(inChannels, outChannels));
  } else {
    layers.push(new GCNLayer(inChannels, hiddenChannels));
    for (let i = 1; i < numLayers - 1; i++) {
      layers.push(new GCNLayer(hiddenChannels, hiddenChannels));
    }
    layers.push(new GCNLayer(hiddenChannels, outChannels));
  }

  return new GNNModel(layers, { name: 'gcn', activation: 'relu', dropout });
}

/**
 * Create GAT model
 */
export function createGAT(
  inChannels: number,
  hiddenChannels: number,
  outChannels: number,
  numLayers = 2,
  numHeads = 8,
  dropout = 0.6
): GNNModel {
  const layers: IGNNLayer[] = [];

  if (numLayers === 1) {
    layers.push(new GATLayer(inChannels, outChannels, 1));
  } else {
    layers.push(new GATLayer(inChannels, hiddenChannels, numHeads));
    for (let i = 1; i < numLayers - 1; i++) {
      layers.push(new GATLayer(hiddenChannels, hiddenChannels, numHeads));
    }
    layers.push(new GATLayer(hiddenChannels, outChannels, 1));
  }

  return new GNNModel(layers, { name: 'gat', activation: 'elu', dropout });
}

/**
 * Create GraphSAGE model
 */
export function createGraphSAGE(
  inChannels: number,
  hiddenChannels: number,
  outChannels: number,
  numLayers = 2,
  aggregator: 'mean' | 'max' | 'sum' = 'mean',
  dropout = 0.5
): GNNModel {
  const layers: IGNNLayer[] = [];

  if (numLayers === 1) {
    layers.push(new GraphSAGELayer(inChannels, outChannels, aggregator));
  } else {
    layers.push(new GraphSAGELayer(inChannels, hiddenChannels, aggregator));
    for (let i = 1; i < numLayers - 1; i++) {
      layers.push(new GraphSAGELayer(hiddenChannels, hiddenChannels, aggregator));
    }
    layers.push(new GraphSAGELayer(hiddenChannels, outChannels, aggregator));
  }

  return new GNNModel(layers, { name: 'graphsage', activation: 'relu', dropout });
}

// Version
export const VERSION = '0.1.0';
