/**
 * CogML Data - Unified data loading and preprocessing pipeline
 *
 * Provides a common interface for data loading, transformation,
 * and batching across different data types and backends.
 */

import { DataLoaderConfig, Backend } from '@o9nn/core';
import { ITensor, Tensor, TensorFactory, Shape } from '../tensor';

/**
 * Data sample type
 */
export interface Sample<T = unknown> {
  data: T;
  label?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Batch type for grouped samples
 */
export interface Batch<T = unknown> {
  data: T[];
  labels?: unknown[];
  size: number;
  index: number;
}

/**
 * Tensor batch for ML operations
 */
export interface TensorBatch {
  inputs: ITensor<number>;
  targets?: ITensor<number>;
  size: number;
  index: number;
}

/**
 * Transform function type
 */
export type Transform<T, U = T> = (input: T) => U;

/**
 * Async transform function type
 */
export type AsyncTransform<T, U = T> = (input: T) => Promise<U>;

/**
 * Dataset interface - base abstraction for all datasets
 */
export interface IDataset<T = unknown> {
  /** Get dataset length */
  readonly length: number;

  /** Get item at index */
  getItem(index: number): T | Promise<T>;

  /** Map transform over dataset */
  map<U>(transform: Transform<T, U> | AsyncTransform<T, U>): IDataset<U>;

  /** Filter dataset */
  filter(predicate: (item: T) => boolean): IDataset<T>;

  /** Shuffle dataset */
  shuffle(seed?: number): IDataset<T>;

  /** Take first n items */
  take(n: number): IDataset<T>;

  /** Skip first n items */
  skip(n: number): IDataset<T>;

  /** Get subset of dataset */
  subset(indices: number[]): IDataset<T>;
}

/**
 * DataLoader interface - batches and iterates over datasets
 */
export interface IDataLoader<T = unknown> {
  /** DataLoader configuration */
  readonly config: DataLoaderConfig;

  /** Dataset */
  readonly dataset: IDataset<T>;

  /** Number of batches */
  readonly numBatches: number;

  /** Iterate over batches */
  [Symbol.iterator](): Iterator<Batch<T>>;

  /** Async iterate over batches */
  [Symbol.asyncIterator](): AsyncIterator<Batch<T>>;

  /** Get batch by index */
  getBatch(index: number): Batch<T> | Promise<Batch<T>>;
}

/**
 * In-memory dataset implementation
 */
export class Dataset<T = unknown> implements IDataset<T> {
  private items: T[];
  private transforms: Transform<unknown, unknown>[] = [];

  constructor(items: T[]) {
    this.items = [...items];
  }

  get length(): number {
    return this.items.length;
  }

  getItem(index: number): T {
    if (index < 0 || index >= this.items.length) {
      throw new Error(`Index ${index} out of bounds [0, ${this.items.length})`);
    }

    let item: unknown = this.items[index];
    for (const transform of this.transforms) {
      item = transform(item);
    }
    return item as T;
  }

  map<U>(transform: Transform<T, U>): Dataset<U> {
    const newDataset = new Dataset<U>([]);
    newDataset.items = this.items as unknown as U[];
    newDataset.transforms = [...this.transforms, transform as Transform<unknown, unknown>];
    return newDataset;
  }

  filter(predicate: (item: T) => boolean): Dataset<T> {
    const filteredItems = this.items.filter((item, index) => {
      const transformedItem = this.getItem(index);
      return predicate(transformedItem);
    });
    return new Dataset(filteredItems);
  }

  shuffle(seed?: number): Dataset<T> {
    const indices = Array.from({ length: this.items.length }, (_, i) => i);

    // Simple seeded random shuffle
    const random = seed !== undefined ? seededRandom(seed) : Math.random;
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const shuffledItems = indices.map(i => this.items[i]);
    const dataset = new Dataset(shuffledItems);
    dataset.transforms = [...this.transforms];
    return dataset;
  }

  take(n: number): Dataset<T> {
    const dataset = new Dataset(this.items.slice(0, n));
    dataset.transforms = [...this.transforms];
    return dataset;
  }

