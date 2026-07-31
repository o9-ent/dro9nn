import { describe, it, expect } from 'vitest';
import {
  Tensor,
  TensorFactory,
  TensorOps,
  DEFAULT_TENSOR_OPTIONS,
  Shape,
} from '../src/tensor';
import { Backend, Device, DataType } from '@o9nn/core';

describe('TensorOps', () => {
  describe('numel', () => {
    it('should calculate number of elements', () => {
      expect(TensorOps.numel([2, 3, 4])).toBe(24);
      expect(TensorOps.numel([10])).toBe(10);
      expect(TensorOps.numel([])).toBe(1);
    });
  });

  describe('areBroadcastable', () => {
    it('should return true for compatible shapes', () => {
      expect(TensorOps.areBroadcastable([2, 3], [2, 3])).toBe(true);
      expect(TensorOps.areBroadcastable([1, 3], [2, 1])).toBe(true);
      expect(TensorOps.areBroadcastable([3], [2, 3])).toBe(true);
    });

    it('should return false for incompatible shapes', () => {
      expect(TensorOps.areBroadcastable([2, 3], [2, 4])).toBe(false);
      expect(TensorOps.areBroadcastable([3, 4], [2, 3])).toBe(false);
    });
  });

  describe('broadcastShape', () => {
    it('should compute broadcast shape', () => {
      expect(TensorOps.broadcastShape([2, 3], [2, 3])).toEqual([2, 3]);
      expect(TensorOps.broadcastShape([1, 3], [2, 1])).toEqual([2, 3]);
      expect(TensorOps.broadcastShape([3], [2, 3])).toEqual([2, 3]);
    });
  });

  describe('isValidReshape', () => {
    it('should return true for valid reshapes', () => {
      expect(TensorOps.isValidReshape([2, 3], [6])).toBe(true);
      expect(TensorOps.isValidReshape([2, 3], [3, 2])).toBe(true);
      expect(TensorOps.isValidReshape([2, 3, 4], [2, 12])).toBe(true);
    });

    it('should return false for invalid reshapes', () => {
      expect(TensorOps.isValidReshape([2, 3], [5])).toBe(false);
      expect(TensorOps.isValidReshape([2, 3], [3, 3])).toBe(false);
    });

    it('should handle -1 dimension', () => {
      expect(TensorOps.isValidReshape([2, 3], [-1])).toBe(true);
      expect(TensorOps.isValidReshape([2, 3, 4], [2, -1])).toBe(true);
    });
  });

  describe('inferShape', () => {
    it('should infer dimension with -1', () => {
      expect(TensorOps.inferShape([2, 3], [-1])).toEqual([6]);
      expect(TensorOps.inferShape([2, 3, 4], [2, -1])).toEqual([2, 12]);
      expect(TensorOps.inferShape([24], [2, 3, -1])).toEqual([2, 3, 4]);
    });

    it('should return shape unchanged without -1', () => {
      expect(TensorOps.inferShape([2, 3], [3, 2])).toEqual([3, 2]);
    });
  });
});

