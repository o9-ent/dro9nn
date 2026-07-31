/**
 * CogML Tensor - Unified tensor abstraction layer
 *
 * Provides a common interface for tensor operations across multiple backends
 * (PyTorch, JAX, TensorFlow, ONNX).
 */

import { Backend, Device, DataType } from '@o9nn/core';

/**
 * Shape type for multi-dimensional tensors
 */
export type Shape = number[];

/**
 * Tensor metadata interface
 */
export interface TensorMetadata {
  shape: Shape;
  dtype: DataType;
  device: Device;
  backend: Backend;
  requiresGrad?: boolean;
  name?: string;
}

/**
 * Abstract tensor interface - defines common operations across all backends
 */
export interface ITensor<T = number> {
  /** Get tensor metadata */
  readonly metadata: TensorMetadata;

  /** Get tensor shape */
  readonly shape: Shape;

  /** Get tensor data type */
  readonly dtype: DataType;

  /** Get tensor device */
  readonly device: Device;

  /** Get number of dimensions */
  readonly ndim: number;

  /** Get total number of elements */
  readonly numel: number;

  /** Convert to nested array representation */
  toArray(): T[] | T[][] | T[][][] | T[][][][];

  /** Convert to flattened array */
  flatten(): T[];

  /** Clone the tensor */
  clone(): ITensor<T>;

  /** Move tensor to device */
  to(device: Device): ITensor<T>;

  /** Cast to different data type */
  asType(dtype: DataType): ITensor<T>;

  /** Reshape tensor */
  reshape(shape: Shape): ITensor<T>;

  /** Transpose tensor */
  transpose(axes?: number[]): ITensor<T>;

  /** Element-wise addition */
  add(other: ITensor<T> | T): ITensor<T>;

  /** Element-wise subtraction */
  sub(other: ITensor<T> | T): ITensor<T>;

  /** Element-wise multiplication */
  mul(other: ITensor<T> | T): ITensor<T>;

  /** Element-wise division */
  div(other: ITensor<T> | T): ITensor<T>;

  /** Matrix multiplication */
  matmul(other: ITensor<T>): ITensor<T>;

  /** Sum along axes */
  sum(axis?: number | number[], keepdims?: boolean): ITensor<T>;

  /** Mean along axes */
  mean(axis?: number | number[], keepdims?: boolean): ITensor<T>;

  /** Max along axes */
  max(axis?: number | number[], keepdims?: boolean): ITensor<T>;

  /** Min along axes */
  min(axis?: number | number[], keepdims?: boolean): ITensor<T>;

  /** Standard deviation */
  std(axis?: number | number[], keepdims?: boolean): ITensor<T>;

  /** Apply activation function */
  relu(): ITensor<T>;
  sigmoid(): ITensor<T>;
  tanh(): ITensor<T>;
  softmax(axis?: number): ITensor<T>;

  /** Gradient operations */
  backward(): void;
  grad(): ITensor<T> | null;
  requiresGrad(requires: boolean): ITensor<T>;
}

/**
 * Tensor factory options
 */
export interface TensorOptions {
  dtype?: DataType;
  device?: Device;
  backend?: Backend;
  requiresGrad?: boolean;
}

/**
 * Default tensor options
 */
export const DEFAULT_TENSOR_OPTIONS: Required<TensorOptions> = {
  dtype: DataType.FLOAT32,
  device: Device.CPU,
  backend: Backend.PYTORCH,
  requiresGrad: false,
};

/**
 * Abstract tensor factory - creates tensors for specific backends
 */
export interface ITensorFactory {
  /** Factory backend */
  readonly backend: Backend;

  /** Create tensor from data */
  tensor(data: number[] | number[][] | number[][][] | number[][][][], options?: TensorOptions): ITensor<number>;

  /** Create tensor filled with zeros */
  zeros(shape: Shape, options?: TensorOptions): ITensor<number>;

