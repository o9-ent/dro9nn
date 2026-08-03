/**
 * CogML Model - Unified model abstraction layer
 *
 * Provides a common interface for model definition, training,
 * and inference across different ML backends.
 */

import {
  Backend,
  Device,
  DataType,
  ModelConfig,
  TrainingConfig,
  InferenceOptions,
  Result,
} from '@o9nn/core';
import { ITensor, Tensor, TensorFactory, Shape } from '../tensor';
import { TensorBatch } from '../data';

/**
 * Layer types
 */
export type LayerType =
  | 'linear'
  | 'conv1d'
  | 'conv2d'
  | 'lstm'
  | 'gru'
  | 'attention'
  | 'embedding'
  | 'batchnorm'
  | 'layernorm'
  | 'dropout'
  | 'relu'
  | 'sigmoid'
  | 'tanh'
  | 'softmax'
  | 'flatten'
  | 'reshape';

/**
 * Layer configuration
 */
export interface LayerConfig {
  type: LayerType;
  name?: string;
  inputShape?: Shape;
  outputShape?: Shape;
  params?: Record<string, unknown>;
}

/**
 * Linear layer config
 */
export interface LinearConfig extends LayerConfig {
  type: 'linear';
  params: {
    inFeatures: number;
    outFeatures: number;
    bias?: boolean;
  };
}

/**
 * Conv2D layer config
 */
export interface Conv2DConfig extends LayerConfig {
  type: 'conv2d';
  params: {
    inChannels: number;
    outChannels: number;
    kernelSize: number | [number, number];
    stride?: number | [number, number];
    padding?: number | [number, number] | 'same' | 'valid';
    bias?: boolean;
  };
}

/**
 * LSTM layer config
 */
export interface LSTMConfig extends LayerConfig {
  type: 'lstm';
  params: {
    inputSize: number;
    hiddenSize: number;
    numLayers?: number;
    bidirectional?: boolean;
    dropout?: number;
  };
}

/**
 * Attention layer config
 */
export interface AttentionConfig extends LayerConfig {
  type: 'attention';
  params: {
    embedDim: number;
    numHeads: number;
    dropout?: number;
    kdim?: number;
    vdim?: number;
  };
}

/**
 * Parameter interface for model weights
 */
export interface IParameter {
  name: string;
  data: ITensor<number>;
  requiresGrad: boolean;
  grad?: ITensor<number>;
}

/**
 * Model state dict type
 */
export type StateDict = Record<string, ITensor<number>>;

/**
 * Layer interface
 */
export interface ILayer {
  readonly name: string;
  readonly type: LayerType;
  readonly config: LayerConfig;

  /** Get layer parameters */
  parameters(): IParameter[];

  /** Forward pass */
  forward(input: ITensor<number>): ITensor<number>;

  /** Get output shape given input shape */
  outputShape(inputShape: Shape): Shape;
}

/**
 * Model interface
 */
export interface IModel {
  readonly name: string;
  readonly config: ModelConfig;

  /** Get all layers */
  readonly layers: ILayer[];

  /** Get all parameters */
  parameters(): IParameter[];

  /** Get state dict */
  stateDict(): StateDict;

  /** Load state dict */
  loadStateDict(stateDict: StateDict): void;

  /** Forward pass */
  forward(input: ITensor<number>): ITensor<number>;

  /** Move model to device */
  to(device: Device): IModel;

  /** Set training mode */
  train(mode?: boolean): IModel;

  /** Set evaluation mode */
  eval(): IModel;

  /** Check if model is in training mode */
  readonly isTraining: boolean;
}

/**
 * Loss function interface
 */
export interface ILossFunction {
  readonly name: string;

  /** Compute loss */
  compute(prediction: ITensor<number>, target: ITensor<number>): ITensor<number>;

  /** Compute loss with reduction */
  computeWithReduction(
    prediction: ITensor<number>,
    target: ITensor<number>,
    reduction: 'none' | 'mean' | 'sum'
  ): ITensor<number>;
}

/**
 * Optimizer interface
 */
export interface IOptimizer {
  readonly name: string;
  readonly learningRate: number;

  /** Get optimizer state */
  state(): Record<string, unknown>;

  /** Zero gradients */
  zeroGrad(): void;

  /** Perform optimization step */
  step(): void;

