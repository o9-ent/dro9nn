import { describe, it, expect } from 'vitest';
import {
  LinearLayer,
  ReLULayer,
  SigmoidLayer,
  TanhLayer,
  SoftmaxLayer,
  DropoutLayer,
  Sequential,
  MSELoss,
  CrossEntropyLoss,
  BCELoss,
  SGD,
  Adam,
  StepLRScheduler,
  CosineAnnealingScheduler,
  createModel,
  ModelBuilder,
} from '../src/model';
import { Tensor, TensorFactory } from '../src/tensor';
import { Backend, Device } from '@o9nn/core';

describe('LinearLayer', () => {
  const factory = new TensorFactory();

  it('should create layer with correct parameters', () => {
    const layer = new LinearLayer({
      params: { inFeatures: 10, outFeatures: 5 },
    });

    expect(layer.type).toBe('linear');
    const params = layer.parameters();
    expect(params.length).toBe(2); // weight and bias
    expect(params[0].data.shape).toEqual([5, 10]); // outFeatures x inFeatures
    expect(params[1].data.shape).toEqual([5]); // outFeatures
  });

  it('should create layer without bias', () => {
    const layer = new LinearLayer({
      params: { inFeatures: 10, outFeatures: 5, bias: false },
    });

    const params = layer.parameters();
    expect(params.length).toBe(1); // only weight
  });

  it('should compute forward pass for 2D input', () => {
    const layer = new LinearLayer({
      params: { inFeatures: 3, outFeatures: 2 },
    });

    const input = factory.tensor([
      [1, 2, 3],
      [4, 5, 6],
    ]); // batch_size=2, in_features=3

    const output = layer.forward(input);
    expect(output.shape).toEqual([2, 2]); // batch_size=2, out_features=2
  });

  it('should compute forward pass for 1D input', () => {
    const layer = new LinearLayer({
      params: { inFeatures: 3, outFeatures: 2 },
    });

    const input = factory.tensor([1, 2, 3]); // in_features=3

    const output = layer.forward(input);
    expect(output.shape).toEqual([2]); // out_features=2
  });

  it('should compute correct output shape', () => {
    const layer = new LinearLayer({
      params: { inFeatures: 10, outFeatures: 5 },
    });

    expect(layer.outputShape([32, 10])).toEqual([32, 5]);
    expect(layer.outputShape([10])).toEqual([5]);
  });
});

