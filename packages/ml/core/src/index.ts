/**
 * @o9nn/ml-core - CogML Core
 *
 * Unified ML Framework Layer with backend abstraction for PyTorch, JAX, and TensorFlow.
 * Part of Phase 2: AI/ML Platform Integration.
 *
 * Features:
 * - Abstract tensor interface with common operations
 * - Unified data loading and preprocessing pipeline
 * - Model definition with sequential and functional APIs
 * - Loss functions, optimizers, and schedulers
 * - Training utilities and callbacks
 *
 * @module @o9nn/ml-core
 */

// Re-export core types and values
export {
  Backend,
  Device,
  DataType,
} from '@o9nn/core';

export type {
  ModelConfig,
  TrainingConfig,
  InferenceOptions,
  DataLoaderConfig,
} from '@o9nn/core';

// Tensor module
export type {
  Shape,
  TensorMetadata,
  ITensor,
  TensorOptions,
  ITensorFactory,
} from './tensor';

export {
  Tensor,
  TensorFactory,
  TensorOps,
  tensorFactory,
  DEFAULT_TENSOR_OPTIONS,
} from './tensor';

// Data module
export type {
  Sample,
  Batch,
  TensorBatch,
  Transform,
  AsyncTransform,
  IDataset,
  IDataLoader,
} from './data';

export {
  Dataset,
  TensorDataset,
  DataLoader,
  TensorDataLoader,
  Transforms,
  DatasetUtils,
} from './data';

// Model module
export type {
  LayerType,
  LayerConfig,
  LinearConfig,
  Conv2DConfig,
  LSTMConfig,
  AttentionConfig,
  IParameter,
  StateDict,
  ILayer,
  IModel,
  ILossFunction,
  IOptimizer,
  IScheduler,
  ITrainer,
  TrainingMetrics,
  EvaluationMetrics,
  TrainingHistory,
  TrainingCallback,
} from './model';

export {
  // Layers
  LinearLayer,
  ReLULayer,
  SigmoidLayer,
  TanhLayer,
  SoftmaxLayer,
  DropoutLayer,
  // Models
  Sequential,
  // Loss functions
  MSELoss,
  CrossEntropyLoss,
  BCELoss,
  // Optimizers
  SGD,
  Adam,
  // Schedulers
  StepLRScheduler,
  CosineAnnealingScheduler,
  // Utilities
  ModelBuilder,
  createModel,
} from './model';

// Version
export const VERSION = '0.1.0';

/**
 * CogML namespace for convenient access
 */
export const CogML = {
  VERSION: '0.1.0',
} as const;