  /** Update learning rate */
  setLearningRate(lr: number): void;
}

/**
 * Scheduler interface
 */
export interface IScheduler {
  readonly name: string;

  /** Get current learning rate */
  getLr(): number;

  /** Step the scheduler */
  step(epoch?: number, metric?: number): void;

  /** Get state dict */
  stateDict(): Record<string, unknown>;

  /** Load state dict */
  loadStateDict(stateDict: Record<string, unknown>): void;
}

/**
 * Trainer interface
 */
export interface ITrainer {
  readonly config: TrainingConfig;
  readonly model: IModel;
  readonly optimizer: IOptimizer;
  readonly scheduler?: IScheduler;

  /** Train for one epoch */
  trainEpoch(dataLoader: Iterable<TensorBatch>): Promise<TrainingMetrics>;

  /** Evaluate model */
  evaluate(dataLoader: Iterable<TensorBatch>): Promise<EvaluationMetrics>;

  /** Full training loop */
  fit(
    trainLoader: Iterable<TensorBatch>,
    valLoader?: Iterable<TensorBatch>,
    callbacks?: TrainingCallback[]
  ): Promise<TrainingHistory>;
}

/**
 * Training metrics
 */
export interface TrainingMetrics {
  loss: number;
  accuracy?: number;
  batchesProcessed: number;
  samplesProcessed: number;
  timeElapsed: number;
}

/**
 * Evaluation metrics
 */
export interface EvaluationMetrics {
  loss: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  samplesProcessed: number;
}

/**
 * Training history
 */
export interface TrainingHistory {
  epochs: number;
  trainMetrics: TrainingMetrics[];
  valMetrics?: EvaluationMetrics[];
  bestEpoch?: number;
  bestMetric?: number;
}

/**
 * Training callback interface
 */
export interface TrainingCallback {
  onEpochStart?(epoch: number): void | Promise<void>;
  onEpochEnd?(epoch: number, metrics: TrainingMetrics): void | Promise<void>;
  onBatchStart?(batch: number): void | Promise<void>;
  onBatchEnd?(batch: number, loss: number): void | Promise<void>;
  onTrainStart?(): void | Promise<void>;
  onTrainEnd?(history: TrainingHistory): void | Promise<void>;
}

/**
 * Linear layer implementation
 */
export class LinearLayer implements ILayer {
  readonly name: string;
  readonly type: LayerType = 'linear';
  readonly config: LinearConfig;
  private weight: Tensor;
  private bias?: Tensor;
  private factory: TensorFactory;

  constructor(config: Omit<LinearConfig, 'type'>, factory: TensorFactory = new TensorFactory()) {
    this.name = config.name || `linear_${config.params.inFeatures}_${config.params.outFeatures}`;
    this.config = { ...config, type: 'linear' };
    this.factory = factory;

    const { inFeatures, outFeatures, bias = true } = config.params;

    // Xavier/Glorot initialization
    const scale = Math.sqrt(2 / (inFeatures + outFeatures));
    const weightData = new Float32Array(inFeatures * outFeatures);
    for (let i = 0; i < weightData.length; i++) {
      weightData[i] = (Math.random() * 2 - 1) * scale;
    }
    this.weight = new Tensor(Array.from(weightData), [outFeatures, inFeatures]);

    if (bias) {
      this.bias = this.factory.zeros([outFeatures]);
    }
  }

  parameters(): IParameter[] {
    const params: IParameter[] = [
      { name: `${this.name}.weight`, data: this.weight, requiresGrad: true },
    ];
    if (this.bias) {
      params.push({ name: `${this.name}.bias`, data: this.bias, requiresGrad: true });
    }
    return params;
  }

  forward(input: Tensor): Tensor {
    // input: [batch, in_features] or [in_features]
    // weight: [out_features, in_features]
    // output: [batch, out_features] or [out_features]

    const is1D = input.shape.length === 1;
    const inputReshaped = is1D ? input.reshape([1, input.shape[0]]) : input;

    // Transpose weight for matmul: [batch, in] @ [in, out] = [batch, out]
    const weightT = this.weight.transpose();
    let output = inputReshaped.matmul(weightT);

    if (this.bias) {
      // Broadcasting bias addition
      const batchSize = output.shape[0];
      const outFeatures = output.shape[1];
      const outputData = output.flatten();
      const biasData = this.bias.flatten();

      const resultData = new Float32Array(outputData.length);
      for (let i = 0; i < batchSize; i++) {
        for (let j = 0; j < outFeatures; j++) {
          resultData[i * outFeatures + j] = outputData[i * outFeatures + j] + biasData[j];
        }
      }
      output = new Tensor(Array.from(resultData), output.shape);
    }

    return is1D ? output.reshape([output.shape[1]]) : output;
  }

