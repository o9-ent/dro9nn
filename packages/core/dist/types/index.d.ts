/**
 * Core types for the o9nn ecosystem
 */
declare enum Backend {
    PYTORCH = "pytorch",
    JAX = "jax",
    TENSORFLOW = "tensorflow",
    ONNX = "onnx"
}
declare enum Device {
    CPU = "cpu",
    CUDA = "cuda",
    MPS = "mps",
    TPU = "tpu"
}
declare enum DataType {
    FLOAT16 = "float16",
    FLOAT32 = "float32",
    FLOAT64 = "float64",
    INT8 = "int8",
    INT16 = "int16",
    INT32 = "int32",
    INT64 = "int64",
    UINT8 = "uint8",
    BOOL = "bool",
    BFLOAT16 = "bfloat16"
}
interface ModelConfig {
    name: string;
    version?: string;
    path?: string;
    backend: Backend;
    device: Device;
    dtype?: DataType;
    options?: Record<string, unknown>;
}
interface InferenceOptions {
    batchSize?: number;
    maxLength?: number;
    temperature?: number;
    topK?: number;
    topP?: number;
    stream?: boolean;
    timeout?: number;
}
interface TrainingConfig {
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
interface DataLoaderConfig {
    batchSize: number;
    shuffle?: boolean;
    numWorkers?: number;
    prefetchFactor?: number;
    pinMemory?: boolean;
    dropLast?: boolean;
}
interface AgentConfig {
    name: string;
    model: ModelConfig;
    tools?: ToolConfig[];
    memory?: MemoryConfig;
    maxIterations?: number;
}
interface ToolConfig {
    name: string;
    description: string;
    parameters?: Record<string, ParameterSchema>;
    execute: (params: Record<string, unknown>) => Promise<unknown>;
}
interface ParameterSchema {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description?: string;
    required?: boolean;
    default?: unknown;
    enum?: unknown[];
}
interface MemoryConfig {
    type: 'buffer' | 'summary' | 'vector' | 'conversation';
    maxTokens?: number;
    vectorStore?: {
        type: 'faiss' | 'chroma' | 'pinecone';
        dimensions: number;
    };
}
interface GNNConfig {
    type: 'gcn' | 'gat' | 'graphsage' | 'gin' | 'mpnn';
    numLayers: number;
    hiddenDim: number;
    numHeads?: number;
    dropout?: number;
    aggregator?: 'mean' | 'max' | 'sum' | 'lstm';
}
interface ESNConfig {
    reservoirSize: number;
    spectralRadius: number;
    inputScaling: number;
    leakingRate: number;
    sparsity?: number;
    noise?: number;
    washout?: number;
}
interface Result<T, E = Error> {
    success: boolean;
    data?: T;
    error?: E;
}
type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

export { type AgentConfig, type AsyncResult, Backend, type DataLoaderConfig, DataType, Device, type ESNConfig, type GNNConfig, type InferenceOptions, type MemoryConfig, type ModelConfig, type ParameterSchema, type Result, type ToolConfig, type TrainingConfig };