  skip(n: number): Dataset<T> {
    const dataset = new Dataset(this.items.slice(n));
    dataset.transforms = [...this.transforms];
    return dataset;
  }

  subset(indices: number[]): Dataset<T> {
    const subsetItems = indices.map(i => {
      if (i < 0 || i >= this.items.length) {
        throw new Error(`Index ${i} out of bounds`);
      }
      return this.items[i];
    });
    const dataset = new Dataset(subsetItems);
    dataset.transforms = [...this.transforms];
    return dataset;
  }

  /**
   * Convert to tensor dataset
   */
  toTensorDataset(
    dataShape: Shape,
    labelShape?: Shape,
    factory: TensorFactory = new TensorFactory()
  ): TensorDataset {
    const tensorSamples = this.items.map((item, index) => {
      const transformedItem = this.getItem(index) as Sample<number[]>;
      return {
        data: factory.tensor(transformedItem.data, { dtype: 'float32' as unknown as import('@o9nn/core').DataType }),
        label: transformedItem.label !== undefined
          ? factory.tensor(transformedItem.label as number[], { dtype: 'float32' as unknown as import('@o9nn/core').DataType })
          : undefined,
      };
    });
    return new TensorDataset(tensorSamples);
  }
}

/**
 * Tensor dataset for ML operations
 */
export class TensorDataset implements IDataset<{ data: Tensor; label?: Tensor }> {
  private samples: { data: Tensor; label?: Tensor }[];

  constructor(samples: { data: Tensor; label?: Tensor }[]) {
    this.samples = [...samples];
  }

  get length(): number {
    return this.samples.length;
  }

  getItem(index: number): { data: Tensor; label?: Tensor } {
    if (index < 0 || index >= this.samples.length) {
      throw new Error(`Index ${index} out of bounds [0, ${this.samples.length})`);
    }
    return this.samples[index];
  }

  map<U>(transform: Transform<{ data: Tensor; label?: Tensor }, U>): Dataset<U> {
    const transformedItems = this.samples.map(transform);
    return new Dataset(transformedItems);
  }

  filter(predicate: (item: { data: Tensor; label?: Tensor }) => boolean): TensorDataset {
    const filteredSamples = this.samples.filter(predicate);
    return new TensorDataset(filteredSamples);
  }

  shuffle(seed?: number): TensorDataset {
    const indices = Array.from({ length: this.samples.length }, (_, i) => i);
    const random = seed !== undefined ? seededRandom(seed) : Math.random;

    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const shuffledSamples = indices.map(i => this.samples[i]);
    return new TensorDataset(shuffledSamples);
  }

  take(n: number): TensorDataset {
    return new TensorDataset(this.samples.slice(0, n));
  }

  skip(n: number): TensorDataset {
    return new TensorDataset(this.samples.slice(n));
  }

  subset(indices: number[]): TensorDataset {
    const subsetSamples = indices.map(i => {
      if (i < 0 || i >= this.samples.length) {
        throw new Error(`Index ${i} out of bounds`);
      }
      return this.samples[i];
    });
    return new TensorDataset(subsetSamples);
  }
}

/**
 * DataLoader implementation
 */
export class DataLoader<T = unknown> implements IDataLoader<T> {
  readonly config: DataLoaderConfig;
  readonly dataset: IDataset<T>;
  private _numBatches: number;
  private indices: number[];

  constructor(dataset: IDataset<T>, config: Partial<DataLoaderConfig> = {}) {
    this.dataset = dataset;
    this.config = {
      batchSize: 32,
      shuffle: false,
      numWorkers: 0,
      prefetchFactor: 2,
      pinMemory: false,
      dropLast: false,
      ...config,
    };

    this.indices = Array.from({ length: dataset.length }, (_, i) => i);

    if (this.config.shuffle) {
      this.shuffleIndices();
    }

    this._numBatches = this.config.dropLast
      ? Math.floor(dataset.length / this.config.batchSize)
      : Math.ceil(dataset.length / this.config.batchSize);
  }