  outputShape(inputShape: Shape): Shape {
    const { outFeatures } = this.config.params;
    if (inputShape.length === 1) {
      return [outFeatures];
    }
    return [inputShape[0], outFeatures];
  }
}

/**
 * Activation layers
 */
export class ReLULayer implements ILayer {
  readonly name: string;
  readonly type: LayerType = 'relu';
  readonly config: LayerConfig;

  constructor(name?: string) {
    this.name = name || 'relu';
    this.config = { type: 'relu', name: this.name };
  }

  parameters(): IParameter[] {
    return [];
  }

  forward(input: Tensor): Tensor {
    return input.relu();
  }

  outputShape(inputShape: Shape): Shape {
    return inputShape;
  }
}

export class SigmoidLayer implements ILayer {
  readonly name: string;
  readonly type: LayerType = 'sigmoid';
  readonly config: LayerConfig;

  constructor(name?: string) {
    this.name = name || 'sigmoid';
    this.config = { type: 'sigmoid', name: this.name };
  }

  parameters(): IParameter[] {
    return [];
  }

  forward(input: Tensor): Tensor {
    return input.sigmoid();
  }

  outputShape(inputShape: Shape): Shape {
    return inputShape;
  }
}

export class TanhLayer implements ILayer {
  readonly name: string;
  readonly type: LayerType = 'tanh';
  readonly config: LayerConfig;

  constructor(name?: string) {
    this.name = name || 'tanh';
    this.config = { type: 'tanh', name: this.name };
  }

  parameters(): IParameter[] {
    return [];
  }

  forward(input: Tensor): Tensor {
    return input.tanh();
  }

  outputShape(inputShape: Shape): Shape {
    return inputShape;
  }
}

export class SoftmaxLayer implements ILayer {
  readonly name: string;
  readonly type: LayerType = 'softmax';
  readonly config: LayerConfig;
  private axis: number;

  constructor(axis = -1, name?: string) {
    this.name = name || 'softmax';
    this.config = { type: 'softmax', name: this.name, params: { axis } };
    this.axis = axis;
  }

  parameters(): IParameter[] {
    return [];
  }

  forward(input: Tensor): Tensor {
    return input.softmax(this.axis);
  }

  outputShape(inputShape: Shape): Shape {
    return inputShape;
  }
}

/**
 * Dropout layer
 */
export class DropoutLayer implements ILayer {
  readonly name: string;
  readonly type: LayerType = 'dropout';
  readonly config: LayerConfig;
  private p: number;
  private isTraining: boolean;

  constructor(p = 0.5, name?: string) {
    this.name = name || `dropout_${p}`;
    this.config = { type: 'dropout', name: this.name, params: { p } };
    this.p = p;
    this.isTraining = true;
  }

  parameters(): IParameter[] {
    return [];
  }

  setTraining(mode: boolean): void {
    this.isTraining = mode;
  }

  forward(input: Tensor): Tensor {
    if (!this.isTraining || this.p === 0) {
      return input;
    }

    const data = input.flatten();
    const scale = 1 / (1 - this.p);
    const resultData = new Float32Array(data.length);

    for (let i = 0; i < data.length; i++) {
      resultData[i] = Math.random() >= this.p ? data[i] * scale : 0;
    }

    return new Tensor(Array.from(resultData), input.shape);
  }

  outputShape(inputShape: Shape): Shape {
    return inputShape;
  }
}

/**
 * Sequential model - container for sequential layers
 */
export class Sequential implements IModel {
  readonly name: string;
  readonly config: ModelConfig;
  private _layers: ILayer[];
  private _isTraining: boolean;
  private _device: Device;

  constructor(
    layers: ILayer[],
    config: Partial<ModelConfig> = {}
  ) {
    this.name = config.name || 'sequential';
    this.config = {
      name: this.name,
      backend: Backend.PYTORCH,
      device: Device.CPU,
      ...config,
    };
    this._layers = [...layers];
    this._isTraining = true;
    this._device = this.config.device;
  }