  /** Create tensor filled with ones */
  ones(shape: Shape, options?: TensorOptions): ITensor<number>;

  /** Create identity matrix */
  eye(n: number, m?: number, options?: TensorOptions): ITensor<number>;

  /** Create tensor with random values [0, 1) */
  rand(shape: Shape, options?: TensorOptions): ITensor<number>;

  /** Create tensor with random normal values */
  randn(shape: Shape, options?: TensorOptions): ITensor<number>;

  /** Create tensor with values from start to end */
  arange(start: number, end: number, step?: number, options?: TensorOptions): ITensor<number>;

  /** Create tensor with n evenly spaced values */
  linspace(start: number, end: number, n: number, options?: TensorOptions): ITensor<number>;

  /** Create tensor filled with specific value */
  full(shape: Shape, value: number, options?: TensorOptions): ITensor<number>;

  /** Create empty tensor */
  empty(shape: Shape, options?: TensorOptions): ITensor<number>;
}

/**
 * Tensor operations namespace
 */
export const TensorOps = {
  /**
   * Calculate total number of elements from shape
   */
  numel(shape: Shape): number {
    return shape.reduce((acc, dim) => acc * dim, 1);
  },

  /**
   * Validate shapes are broadcastable
   */
  areBroadcastable(shape1: Shape, shape2: Shape): boolean {
    const maxLen = Math.max(shape1.length, shape2.length);
    const padded1 = [...new Array(maxLen - shape1.length).fill(1), ...shape1];
    const padded2 = [...new Array(maxLen - shape2.length).fill(1), ...shape2];

    for (let i = 0; i < maxLen; i++) {
      if (padded1[i] !== padded2[i] && padded1[i] !== 1 && padded2[i] !== 1) {
        return false;
      }
    }
    return true;
  },

  /**
   * Calculate broadcast shape
   */
  broadcastShape(shape1: Shape, shape2: Shape): Shape {
    const maxLen = Math.max(shape1.length, shape2.length);
    const padded1 = [...new Array(maxLen - shape1.length).fill(1), ...shape1];
    const padded2 = [...new Array(maxLen - shape2.length).fill(1), ...shape2];

    return padded1.map((dim1, i) => Math.max(dim1, padded2[i]));
  },

  /**
   * Validate reshape is valid
   */
  isValidReshape(currentShape: Shape, newShape: Shape): boolean {
    const currentNumel = TensorOps.numel(currentShape);
    // Handle -1 in new shape (infer dimension)
    const inferredIndex = newShape.indexOf(-1);
    if (inferredIndex !== -1) {
      const knownNumel = newShape.filter(d => d !== -1).reduce((acc, d) => acc * d, 1);
      if (currentNumel % knownNumel !== 0) return false;
      return true;
    }
    return currentNumel === TensorOps.numel(newShape);
  },

  /**
   * Infer shape with -1 dimension
   */
  inferShape(currentShape: Shape, newShape: Shape): Shape {
    const currentNumel = TensorOps.numel(currentShape);
    const inferredIndex = newShape.indexOf(-1);

    if (inferredIndex === -1) return newShape;

    const knownNumel = newShape.filter(d => d !== -1).reduce((acc, d) => acc * d, 1);
    const inferredDim = currentNumel / knownNumel;

    return newShape.map((d, i) => (i === inferredIndex ? inferredDim : d));
  },
};

/**
 * In-memory tensor implementation for CPU operations
 * Used as reference implementation and for testing
 */
export class Tensor implements ITensor<number> {
  private data: Float32Array;
  private _shape: Shape;
  private _dtype: DataType;
  private _device: Device;
  private _backend: Backend;
  private _requiresGrad: boolean;
  private _grad: Tensor | null = null;