  get numBatches(): number {
    return this._numBatches;
  }

  private shuffleIndices(): void {
    for (let i = this.indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.indices[i], this.indices[j]] = [this.indices[j], this.indices[i]];
    }
  }

  *[Symbol.iterator](): Iterator<Batch<T>> {
    for (let i = 0; i < this._numBatches; i++) {
      yield this.getBatch(i) as Batch<T>;
    }
  }

  async *[Symbol.asyncIterator](): AsyncIterator<Batch<T>> {
    for (let i = 0; i < this._numBatches; i++) {
      yield await this.getBatch(i);
    }
  }

  getBatch(index: number): Batch<T> | Promise<Batch<T>> {
    if (index < 0 || index >= this._numBatches) {
      throw new Error(`Batch index ${index} out of bounds [0, ${this._numBatches})`);
    }

    const start = index * this.config.batchSize;
    const end = Math.min(start + this.config.batchSize, this.dataset.length);
    const batchIndices = this.indices.slice(start, end);

    const data: T[] = [];
    const labels: unknown[] = [];

    for (const idx of batchIndices) {
      const item = this.dataset.getItem(idx);
      if (item instanceof Promise) {
        // Return promise for async datasets
        return this.getBatchAsync(batchIndices, index);
      }

      if (typeof item === 'object' && item !== null && 'data' in item) {
        const sample = item as Sample<T>;
        data.push(sample.data as T);
        if (sample.label !== undefined) {
          labels.push(sample.label);
        }
      } else {
        data.push(item);
      }
    }

    return {
      data,
      labels: labels.length > 0 ? labels : undefined,
      size: data.length,
      index,
    };
  }

  private async getBatchAsync(batchIndices: number[], index: number): Promise<Batch<T>> {
    const data: T[] = [];
    const labels: unknown[] = [];

    for (const idx of batchIndices) {
      const item = await this.dataset.getItem(idx);

      if (typeof item === 'object' && item !== null && 'data' in item) {
        const sample = item as Sample<T>;
        data.push(sample.data as T);
        if (sample.label !== undefined) {
          labels.push(sample.label);
        }
      } else {
        data.push(item);
      }
    }

    return {
      data,
      labels: labels.length > 0 ? labels : undefined,
      size: data.length,
      index,
    };
  }
}

/**
 * Tensor DataLoader - specialized for ML operations
 */
export class TensorDataLoader {
  private loader: DataLoader<{ data: Tensor; label?: Tensor }>;
  private factory: TensorFactory;

  constructor(
    dataset: TensorDataset,
    config: Partial<DataLoaderConfig> = {},
    factory: TensorFactory = new TensorFactory()
  ) {
    this.loader = new DataLoader(dataset, config);
    this.factory = factory;
  }

  get config(): DataLoaderConfig {
    return this.loader.config;
  }

  get numBatches(): number {
    return this.loader.numBatches;
  }

  *[Symbol.iterator](): Iterator<TensorBatch> {
    for (const batch of this.loader) {
      yield this.collate(batch);
    }
  }

  private collate(batch: Batch<{ data: Tensor; label?: Tensor }>): TensorBatch {
    // Stack tensors along new batch dimension
    const inputs = this.stackTensors(batch.data.map(item => item.data));

    let targets: ITensor<number> | undefined;
    if (batch.data[0].label !== undefined) {
      targets = this.stackTensors(
        batch.data.map(item => item.label!).filter(Boolean)
      );
    }

    return {
      inputs,
      targets,
      size: batch.size,
      index: batch.index,
    };
  }

  private stackTensors(tensors: Tensor[]): Tensor {
    if (tensors.length === 0) {
      throw new Error('Cannot stack empty tensor array');
    }

    const firstShape = tensors[0].shape;
    for (let i = 1; i < tensors.length; i++) {
      if (JSON.stringify(tensors[i].shape) !== JSON.stringify(firstShape)) {
        throw new Error('All tensors must have the same shape for stacking');
      }
    }

    const batchSize = tensors.length;
    const newShape = [batchSize, ...firstShape];
    const totalElements = batchSize * tensors[0].numel;

    const data = new Float32Array(totalElements);
    for (let i = 0; i < tensors.length; i++) {
      const tensorData = tensors[i].flatten();
      data.set(tensorData, i * tensorData.length);
    }

    return new Tensor(Array.from(data), newShape);
  }
}