describe('Activation Layers', () => {
  const factory = new TensorFactory();

  describe('ReLULayer', () => {
    it('should apply ReLU activation', () => {
      const layer = new ReLULayer();
      const input = factory.tensor([-2, -1, 0, 1, 2]);
      const output = layer.forward(input);

      expect(output.flatten()).toEqual([0, 0, 0, 1, 2]);
    });

    it('should have no parameters', () => {
      const layer = new ReLULayer();
      expect(layer.parameters()).toEqual([]);
    });
  });

  describe('SigmoidLayer', () => {
    it('should apply sigmoid activation', () => {
      const layer = new SigmoidLayer();
      const input = factory.tensor([0]);
      const output = layer.forward(input);

      expect(output.flatten()[0]).toBeCloseTo(0.5, 5);
    });
  });

  describe('TanhLayer', () => {
    it('should apply tanh activation', () => {
      const layer = new TanhLayer();
      const input = factory.tensor([0]);
      const output = layer.forward(input);

      expect(output.flatten()[0]).toBeCloseTo(0, 5);
    });
  });

  describe('SoftmaxLayer', () => {
    it('should apply softmax activation', () => {
      const layer = new SoftmaxLayer();
      const input = factory.tensor([
        [1, 2, 3],
        [1, 2, 3],
      ]);
      const output = layer.forward(input);

      // Each row should sum to 1
      const data = output.toArray() as number[][];
      expect(data[0].reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
      expect(data[1].reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
    });
  });
});

describe('DropoutLayer', () => {
  const factory = new TensorFactory();

  it('should drop values during training', () => {
    const layer = new DropoutLayer(0.5);
    const input = factory.ones([100]);
    const output = layer.forward(input);

    const values = output.flatten();
    const zeros = values.filter(v => v === 0).length;

    // Should have some zeros (dropped values)
    expect(zeros).toBeGreaterThan(0);
    // But not all zeros
    expect(zeros).toBeLessThan(100);
  });

  it('should not drop values during evaluation', () => {
    const layer = new DropoutLayer(0.5);
    layer.setTraining(false);

    const input = factory.ones([100]);
    const output = layer.forward(input);

    const values = output.flatten();
    expect(values.every(v => v === 1)).toBe(true);
  });
});

describe('Sequential', () => {
  const factory = new TensorFactory();

  it('should create model with layers', () => {
    const model = new Sequential([
      new LinearLayer({ params: { inFeatures: 10, outFeatures: 5 } }),
      new ReLULayer(),
      new LinearLayer({ params: { inFeatures: 5, outFeatures: 2 } }),
    ]);

    expect(model.layers.length).toBe(3);
  });

  it('should forward through all layers', () => {
    const model = new Sequential([
      new LinearLayer({ params: { inFeatures: 4, outFeatures: 3 } }),
      new ReLULayer(),
      new LinearLayer({ params: { inFeatures: 3, outFeatures: 2 } }),
    ]);

    const input = factory.rand([8, 4]); // batch_size=8, features=4
    const output = model.forward(input);

    expect(output.shape).toEqual([8, 2]);
  });

  it('should collect all parameters', () => {
    const model = new Sequential([
      new LinearLayer({ params: { inFeatures: 10, outFeatures: 5 } }),
      new ReLULayer(),
      new LinearLayer({ params: { inFeatures: 5, outFeatures: 2 } }),
    ]);

    const params = model.parameters();
    // 2 linear layers x (weight + bias) = 4 parameters
    expect(params.length).toBe(4);
  });

  it('should support state dict', () => {
    const model = new Sequential([
      new LinearLayer({ params: { inFeatures: 4, outFeatures: 2 } }),
    ]);

    const stateDict = model.stateDict();
    expect(Object.keys(stateDict).length).toBe(2); // weight and bias
  });

  it('should switch between train and eval mode', () => {
    const model = new Sequential([
      new LinearLayer({ params: { inFeatures: 4, outFeatures: 4 } }),
      new DropoutLayer(0.5),
    ]);

    expect(model.isTraining).toBe(true);

    model.eval();
    expect(model.isTraining).toBe(false);

    model.train();
    expect(model.isTraining).toBe(true);
  });

  it('should add layers', () => {
    const model = new Sequential([]);
    model.add(new LinearLayer({ params: { inFeatures: 4, outFeatures: 2 } }));
    model.add(new ReLULayer());

    expect(model.layers.length).toBe(2);
  });
});

describe('Loss Functions', () => {
  const factory = new TensorFactory();

  describe('MSELoss', () => {
    it('should compute mean squared error', () => {
      const loss = new MSELoss();
      const pred = factory.tensor([1, 2, 3, 4]);
      const target = factory.tensor([1, 2, 3, 4]);

      const result = loss.compute(pred, target);
      expect(result.flatten()[0]).toBeCloseTo(0, 5);
    });

    it('should compute non-zero loss for different values', () => {
      const loss = new MSELoss();
      const pred = factory.tensor([1, 2, 3, 4]);
      const target = factory.tensor([2, 3, 4, 5]); // All off by 1

      const result = loss.compute(pred, target);
      expect(result.flatten()[0]).toBeCloseTo(1, 5); // Mean of [1,1,1,1]
    });
  });

  describe('BCELoss', () => {
    it('should compute binary cross entropy', () => {
      const loss = new BCELoss();
      const pred = factory.tensor([0.5, 0.5]);
      const target = factory.tensor([1, 0]);

      const result = loss.compute(pred, target);
      expect(result.flatten()[0]).toBeGreaterThan(0);
    });
  });

  describe('CrossEntropyLoss', () => {
    it('should compute cross entropy loss', () => {
      const loss = new CrossEntropyLoss();
      // Perfect predictions (high confidence correct class)
      const pred = factory.tensor([
        [10, 0, 0], // Class 0
        [0, 10, 0], // Class 1
      ]);
      const target = factory.tensor([0, 1]);

      const result = loss.compute(pred, target);
      expect(result.flatten()[0]).toBeLessThan(0.1); // Low loss for confident correct predictions
    });
  });
});

describe('Optimizers', () => {
  const factory = new TensorFactory();

  describe('SGD', () => {
    it('should update parameters', () => {
      const param: { name: string; data: Tensor; requiresGrad: boolean; grad?: Tensor } = {
        name: 'weight',
        data: factory.ones([3]),
        requiresGrad: true,
        grad: factory.full([3], 0.1),
      };

      const optimizer = new SGD([param], 0.1);
      optimizer.step();

      // params should be updated: 1 - 0.1 * 0.1 = 0.99
      expect(param.data.flatten()[0]).toBeCloseTo(0.99, 5);
    });

    it('should zero gradients', () => {
      const param: { name: string; data: Tensor; requiresGrad: boolean; grad?: Tensor } = {
        name: 'weight',
        data: factory.ones([3]),
        requiresGrad: true,
        grad: factory.full([3], 0.1),
      };

      const optimizer = new SGD([param], 0.1);
      optimizer.zeroGrad();

      expect(param.grad).toBeUndefined();
    });
  });

  describe('Adam', () => {
    it('should update parameters', () => {
      const param: { name: string; data: Tensor; requiresGrad: boolean; grad?: Tensor } = {
        name: 'weight',
        data: factory.ones([3]),
        requiresGrad: true,
        grad: factory.full([3], 0.1),
      };

      const optimizer = new Adam([param], 0.001);
      const initialValue = param.data.flatten()[0];

      optimizer.step();

      // Value should have changed
      expect(param.data.flatten()[0]).not.toBeCloseTo(initialValue, 5);
    });

    it('should update learning rate', () => {
      const optimizer = new Adam([], 0.001);
      expect(optimizer.learningRate).toBe(0.001);

      optimizer.setLearningRate(0.0001);
      expect(optimizer.learningRate).toBe(0.0001);
    });
  });
});

describe('Schedulers', () => {
  describe('StepLRScheduler', () => {
    it('should decay learning rate at steps', () => {
      const optimizer = new Adam([], 0.1);
      const scheduler = new StepLRScheduler(optimizer, 10, 0.1);

      // Initial LR
      expect(scheduler.getLr()).toBe(0.1);

      // After 10 steps
      for (let i = 0; i < 10; i++) scheduler.step();
      expect(scheduler.getLr()).toBeCloseTo(0.01, 5);

      // After 20 steps
      for (let i = 0; i < 10; i++) scheduler.step();
      expect(scheduler.getLr()).toBeCloseTo(0.001, 5);
    });
  });

  describe('CosineAnnealingScheduler', () => {
    it('should decay learning rate with cosine annealing', () => {
      const optimizer = new Adam([], 0.1);
      const scheduler = new CosineAnnealingScheduler(optimizer, 100, 0);

      // Initial LR
      expect(scheduler.getLr()).toBe(0.1);

      // Halfway through
      for (let i = 0; i < 50; i++) scheduler.step();
      expect(scheduler.getLr()).toBeCloseTo(0.05, 1);

      // At end
      for (let i = 0; i < 50; i++) scheduler.step();
      expect(scheduler.getLr()).toBeCloseTo(0, 1);
    });
  });
});

describe('ModelBuilder', () => {
  it('should build model with fluent API', () => {
    const model = createModel()
      .linear(784, 256)
      .relu()
      .dropout(0.2)
      .linear(256, 128)
      .relu()
      .linear(128, 10)
      .softmax()
      .build('mnist_classifier');

    expect(model.name).toBe('mnist_classifier');
    expect(model.layers.length).toBe(7);
  });

  it('should support all layer types', () => {
    const model = createModel()
      .linear(10, 10)
      .relu()
      .sigmoid()
      .tanh()
      .softmax()
      .dropout(0.5)
      .build();

    expect(model.layers.length).toBe(6);
  });

  it('should forward through built model', () => {
    const factory = new TensorFactory();
    const model = createModel()
      .linear(4, 8)
      .relu()
      .linear(8, 2)
      .build();

    const input = factory.rand([2, 4]);
    const output = model.forward(input);

    expect(output.shape).toEqual([2, 2]);
  });
});