  get layers(): ILayer[] {
    return [...this._layers];
  }

  get isTraining(): boolean {
    return this._isTraining;
  }

  parameters(): IParameter[] {
    return this._layers.flatMap(layer => layer.parameters());
  }

  stateDict(): StateDict {
    const state: StateDict = {};
    for (const param of this.parameters()) {
      state[param.name] = param.data;
    }
    return state;
  }

  loadStateDict(stateDict: StateDict): void {
    const params = this.parameters();
    for (const param of params) {
      if (stateDict[param.name]) {
        // Copy data from state dict to parameter
        const sourceData = stateDict[param.name].flatten();
        const targetData = param.data.flatten();
        for (let i = 0; i < sourceData.length && i < targetData.length; i++) {
          targetData[i] = sourceData[i];
        }
      }
    }
  }

  forward(input: ITensor<number>): ITensor<number> {
    let output: ITensor<number> = input;
    for (const layer of this._layers) {
      output = layer.forward(output as Tensor);
    }
    return output;
  }

  to(device: Device): Sequential {
    this._device = device;
    // In a real implementation, this would move all parameters to the device
    return this;
  }

  train(mode = true): Sequential {
    this._isTraining = mode;
    for (const layer of this._layers) {
      if (layer instanceof DropoutLayer) {
        layer.setTraining(mode);
      }
    }
    return this;
  }

  eval(): Sequential {
    return this.train(false);
  }

  add(layer: ILayer): Sequential {
    this._layers.push(layer);
    return this;
  }
}

/**
 * Loss functions
 */
export class MSELoss implements ILossFunction {
  readonly name = 'mse_loss';

  compute(prediction: Tensor, target: Tensor): Tensor {
    return this.computeWithReduction(prediction, target, 'mean');
  }

  computeWithReduction(
    prediction: Tensor,
    target: Tensor,
    reduction: 'none' | 'mean' | 'sum'
  ): Tensor {
    const diff = prediction.sub(target);
    const squared = diff.mul(diff);

    switch (reduction) {
      case 'none':
        return squared;
      case 'sum':
        return squared.sum();
      case 'mean':
      default:
        return squared.mean();
    }
  }
}

export class CrossEntropyLoss implements ILossFunction {
  readonly name = 'cross_entropy_loss';

  compute(prediction: Tensor, target: Tensor): Tensor {
    return this.computeWithReduction(prediction, target, 'mean');
  }

  computeWithReduction(
    prediction: Tensor,
    target: Tensor,
    reduction: 'none' | 'mean' | 'sum'
  ): Tensor {
    // Apply softmax then compute negative log likelihood
    const probs = prediction.softmax(-1);
    const probsData = probs.flatten();
    const targetData = target.flatten();

    const batchSize = prediction.shape[0];
    const numClasses = prediction.shape[1];
    const losses = new Float32Array(batchSize);

    for (let i = 0; i < batchSize; i++) {
      const targetClass = Math.round(targetData[i]);
      const prob = probsData[i * numClasses + targetClass];
      losses[i] = -Math.log(Math.max(prob, 1e-7));
    }

    const lossTensor = new Tensor(Array.from(losses), [batchSize]);

    switch (reduction) {
      case 'none':
        return lossTensor;
      case 'sum':
        return lossTensor.sum();
      case 'mean':
      default:
        return lossTensor.mean();
    }
  }
}

export class BCELoss implements ILossFunction {
  readonly name = 'bce_loss';

  compute(prediction: Tensor, target: Tensor): Tensor {
    return this.computeWithReduction(prediction, target, 'mean');
  }

  computeWithReduction(
    prediction: Tensor,
    target: Tensor,
    reduction: 'none' | 'mean' | 'sum'
  ): Tensor {
    const predData = prediction.flatten();
    const targetData = target.flatten();
    const losses = new Float32Array(predData.length);

    for (let i = 0; i < predData.length; i++) {
      const p = Math.max(Math.min(predData[i], 1 - 1e-7), 1e-7);
      const t = targetData[i];
      losses[i] = -(t * Math.log(p) + (1 - t) * Math.log(1 - p));
    }

    const lossTensor = new Tensor(Array.from(losses), prediction.shape);

    switch (reduction) {
      case 'none':
        return lossTensor;
      case 'sum':
        return lossTensor.sum();
      case 'mean':
      default:
        return lossTensor.mean();
    }
  }
}