/**
 * Common data transforms
 */
export const Transforms = {
  /**
   * Normalize data to [0, 1] range
   */
  normalize: (min = 0, max = 1): Transform<number[], number[]> => {
    return (data: number[]) => {
      const dataMin = Math.min(...data);
      const dataMax = Math.max(...data);
      const range = dataMax - dataMin;

      if (range === 0) {
        return data.map(() => (min + max) / 2);
      }

      return data.map(v => min + ((v - dataMin) / range) * (max - min));
    };
  },

  /**
   * Standardize data (zero mean, unit variance)
   */
  standardize: (): Transform<number[], number[]> => {
    return (data: number[]) => {
      const mean = data.reduce((a, b) => a + b, 0) / data.length;
      const variance = data.reduce((sum, v) => sum + (v - mean) ** 2, 0) / data.length;
      const std = Math.sqrt(variance);

      if (std === 0) {
        return data.map(() => 0);
      }

      return data.map(v => (v - mean) / std);
    };
  },

  /**
   * One-hot encode labels
   */
  oneHot: (numClasses: number): Transform<number, number[]> => {
    return (label: number) => {
      const encoded = new Array(numClasses).fill(0);
      encoded[label] = 1;
      return encoded;
    };
  },

  /**
   * Add noise to data
   */
  addNoise: (scale = 0.1): Transform<number[], number[]> => {
    return (data: number[]) => {
      return data.map(v => v + (Math.random() - 0.5) * 2 * scale);
    };
  },

  /**
   * Compose multiple transforms
   */
  compose: <T>(...transforms: Transform<T, T>[]): Transform<T, T> => {
    return (input: T) => {
      return transforms.reduce((acc, transform) => transform(acc), input);
    };
  },
};

/**
 * Dataset utilities
 */
export const DatasetUtils = {
  /**
   * Split dataset into train/test sets
   */
  trainTestSplit<T>(
    dataset: IDataset<T>,
    testRatio = 0.2,
    seed?: number
  ): { train: IDataset<T>; test: IDataset<T> } {
    const shuffled = dataset.shuffle(seed);
    const testSize = Math.floor(dataset.length * testRatio);
    const trainSize = dataset.length - testSize;

    return {
      train: shuffled.take(trainSize),
      test: shuffled.skip(trainSize),
    };
  },

  /**
   * Split dataset into k folds for cross-validation
   */
  kFoldSplit<T>(
    dataset: IDataset<T>,
    k = 5,
    seed?: number
  ): { train: IDataset<T>; validation: IDataset<T> }[] {
    const shuffled = dataset.shuffle(seed);
    const foldSize = Math.floor(dataset.length / k);
    const folds: { train: IDataset<T>; validation: IDataset<T> }[] = [];

    for (let i = 0; i < k; i++) {
      const valStart = i * foldSize;
      const valEnd = i === k - 1 ? dataset.length : (i + 1) * foldSize;

      const valIndices = Array.from(
        { length: valEnd - valStart },
        (_, j) => valStart + j
      );
      const trainIndices = Array.from({ length: dataset.length }, (_, j) => j).filter(
        j => j < valStart || j >= valEnd
      );

      folds.push({
        train: shuffled.subset(trainIndices),
        validation: shuffled.subset(valIndices),
      });
    }

    return folds;
  },

  /**
   * Create dataset from arrays
   */
  fromArrays<T, L>(
    data: T[],
    labels?: L[]
  ): Dataset<Sample<T>> {
    const samples: Sample<T>[] = data.map((d, i) => ({
      data: d,
      label: labels?.[i],
    }));
    return new Dataset(samples);
  },
};

/**
 * Simple seeded random number generator
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}
