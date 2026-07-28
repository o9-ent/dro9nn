/**
 * Core types for the o9nn ecosystem
 */

// ML Backend types
export enum Backend {
  PYTORCH = 'pytorch',
  JAX = 'jax',
  TENSORFLOW = 'tensorflow',
  ONNX = 'onnx',
}

// Device types
export enum Device {
  CPU = 'cpu',
  CUDA = 'cuda',
  MPS = 'mps',
  TPU = 'tpu',
}

// Data types
export enum DataType {
  FLOAT16 = 'float16',
  FLOAT32 = 'float32',
  FLOAT64 = 'float64',
  INT8 = 'int8',
  INT16 = 'int16',
  INT32 = 'int32',
  INT64 = 'int64',
  UINT8 = 'uint8',
  BOOL = 'bool',
  BFLOAT16 = 'bfloat16',
}

// Model configuration
export interface ModelConfig {
  name: string;
  version?: string;
  path?: string;
  backend: Backend;
  device: Device;
  dtype?: DataType;
  options?: Record<string, unknown>;
}

// Inference options
export interface InferenceOptions {
  batchSize?: number;
  maxLength?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
  stream?: boolean;
  timeout?: number;
}

// Training configuration
export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  optimizer: 'adam' | 'sgd' | 'adamw' | 'rmsprop';
  scheduler?: {
    type: 'cosine' | 'linear' | 'step' | 'exponential';
    warmupSteps?: number;
    totalSteps?: number;
  };
  gradientAccumulationSteps?: number;
  maxGradNorm?: number;
  seed?: number;
}

// Data loader configuration
export interface DataLoaderConfig {
  batchSize: number;
  shuffle?: boolean;
  numWorkers?: number;
  prefetchFactor?: number;
  pinMemory?: boolean;
  dropLast?: boolean;
}

// Agent configuration
export interface AgentConfig {
  name: string;
  model: ModelConfig;
  tools?: ToolConfig[];
  memory?: MemoryConfig;
  maxIterations?: number;
}

// Tool configuration
export interface ToolConfig {
  name: string;
  description: string;
  parameters?: Record<string, ParameterSchema>;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

// Parameter schema
export interface ParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required?: boolean;
  default?: unknown;
  enum?: unknown[];
}

// Memory configuration
export interface MemoryConfig {
  type: 'buffer' | 'summary' | 'vector' | 'conversation';
  maxTokens?: number;
  vectorStore?: {
    type: 'faiss' | 'chroma' | 'pinecone';
    dimensions: number;
  };
}

// GNN configuration
export interface GNNConfig {
  type: 'gcn' | 'gat' | 'graphsage' | 'gin' | 'mpnn';
  numLayers: number;
  hiddenDim: number;
  numHeads?: number; // For GAT
  dropout?: number;
  aggregator?: 'mean' | 'max' | 'sum' | 'lstm';
}

// ESN (Echo State Network) configuration
export interface ESNConfig {
  reservoirSize: number;
  spectralRadius: number;
  inputScaling: number;
  leakingRate: number;
  sparsity?: number;
  noise?: number;
  washout?: number;
}

// Result type for operations
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

// Async result type
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
