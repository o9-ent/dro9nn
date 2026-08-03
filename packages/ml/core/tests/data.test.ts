import { describe, it, expect } from 'vitest';
import {
  Dataset,
  TensorDataset,
  DataLoader,
  Transforms,
  DatasetUtils,
  Sample,
} from '../src/data';
import { Tensor, TensorFactory } from '../src/tensor';

describe('Dataset', () => {
  describe('constructor', () => {
    it('should create dataset from items', () => {
      const items = [1, 2, 3, 4, 5];
      const dataset = new Dataset(items);

      expect(dataset.length).toBe(5);
    });
  });

  describe('getItem', () => {
    it('should return item at index', () => {
      const dataset = new Dataset([10, 20, 30]);

      expect(dataset.getItem(0)).toBe(10);
      expect(dataset.getItem(1)).toBe(20);
      expect(dataset.getItem(2)).toBe(30);
    });

    it('should throw for out of bounds index', () => {
      const dataset = new Dataset([1, 2, 3]);

      expect(() => dataset.getItem(-1)).toThrow();
      expect(() => dataset.getItem(3)).toThrow();
    });
  });

  describe('map', () => {
    it('should transform items', () => {
      const dataset = new Dataset([1, 2, 3]).map(x => x * 2);

      expect(dataset.getItem(0)).toBe(2);
      expect(dataset.getItem(1)).toBe(4);
      expect(dataset.getItem(2)).toBe(6);
    });

    it('should chain transforms', () => {
      const dataset = new Dataset([1, 2, 3])
        .map(x => x * 2)
        .map(x => x + 1);

      expect(dataset.getItem(0)).toBe(3);
      expect(dataset.getItem(1)).toBe(5);
      expect(dataset.getItem(2)).toBe(7);
    });
  });

  describe('shuffle', () => {
    it('should shuffle with seed for reproducibility', () => {
      const dataset = new Dataset([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      const shuffled1 = dataset.shuffle(42);
      const shuffled2 = dataset.shuffle(42);

      // Same seed should produce same shuffle
      for (let i = 0; i < dataset.length; i++) {
        expect(shuffled1.getItem(i)).toBe(shuffled2.getItem(i));
      }
    });
  });

  describe('take', () => {
    it('should return first n items', () => {
      const dataset = new Dataset([1, 2, 3, 4, 5]).take(3);

      expect(dataset.length).toBe(3);
      expect(dataset.getItem(0)).toBe(1);
      expect(dataset.getItem(2)).toBe(3);
    });
  });

  describe('skip', () => {
    it('should skip first n items', () => {
      const dataset = new Dataset([1, 2, 3, 4, 5]).skip(2);

      expect(dataset.length).toBe(3);
      expect(dataset.getItem(0)).toBe(3);
      expect(dataset.getItem(2)).toBe(5);
    });
  });

  describe('subset', () => {
    it('should return subset by indices', () => {
      const dataset = new Dataset([10, 20, 30, 40, 50]).subset([1, 3, 4]);

      expect(dataset.length).toBe(3);
      expect(dataset.getItem(0)).toBe(20);
      expect(dataset.getItem(1)).toBe(40);
      expect(dataset.getItem(2)).toBe(50);
    });

    it('should throw for invalid indices', () => {
      const dataset = new Dataset([1, 2, 3]);

      expect(() => dataset.subset([0, 5])).toThrow();
    });
  });
});

describe('DataLoader', () => {
  describe('batching', () => {
    it('should split dataset into batches', () => {
      const dataset = new Dataset([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const loader = new DataLoader(dataset, { batchSize: 3 });

      expect(loader.numBatches).toBe(4);

      const batches = [...loader];
      expect(batches.length).toBe(4);
      expect(batches[0].size).toBe(3);
      expect(batches[3].size).toBe(1); // Last batch
    });

    it('should drop last incomplete batch when configured', () => {
      const dataset = new Dataset([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const loader = new DataLoader(dataset, { batchSize: 3, dropLast: true });

      expect(loader.numBatches).toBe(3);

      const batches = [...loader];
      expect(batches.length).toBe(3);
      batches.forEach(batch => expect(batch.size).toBe(3));
    });
  });

  describe('shuffling', () => {
    it('should shuffle when configured', () => {
      const items = Array.from({ length: 100 }, (_, i) => i);
      const dataset = new Dataset(items);
      const loader = new DataLoader(dataset, { batchSize: 10, shuffle: true });

      const batch = loader.getBatch(0) as { data: number[] };
      const ordered = batch.data.every((v, i) => v === i);

      // Very unlikely to be in order if shuffled
      expect(ordered).toBe(false);
    });
  });

  describe('with samples', () => {
    it('should extract data and labels from samples', () => {
      const samples: Sample<number>[] = [
        { data: 1, label: 'a' },
        { data: 2, label: 'b' },
        { data: 3, label: 'c' },
      ];
      const dataset = new Dataset(samples);
      const loader = new DataLoader(dataset, { batchSize: 3 });

      const batch = loader.getBatch(0) as { data: number[]; labels: string[] };
      expect(batch.data).toEqual([1, 2, 3]);
      expect(batch.labels).toEqual(['a', 'b', 'c']);
    });
  });
});

describe('Transforms', () => {
  describe('normalize', () => {
    it('should normalize to [0, 1]', () => {
      const normalize = Transforms.normalize();
      const result = normalize([0, 50, 100]);

      expect(result[0]).toBeCloseTo(0, 5);
      expect(result[1]).toBeCloseTo(0.5, 5);
      expect(result[2]).toBeCloseTo(1, 5);
    });

    it('should normalize to custom range', () => {
      const normalize = Transforms.normalize(-1, 1);
      const result = normalize([0, 50, 100]);

      expect(result[0]).toBeCloseTo(-1, 5);
      expect(result[1]).toBeCloseTo(0, 5);
      expect(result[2]).toBeCloseTo(1, 5);
    });

    it('should handle constant values', () => {
      const normalize = Transforms.normalize();
      const result = normalize([5, 5, 5]);

      expect(result.every(v => v === 0.5)).toBe(true);
    });
  });

  describe('standardize', () => {
    it('should standardize to zero mean and unit variance', () => {
      const standardize = Transforms.standardize();
      const result = standardize([1, 2, 3, 4, 5]);

      const mean = result.reduce((a, b) => a + b, 0) / result.length;
      expect(mean).toBeCloseTo(0, 5);

      const variance = result.reduce((sum, v) => sum + v * v, 0) / result.length;
      expect(variance).toBeCloseTo(1, 1);
    });
  });

  describe('oneHot', () => {
    it('should one-hot encode labels', () => {
      const oneHot = Transforms.oneHot(5);

      expect(oneHot(0)).toEqual([1, 0, 0, 0, 0]);
      expect(oneHot(2)).toEqual([0, 0, 1, 0, 0]);
      expect(oneHot(4)).toEqual([0, 0, 0, 0, 1]);
    });
  });

  describe('addNoise', () => {
    it('should add noise to data', () => {
      const addNoise = Transforms.addNoise(0.1);
      const original = [1, 2, 3, 4, 5];
      const result = addNoise(original);

      // Values should be modified but within noise range
      for (let i = 0; i < original.length; i++) {
        expect(Math.abs(result[i] - original[i])).toBeLessThanOrEqual(0.1);
      }
    });
  });

  describe('compose', () => {
    it('should compose multiple transforms', () => {
      const double = (x: number[]) => x.map(v => v * 2);
      const addOne = (x: number[]) => x.map(v => v + 1);
      const composed = Transforms.compose(double, addOne);

      const result = composed([1, 2, 3]);
      expect(result).toEqual([3, 5, 7]);
    });
  });
});

describe('DatasetUtils', () => {
  describe('trainTestSplit', () => {
    it('should split dataset', () => {
      const dataset = new Dataset(Array.from({ length: 100 }, (_, i) => i));
      const { train, test } = DatasetUtils.trainTestSplit(dataset, 0.2);

      expect(train.length).toBe(80);
      expect(test.length).toBe(20);
    });

    it('should be reproducible with seed', () => {
      const dataset = new Dataset(Array.from({ length: 100 }, (_, i) => i));
      const split1 = DatasetUtils.trainTestSplit(dataset, 0.2, 42);
      const split2 = DatasetUtils.trainTestSplit(dataset, 0.2, 42);

      for (let i = 0; i < split1.train.length; i++) {
        expect(split1.train.getItem(i)).toBe(split2.train.getItem(i));
      }
    });
  });

  describe('kFoldSplit', () => {
    it('should create k folds', () => {
      const dataset = new Dataset(Array.from({ length: 100 }, (_, i) => i));
      const folds = DatasetUtils.kFoldSplit(dataset, 5);

      expect(folds.length).toBe(5);

      // Each fold should have roughly same validation size
      for (const fold of folds) {
        expect(fold.validation.length).toBe(20);
        expect(fold.train.length).toBe(80);
      }
    });
  });

  describe('fromArrays', () => {
    it('should create dataset from data and labels', () => {
      const data = [[1, 2], [3, 4], [5, 6]];
      const labels = [0, 1, 0];
      const dataset = DatasetUtils.fromArrays(data, labels);

      expect(dataset.length).toBe(3);

      const item = dataset.getItem(0);
      expect(item.data).toEqual([1, 2]);
      expect(item.label).toBe(0);
    });

    it('should work without labels', () => {
      const data = [[1, 2], [3, 4], [5, 6]];
      const dataset = DatasetUtils.fromArrays(data);

      expect(dataset.length).toBe(3);

      const item = dataset.getItem(0);
      expect(item.data).toEqual([1, 2]);
      expect(item.label).toBeUndefined();
    });
  });
});

describe('TensorDataset', () => {
  const factory = new TensorFactory();

  it('should create dataset from tensor samples', () => {
    const samples = [
      { data: factory.tensor([1, 2, 3]), label: factory.tensor([1]) },
      { data: factory.tensor([4, 5, 6]), label: factory.tensor([0]) },
    ];
    const dataset = new TensorDataset(samples);

    expect(dataset.length).toBe(2);

    const item = dataset.getItem(0);
    expect(item.data.flatten()).toEqual([1, 2, 3]);
    expect(item.label?.flatten()).toEqual([1]);
  });

  it('should support shuffle', () => {
    const samples = Array.from({ length: 10 }, (_, i) => ({
      data: factory.tensor([i]),
      label: factory.tensor([i % 2]),
    }));
    const dataset = new TensorDataset(samples);

    const shuffled = dataset.shuffle(42);
    expect(shuffled.length).toBe(10);
  });
});