/**
 * Optimizers
 */
export class SGD implements IOptimizer {
  readonly name = 'sgd';
  private params: IParameter[];
  private _learningRate: number;
  private momentum: number;
  private velocities: Map<string, Float32Array>;

  constructor(
    params: IParameter[],
    learningRate = 0.01,
    momentum = 0
  ) {
    this.params = params;
    this._learningRate = learningRate;
    this.momentum = momentum;
    this.velocities = new Map();

    // Initialize velocities
    for (const param of params) {
      if (param.requiresGrad) {
        this.velocities.set(param.name, new Float32Array(param.data.numel));
      }
    }
  }

  get learningRate(): number {
    return this._learningRate;
  }

  state(): Record<string, unknown> {
    return {
      learningRate: this._learningRate,
      momentum: this.momentum,
      velocities: Object.fromEntries(this.velocities),
    };
  }

  zeroGrad(): void {
    for (const param of this.params) {
      param.grad = undefined;
    }
  }

  step(): void {
    for (const param of this.params) {
      if (!param.requiresGrad || !param.grad) continue;

      // Use getDataBuffer() to get mutable access to the underlying data
      const paramData = (param.data as Tensor).getDataBuffer();
      const gradData = (param.grad as Tensor).getDataBuffer();
      const velocity = this.velocities.get(param.name)!;

      for (let i = 0; i < paramData.length; i++) {
        if (this.momentum > 0) {
          velocity[i] = this.momentum * velocity[i] + gradData[i];
          paramData[i] -= this._learningRate * velocity[i];
        } else {
          paramData[i] -= this._learningRate * gradData[i];
        }
      }
    }
  }

  setLearningRate(lr: number): void {
    this._learningRate = lr;
  }
}

export class Adam implements IOptimizer {
  readonly name = 'adam';
  private params: IParameter[];
  private _learningRate: number;
  private beta1: number;
  private beta2: number;
  private eps: number;
  private step_t: number;
  private m: Map<string, Float32Array>;
  private v: Map<string, Float32Array>;

  constructor(
    params: IParameter[],
    learningRate = 0.001,
    beta1 = 0.9,
    beta2 = 0.999,
    eps = 1e-8
  ) {
    this.params = params;
    this._learningRate = learningRate;
    this.beta1 = beta1;
    this.beta2 = beta2;
    this.eps = eps;
    this.step_t = 0;
    this.m = new Map();
    this.v = new Map();

    // Initialize moment estimates
    for (const param of params) {
      if (param.requiresGrad) {
        this.m.set(param.name, new Float32Array(param.data.numel));
        this.v.set(param.name, new Float32Array(param.data.numel));
      }
    }
  }

  get learningRate(): number {
    return this._learningRate;
  }

  state(): Record<string, unknown> {
    return {
      learningRate: this._learningRate,
      beta1: this.beta1,
      beta2: this.beta2,
      eps: this.eps,
      step: this.step_t,
      m: Object.fromEntries(this.m),
      v: Object.fromEntries(this.v),
    };
  }

  zeroGrad(): void {
    for (const param of this.params) {
      param.grad = undefined;
    }
  }

  step(): void {
    this.step_t += 1;

    for (const param of this.params) {
      if (!param.requiresGrad || !param.grad) continue;

      // Use getDataBuffer() to get mutable access to the underlying data
      const paramData = (param.data as Tensor).getDataBuffer();
      const gradData = (param.grad as Tensor).getDataBuffer();
      const m = this.m.get(param.name)!;
      const v = this.v.get(param.name)!;

      const biasCorrection1 = 1 - Math.pow(this.beta1, this.step_t);
      const biasCorrection2 = 1 - Math.pow(this.beta2, this.step_t);

      for (let i = 0; i < paramData.length; i++) {
        // Update biased first moment estimate
        m[i] = this.beta1 * m[i] + (1 - this.beta1) * gradData[i];
        // Update biased second raw moment estimate
        v[i] = this.beta2 * v[i] + (1 - this.beta2) * gradData[i] * gradData[i];

        // Compute bias-corrected estimates
        const mHat = m[i] / biasCorrection1;
        const vHat = v[i] / biasCorrection2;

        // Update parameters
        paramData[i] -= this._learningRate * mHat / (Math.sqrt(vHat) + this.eps);
      }
    }
  }