describe('Tensor', () => {
  describe('constructor', () => {
    it('should create tensor from data and shape', () => {
      const tensor = new Tensor([1, 2, 3, 4, 5, 6], [2, 3]);
      expect(tensor.shape).toEqual([2, 3]);
      expect(tensor.numel).toBe(6);
      expect(tensor.ndim).toBe(2);
    });

    it('should throw for mismatched shape and data', () => {
      expect(() => new Tensor([1, 2, 3], [2, 3])).toThrow();
    });
  });

  describe('metadata', () => {
    it('should return correct metadata', () => {
      const tensor = new Tensor([1, 2, 3, 4], [2, 2], {
        dtype: DataType.FLOAT32,
        device: Device.CPU,
        backend: Backend.PYTORCH,
      });

      const meta = tensor.metadata;
      expect(meta.shape).toEqual([2, 2]);
      expect(meta.dtype).toBe(DataType.FLOAT32);
      expect(meta.device).toBe(Device.CPU);
      expect(meta.backend).toBe(Backend.PYTORCH);
    });
  });

  describe('toArray', () => {
    it('should convert 1D tensor to array', () => {
      const tensor = new Tensor([1, 2, 3], [3]);
      expect(tensor.toArray()).toEqual([1, 2, 3]);
    });

    it('should convert 2D tensor to nested array', () => {
      const tensor = new Tensor([1, 2, 3, 4, 5, 6], [2, 3]);
      expect(tensor.toArray()).toEqual([
        [1, 2, 3],
        [4, 5, 6],
      ]);
    });
  });

  describe('flatten', () => {
    it('should return flattened array', () => {
      const tensor = new Tensor([1, 2, 3, 4, 5, 6], [2, 3]);
      expect(tensor.flatten()).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('clone', () => {
    it('should create independent copy', () => {
      const tensor = new Tensor([1, 2, 3, 4], [2, 2]);
      const cloned = tensor.clone();

      expect(cloned.shape).toEqual(tensor.shape);
      expect(cloned.flatten()).toEqual(tensor.flatten());
    });
  });

  describe('reshape', () => {
    it('should reshape tensor', () => {
      const tensor = new Tensor([1, 2, 3, 4, 5, 6], [2, 3]);
      const reshaped = tensor.reshape([3, 2]);

      expect(reshaped.shape).toEqual([3, 2]);
      expect(reshaped.flatten()).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should handle -1 dimension', () => {
      const tensor = new Tensor([1, 2, 3, 4, 5, 6], [2, 3]);
      const reshaped = tensor.reshape([-1]);

      expect(reshaped.shape).toEqual([6]);
    });

    it('should throw for invalid reshape', () => {
      const tensor = new Tensor([1, 2, 3, 4, 5, 6], [2, 3]);
      expect(() => tensor.reshape([2, 4])).toThrow();
    });
  });

  describe('transpose', () => {
    it('should transpose 2D tensor', () => {
      const tensor = new Tensor([1, 2, 3, 4, 5, 6], [2, 3]);
      const transposed = tensor.transpose();

      expect(transposed.shape).toEqual([3, 2]);
      expect(transposed.toArray()).toEqual([
        [1, 4],
        [2, 5],
        [3, 6],
      ]);
    });
  });

  describe('element-wise operations', () => {
    it('should add tensors', () => {
      const a = new Tensor([1, 2, 3, 4], [2, 2]);
      const b = new Tensor([5, 6, 7, 8], [2, 2]);
      const result = a.add(b);

      expect(result.flatten()).toEqual([6, 8, 10, 12]);
    });

    it('should add scalar', () => {
      const a = new Tensor([1, 2, 3, 4], [2, 2]);
      const result = a.add(10);

      expect(result.flatten()).toEqual([11, 12, 13, 14]);
    });

    it('should subtract tensors', () => {
      const a = new Tensor([10, 20, 30, 40], [2, 2]);
      const b = new Tensor([1, 2, 3, 4], [2, 2]);
      const result = a.sub(b);

      expect(result.flatten()).toEqual([9, 18, 27, 36]);
    });

    it('should multiply tensors', () => {
      const a = new Tensor([1, 2, 3, 4], [2, 2]);
      const b = new Tensor([2, 2, 2, 2], [2, 2]);
      const result = a.mul(b);

      expect(result.flatten()).toEqual([2, 4, 6, 8]);
    });

    it('should divide tensors', () => {
      const a = new Tensor([10, 20, 30, 40], [2, 2]);
      const b = new Tensor([2, 4, 5, 8], [2, 2]);
      const result = a.div(b);

      expect(result.flatten()).toEqual([5, 5, 6, 5]);
    });
  });

  describe('matmul', () => {
    it('should perform matrix multiplication', () => {
      const a = new Tensor([1, 2, 3, 4], [2, 2]);
      const b = new Tensor([5, 6, 7, 8], [2, 2]);
      const result = a.matmul(b);

      // [1,2] * [5,6] = [1*5+2*7, 1*6+2*8] = [19, 22]
      // [3,4]   [7,8]   [3*5+4*7, 3*6+4*8]   [43, 50]
      expect(result.shape).toEqual([2, 2]);
      expect(result.flatten()).toEqual([19, 22, 43, 50]);
    });

    it('should handle non-square matrices', () => {
      const a = new Tensor([1, 2, 3, 4, 5, 6], [2, 3]); // 2x3
      const b = new Tensor([1, 2, 3, 4, 5, 6], [3, 2]); // 3x2
      const result = a.matmul(b);

      expect(result.shape).toEqual([2, 2]);
    });

    it('should throw for incompatible shapes', () => {
      const a = new Tensor([1, 2, 3, 4], [2, 2]);
      const b = new Tensor([1, 2, 3, 4, 5, 6], [3, 2]);

      expect(() => a.matmul(b)).toThrow();
    });
  });

  describe('reductions', () => {
    it('should compute sum', () => {
      const tensor = new Tensor([1, 2, 3, 4, 5, 6], [2, 3]);
      const sum = tensor.sum();

      expect(sum.flatten()[0]).toBe(21);
    });

    it('should compute sum along axis', () => {
      const tensor = new Tensor([1, 2, 3, 4, 5, 6], [2, 3]);

      const sumAxis0 = tensor.sum(0);
      expect(sumAxis0.flatten()).toEqual([5, 7, 9]);

      const sumAxis1 = tensor.sum(1);
      expect(sumAxis1.flatten()).toEqual([6, 15]);
    });

    it('should compute mean', () => {
      const tensor = new Tensor([1, 2, 3, 4, 5, 6], [2, 3]);
      const mean = tensor.mean();

      expect(mean.flatten()[0]).toBe(3.5);
    });

    it('should compute max', () => {
      const tensor = new Tensor([1, 5, 3, 4, 2, 6], [2, 3]);
      const max = tensor.max();

      expect(max.flatten()[0]).toBe(6);
    });

    it('should compute min', () => {
      const tensor = new Tensor([1, 5, 3, 4, 2, 6], [2, 3]);
      const min = tensor.min();

      expect(min.flatten()[0]).toBe(1);
    });
  });

  describe('activations', () => {
    it('should apply relu', () => {
      const tensor = new Tensor([-2, -1, 0, 1, 2], [5]);
      const result = tensor.relu();

      expect(result.flatten()).toEqual([0, 0, 0, 1, 2]);
    });

    it('should apply sigmoid', () => {
      const tensor = new Tensor([0], [1]);
      const result = tensor.sigmoid();

      expect(result.flatten()[0]).toBeCloseTo(0.5, 5);
    });

    it('should apply tanh', () => {
      const tensor = new Tensor([0], [1]);
      const result = tensor.tanh();

      expect(result.flatten()[0]).toBeCloseTo(0, 5);
    });

    it('should apply softmax', () => {
      const tensor = new Tensor([1, 2, 3, 1, 2, 3], [2, 3]);
      const result = tensor.softmax(-1);

      // Each row should sum to 1
      const data = result.toArray() as number[][];
      const rowSum0 = data[0].reduce((a, b) => a + b, 0);
      const rowSum1 = data[1].reduce((a, b) => a + b, 0);

      expect(rowSum0).toBeCloseTo(1, 5);
      expect(rowSum1).toBeCloseTo(1, 5);
    });
  });
});

describe('TensorFactory', () => {
  const factory = new TensorFactory();

  describe('zeros', () => {
    it('should create tensor filled with zeros', () => {
      const tensor = factory.zeros([2, 3]);

      expect(tensor.shape).toEqual([2, 3]);
      expect(tensor.flatten().every(v => v === 0)).toBe(true);
    });
  });

  describe('ones', () => {
    it('should create tensor filled with ones', () => {
      const tensor = factory.ones([3, 4]);

      expect(tensor.shape).toEqual([3, 4]);
      expect(tensor.flatten().every(v => v === 1)).toBe(true);
    });
  });

  describe('eye', () => {
    it('should create identity matrix', () => {
      const tensor = factory.eye(3);

      expect(tensor.shape).toEqual([3, 3]);
      expect(tensor.toArray()).toEqual([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]);
    });

    it('should create non-square eye matrix', () => {
      const tensor = factory.eye(2, 3);

      expect(tensor.shape).toEqual([2, 3]);
      expect(tensor.toArray()).toEqual([
        [1, 0, 0],
        [0, 1, 0],
      ]);
    });
  });

  describe('rand', () => {
    it('should create tensor with random values in [0, 1)', () => {
      const tensor = factory.rand([10, 10]);
      const values = tensor.flatten();

      expect(tensor.shape).toEqual([10, 10]);
      expect(values.every(v => v >= 0 && v < 1)).toBe(true);
    });
  });

  describe('randn', () => {
    it('should create tensor with random normal values', () => {
      const tensor = factory.randn([1000]);
      const values = tensor.flatten();
      const mean = values.reduce((a, b) => a + b, 0) / values.length;

      expect(tensor.shape).toEqual([1000]);
      // Mean should be close to 0 for large samples
      expect(Math.abs(mean)).toBeLessThan(0.2);
    });
  });

  describe('arange', () => {
    it('should create range tensor', () => {
      const tensor = factory.arange(0, 5);

      expect(tensor.shape).toEqual([5]);
      expect(tensor.flatten()).toEqual([0, 1, 2, 3, 4]);
    });

    it('should support step parameter', () => {
      const tensor = factory.arange(0, 10, 2);

      expect(tensor.flatten()).toEqual([0, 2, 4, 6, 8]);
    });
  });

  describe('linspace', () => {
    it('should create linearly spaced tensor', () => {
      const tensor = factory.linspace(0, 1, 5);

      expect(tensor.shape).toEqual([5]);
      expect(tensor.flatten()[0]).toBeCloseTo(0, 5);
      expect(tensor.flatten()[4]).toBeCloseTo(1, 5);
    });
  });

  describe('full', () => {
    it('should create tensor filled with value', () => {
      const tensor = factory.full([2, 3], 7);

      expect(tensor.shape).toEqual([2, 3]);
      expect(tensor.flatten().every(v => v === 7)).toBe(true);
    });
  });

  describe('tensor', () => {
    it('should create tensor from 1D array', () => {
      const tensor = factory.tensor([1, 2, 3]);

      expect(tensor.shape).toEqual([3]);
      expect(tensor.flatten()).toEqual([1, 2, 3]);
    });

    it('should create tensor from 2D array', () => {
      const tensor = factory.tensor([
        [1, 2, 3],
        [4, 5, 6],
      ]);

      expect(tensor.shape).toEqual([2, 3]);
      expect(tensor.flatten()).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should create tensor from 3D array', () => {
      const tensor = factory.tensor([
        [[1, 2], [3, 4]],
        [[5, 6], [7, 8]],
      ]);

      expect(tensor.shape).toEqual([2, 2, 2]);
      expect(tensor.flatten()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });
});