  constructor(data: number[] | Float32Array, shape: Shape, options: TensorOptions = {}) {
    const opts = { ...DEFAULT_TENSOR_OPTIONS, ...options };

    if (data instanceof Float32Array) {
      this.data = data;
    } else {
      this.data = new Float32Array(data);
    }

    this._shape = [...shape];
    this._dtype = opts.dtype;
    this._device = opts.device;
    this._backend = opts.backend;
    this._requiresGrad = opts.requiresGrad;

    // Validate shape matches data length
    const expectedNumel = TensorOps.numel(shape);
    if (this.data.length !== expectedNumel) {
      throw new Error(
        `Shape ${shape} requires ${expectedNumel} elements but got ${this.data.length}`
      );
    }
  }

  get metadata(): TensorMetadata {
    return {
      shape: this._shape,
      dtype: this._dtype,
      device: this._device,
      backend: this._backend,
      requiresGrad: this._requiresGrad,
    };
  }

  get shape(): Shape {
    return [...this._shape];
  }

  get dtype(): DataType {
    return this._dtype;
  }

  get device(): Device {
    return this._device;
  }

  get ndim(): number {
    return this._shape.length;
  }

  get numel(): number {
    return this.data.length;
  }

  /**
   * Get direct access to the underlying data buffer (for in-place operations)
   */
  getDataBuffer(): Float32Array {
    return this.data;
  }

  toArray(): number[] | number[][] | number[][][] | number[][][][] {
    if (this._shape.length === 0) {
      return [this.data[0]];
    }
    if (this._shape.length === 1) {
      return Array.from(this.data);
    }

    return this.reconstructArray(this.data, this._shape);
  }

  private reconstructArray(data: Float32Array, shape: Shape): number[] | number[][] | number[][][] | number[][][][] {
    if (shape.length === 1) {
      return Array.from(data);
    }

    const result: (number[] | number[][] | number[][][])[] = [];
    const stride = TensorOps.numel(shape.slice(1));

    for (let i = 0; i < shape[0]; i++) {
      const slice = data.slice(i * stride, (i + 1) * stride);
      const subArray = this.reconstructArray(slice, shape.slice(1));
      result.push(subArray as number[] | number[][] | number[][][]);
    }

    return result as number[][] | number[][][] | number[][][][];
  }

  flatten(): number[] {
    return Array.from(this.data);
  }

  clone(): Tensor {
    return new Tensor(new Float32Array(this.data), this._shape, {
      dtype: this._dtype,
      device: this._device,
      backend: this._backend,
      requiresGrad: this._requiresGrad,
    });
  }

  to(device: Device): Tensor {
    const tensor = this.clone();
    tensor._device = device;
    return tensor;
  }

  asType(dtype: DataType): Tensor {
    const tensor = this.clone();
    tensor._dtype = dtype;
    return tensor;
  }

  reshape(shape: Shape): Tensor {
    const inferredShape = TensorOps.inferShape(this._shape, shape);
    if (!TensorOps.isValidReshape(this._shape, inferredShape)) {
      throw new Error(`Cannot reshape ${this._shape} to ${shape}`);
    }
    return new Tensor(this.data, inferredShape, {
      dtype: this._dtype,
      device: this._device,
      backend: this._backend,
      requiresGrad: this._requiresGrad,
    });
  }