  setLearningRate(lr: number): void {
    this._learningRate = lr;
  }
}

/**
 * Learning rate schedulers
 */
export class StepLRScheduler implements IScheduler {
  readonly name = 'step_lr';
  private optimizer: IOptimizer;
  private stepSize: number;
  private gamma: number;
  private lastEpoch: number;
  private baseLr: number;

  constructor(
    optimizer: IOptimizer,
    stepSize: number,
    gamma = 0.1
  ) {
    this.optimizer = optimizer;
    this.stepSize = stepSize;
    this.gamma = gamma;
    this.lastEpoch = 0;
    this.baseLr = optimizer.learningRate;
  }

  getLr(): number {
    return this.optimizer.learningRate;
  }

  step(epoch?: number): void {
    this.lastEpoch = epoch ?? this.lastEpoch + 1;
    const factor = Math.pow(this.gamma, Math.floor(this.lastEpoch / this.stepSize));
    this.optimizer.setLearningRate(this.baseLr * factor);
  }

  stateDict(): Record<string, unknown> {
    return {
      lastEpoch: this.lastEpoch,
      baseLr: this.baseLr,
    };
  }

  loadStateDict(stateDict: Record<string, unknown>): void {
    this.lastEpoch = stateDict.lastEpoch as number;
    this.baseLr = stateDict.baseLr as number;
  }
}

export class CosineAnnealingScheduler implements IScheduler {
  readonly name = 'cosine_annealing';
  private optimizer: IOptimizer;
  private tMax: number;
  private etaMin: number;
  private lastEpoch: number;
  private baseLr: number;

  constructor(
    optimizer: IOptimizer,
    tMax: number,
    etaMin = 0
  ) {
    this.optimizer = optimizer;
    this.tMax = tMax;
    this.etaMin = etaMin;
    this.lastEpoch = 0;
    this.baseLr = optimizer.learningRate;
  }

  getLr(): number {
    return this.optimizer.learningRate;
  }

  step(epoch?: number): void {
    this.lastEpoch = epoch ?? this.lastEpoch + 1;
    const lr =
      this.etaMin +
      (this.baseLr - this.etaMin) *
        (1 + Math.cos(Math.PI * this.lastEpoch / this.tMax)) /
        2;
    this.optimizer.setLearningRate(lr);
  }

  stateDict(): Record<string, unknown> {
    return {
      lastEpoch: this.lastEpoch,
      baseLr: this.baseLr,
    };
  }

  loadStateDict(stateDict: Record<string, unknown>): void {
    this.lastEpoch = stateDict.lastEpoch as number;
    this.baseLr = stateDict.baseLr as number;
  }
}

/**
 * Model builder helper
 */
export class ModelBuilder {
  private layers: ILayer[] = [];
  private factory: TensorFactory;

  constructor(factory: TensorFactory = new TensorFactory()) {
    this.factory = factory;
  }

  linear(inFeatures: number, outFeatures: number, bias = true, name?: string): ModelBuilder {
    this.layers.push(
      new LinearLayer(
        {
          name,
          params: { inFeatures, outFeatures, bias },
        },
        this.factory
      )
    );
    return this;
  }

  relu(name?: string): ModelBuilder {
    this.layers.push(new ReLULayer(name));
    return this;
  }

  sigmoid(name?: string): ModelBuilder {
    this.layers.push(new SigmoidLayer(name));
    return this;
  }

  tanh(name?: string): ModelBuilder {
    this.layers.push(new TanhLayer(name));
    return this;
  }

  softmax(axis = -1, name?: string): ModelBuilder {
    this.layers.push(new SoftmaxLayer(axis, name));
    return this;
  }

  dropout(p = 0.5, name?: string): ModelBuilder {
    this.layers.push(new DropoutLayer(p, name));
    return this;
  }

  build(name?: string, config?: Partial<ModelConfig>): Sequential {
    return new Sequential(this.layers, { name, ...config });
  }
}

/**
 * Create a model builder
 */
export function createModel(factory?: TensorFactory): ModelBuilder {
  return new ModelBuilder(factory);
}