  transpose(axes?: number[]): Tensor {
    if (this._shape.length !== 2) {
      throw new Error('Transpose currently only supports 2D tensors');
    }

    const [rows, cols] = this._shape;
    const newData = new Float32Array(this.data.length);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        newData[j * rows + i] = this.data[i * cols + j];
      }
    }

    return new Tensor(newData, [cols, rows], {
      dtype: this._dtype,
      device: this._device,
      backend: this._backend,
      requiresGrad: this._requiresGrad,
    });
  }

  private elementWiseOp(other: Tensor | number, op: (a: number, b: number) => number): Tensor {
    if (typeof other === 'number') {
      const newData = new Float32Array(this.data.length);
      for (let i = 0; i < this.data.length; i++) {
        newData[i] = op(this.data[i], other);
      }
      return new Tensor(newData, this._shape, {
        dtype: this._dtype,
        device: this._device,
        backend: this._backend,
        requiresGrad: this._requiresGrad,
      });
    }

    if (!TensorOps.areBroadcastable(this._shape, other._shape)) {
      throw new Error(`Shapes ${this._shape} and ${other._shape} are not broadcastable`);
    }

    // For simplicity, require same shape for now
    if (JSON.stringify(this._shape) !== JSON.stringify(other._shape)) {
      throw new Error('Broadcast not implemented, shapes must match');
    }

    const newData = new Float32Array(this.data.length);
    for (let i = 0; i < this.data.length; i++) {
      newData[i] = op(this.data[i], other.data[i]);
    }

    return new Tensor(newData, this._shape, {
      dtype: this._dtype,
      device: this._device,
      backend: this._backend,
      requiresGrad: this._requiresGrad,
    });
  }

  add(other: Tensor | number): Tensor {
    return this.elementWiseOp(other, (a, b) => a + b);
  }

  sub(other: Tensor | number): Tensor {
    return this.elementWiseOp(other, (a, b) => a - b);
  }

  mul(other: Tensor | number): Tensor {
    return this.elementWiseOp(other, (a, b) => a * b);
  }

  div(other: Tensor | number): Tensor {
    return this.elementWiseOp(other, (a, b) => a / b);
  }

  matmul(other: Tensor): Tensor {
    if (this._shape.length !== 2 || other._shape.length !== 2) {
      throw new Error('matmul requires 2D tensors');
    }

    const [m, k1] = this._shape;
    const [k2, n] = other._shape;

    if (k1 !== k2) {
      throw new Error(`Shapes ${this._shape} and ${other._shape} not aligned for matmul`);
    }

    const newData = new Float32Array(m * n);

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        let sum = 0;
        for (let k = 0; k < k1; k++) {
          sum += this.data[i * k1 + k] * other.data[k * n + j];
        }
        newData[i * n + j] = sum;
      }
    }

    return new Tensor(newData, [m, n], {
      dtype: this._dtype,
      device: this._device,
      backend: this._backend,
      requiresGrad: this._requiresGrad,
    });
  }

  private reduceOp(
    op: (acc: number, val: number) => number,
    initial: number,
    axis?: number | number[],
    keepdims = false
  ): Tensor {
    // Reduce all dimensions
    if (axis === undefined) {
      let result = initial;
      for (let i = 0; i < this.data.length; i++) {
        result = op(result, this.data[i]);
      }
      const shape = keepdims ? this._shape.map(() => 1) : [];
      return new Tensor([result], shape.length > 0 ? shape : [1], {
        dtype: this._dtype,
        device: this._device,
        backend: this._backend,
      });
    }

    // For simplicity, only implement single axis reduction for 2D tensors
    if (this._shape.length !== 2) {
      throw new Error('Axis reduction currently only supports 2D tensors');
    }

    const normalizedAxis = typeof axis === 'number' ? axis : axis[0];
    const [rows, cols] = this._shape;

    if (normalizedAxis === 0) {
      const newData = new Float32Array(cols);
      for (let j = 0; j < cols; j++) {
        let result = initial;
        for (let i = 0; i < rows; i++) {
          result = op(result, this.data[i * cols + j]);
        }
        newData[j] = result;
      }
      return new Tensor(newData, keepdims ? [1, cols] : [cols], {
        dtype: this._dtype,
        device: this._device,
        backend: this._backend,
      });
    } else {
      const newData = new Float32Array(rows);
      for (let i = 0; i < rows; i++) {
        let result = initial;
        for (let j = 0; j < cols; j++) {
          result = op(result, this.data[i * cols + j]);
        }
        newData[i] = result;
      }
      return new Tensor(newData, keepdims ? [rows, 1] : [rows], {
        dtype: this._dtype,
        device: this._device,
        backend: this._backend,
      });
    }
  }

  sum(axis?: number | number[], keepdims = false): Tensor {
    return this.reduceOp((acc, val) => acc + val, 0, axis, keepdims);
  }

  mean(axis?: number | number[], keepdims = false): Tensor {
    const sumTensor = this.sum(axis, keepdims);

    let count: number;
    if (axis === undefined) {
      count = this.data.length;
    } else if (typeof axis === 'number') {
      count = this._shape[axis];
    } else {
      count = axis.reduce((acc, ax) => acc * this._shape[ax], 1);
    }

    return sumTensor.div(count);
  }

  max(axis?: number | number[], keepdims = false): Tensor {
    return this.reduceOp((acc, val) => Math.max(acc, val), -Infinity, axis, keepdims);
  }

  min(axis?: number | number[], keepdims = false): Tensor {
    return this.reduceOp((acc, val) => Math.min(acc, val), Infinity, axis, keepdims);
  }

  std(axis?: number | number[], keepdims = false): Tensor {
    const meanTensor = this.mean(axis, true);
    const diff = this.sub(meanTensor.data[0]);
    const squared = diff.mul(diff);
    const variance = squared.mean(axis, keepdims);

    // Element-wise sqrt
    const newData = new Float32Array(variance.data.length);
    for (let i = 0; i < variance.data.length; i++) {
      newData[i] = Math.sqrt(variance.data[i]);
    }
    return new Tensor(newData, variance._shape, {
      dtype: this._dtype,
      device: this._device,
      backend: this._backend,
    });
  }

  relu(): Tensor {
    const newData = new Float32Array(this.data.length);
    for (let i = 0; i < this.data.length; i++) {
      newData[i] = Math.max(0, this.data[i]);
    }
    return new Tensor(newData, this._shape, {
      dtype: this._dtype,
      device: this._device,
      backend: this._backend,
      requiresGrad: this._requiresGrad,
    });
  }

  sigmoid(): Tensor {
    const newData = new Float32Array(this.data.length);
    for (let i = 0; i < this.data.length; i++) {
      newData[i] = 1 / (1 + Math.exp(-this.data[i]));
    }
    return new Tensor(newData, this._shape, {
      dtype: this._dtype,
      device: this._device,
      backend: this._backend,
      requiresGrad: this._requiresGrad,
    });
  }

  tanh(): Tensor {
    const newData = new Float32Array(this.data.length);
    for (let i = 0; i < this.data.length; i++) {
      newData[i] = Math.tanh(this.data[i]);
    }
    return new Tensor(newData, this._shape, {
      dtype: this._dtype,
      device: this._device,
      backend: this._backend,
      requiresGrad: this._requiresGrad,
    });
  }

  softmax(axis = -1): Tensor {
    if (this._shape.length !== 2) {
      throw new Error('Softmax currently only supports 2D tensors');
    }

    const normalizedAxis = axis < 0 ? this._shape.length + axis : axis;
    const [rows, cols] = this._shape;
    const newData = new Float32Array(this.data.length);

    if (normalizedAxis === 1) {
      for (let i = 0; i < rows; i++) {
        // Find max for numerical stability
        let max = -Infinity;
        for (let j = 0; j < cols; j++) {
          max = Math.max(max, this.data[i * cols + j]);
        }

        // Compute exp and sum
        let sum = 0;
        for (let j = 0; j < cols; j++) {
          const exp = Math.exp(this.data[i * cols + j] - max);
          newData[i * cols + j] = exp;
          sum += exp;
        }

        // Normalize
        for (let j = 0; j < cols; j++) {
          newData[i * cols + j] /= sum;
        }
      }
    } else {
      throw new Error('Softmax only supports axis=1 or axis=-1 for 2D tensors');
    }

    return new Tensor(newData, this._shape, {
      dtype: this._dtype,
      device: this._device,
      backend: this._backend,
      requiresGrad: this._requiresGrad,
    });
  }

  backward(): void {
    // Placeholder for autograd implementation
    if (!this._requiresGrad) {
      throw new Error('Tensor does not require gradients');
    }
  }

  grad(): Tensor | null {
    return this._grad;
  }

  requiresGrad(requires: boolean): Tensor {
    this._requiresGrad = requires;
    return this;
  }
}

/**
 * Default tensor factory for CPU tensors
 */
export class TensorFactory implements ITensorFactory {
  readonly backend = Backend.PYTORCH;

  tensor(
    data: number[] | number[][] | number[][][] | number[][][][],
    options?: TensorOptions
  ): Tensor {
    const flatData = this.flattenData(data);
    const shape = this.inferShape(data);
    return new Tensor(flatData, shape, options);
  }

  private flattenData(data: number[] | number[][] | number[][][] | number[][][][]): number[] {
    if (!Array.isArray(data)) {
      return [data as number];
    }
    if (data.length === 0) {
      return [];
    }
    if (!Array.isArray(data[0])) {
      return data as number[];
    }
    return (data as number[][] | number[][][] | number[][][][]).flatMap(d => this.flattenData(d as number[] | number[][] | number[][][]));
  }

  private inferShape(data: number[] | number[][] | number[][][] | number[][][][]): Shape {
    if (!Array.isArray(data)) {
      return [];
    }
    if (data.length === 0) {
      return [0];
    }
    if (!Array.isArray(data[0])) {
      return [data.length];
    }
    return [data.length, ...this.inferShape(data[0] as number[] | number[][] | number[][][])];
  }

  zeros(shape: Shape, options?: TensorOptions): Tensor {
    const numel = TensorOps.numel(shape);
    return new Tensor(new Float32Array(numel), shape, options);
  }

  ones(shape: Shape, options?: TensorOptions): Tensor {
    const numel = TensorOps.numel(shape);
    const data = new Float32Array(numel).fill(1);
    return new Tensor(data, shape, options);
  }

  eye(n: number, m?: number, options?: TensorOptions): Tensor {
    const cols = m ?? n;
    const data = new Float32Array(n * cols);
    for (let i = 0; i < Math.min(n, cols); i++) {
      data[i * cols + i] = 1;
    }
    return new Tensor(data, [n, cols], options);
  }

  rand(shape: Shape, options?: TensorOptions): Tensor {
    const numel = TensorOps.numel(shape);
    const data = new Float32Array(numel);
    for (let i = 0; i < numel; i++) {
      data[i] = Math.random();
    }
    return new Tensor(data, shape, options);
  }

  randn(shape: Shape, options?: TensorOptions): Tensor {
    const numel = TensorOps.numel(shape);
    const data = new Float32Array(numel);
    // Box-Muller transform for normal distribution
    for (let i = 0; i < numel; i += 2) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
      data[i] = z0;
      if (i + 1 < numel) {
        data[i + 1] = z1;
      }
    }
    return new Tensor(data, shape, options);
  }

  arange(start: number, end: number, step = 1, options?: TensorOptions): Tensor {
    const data: number[] = [];
    for (let i = start; i < end; i += step) {
      data.push(i);
    }
    return new Tensor(data, [data.length], options);
  }

  linspace(start: number, end: number, n: number, options?: TensorOptions): Tensor {
    const data = new Float32Array(n);
    const step = (end - start) / (n - 1);
    for (let i = 0; i < n; i++) {
      data[i] = start + i * step;
    }
    return new Tensor(data, [n], options);
  }

  full(shape: Shape, value: number, options?: TensorOptions): Tensor {
    const numel = TensorOps.numel(shape);
    const data = new Float32Array(numel).fill(value);
    return new Tensor(data, shape, options);
  }

  empty(shape: Shape, options?: TensorOptions): Tensor {
    const numel = TensorOps.numel(shape);
    return new Tensor(new Float32Array(numel), shape, options);
  }
}

// Export default factory instance
export const tensorFactory = new TensorFactory();
