import { describe, it, expect } from 'vitest';
import {
  Backend,
  Device,
  DataType,
  ModelConfig,
  InferenceOptions,
  AgentConfig,
  GNNConfig,
  ESNConfig,
} from '../src/types';

describe('Types', () => {
  describe('Backend enum', () => {
    it('should have correct values', () => {
      expect(Backend.PYTORCH).toBe('pytorch');
      expect(Backend.JAX).toBe('jax');
      expect(Backend.TENSORFLOW).toBe('tensorflow');
      expect(Backend.ONNX).toBe('onnx');
    });
  });

  describe('Device enum', () => {
    it('should have correct values', () => {
      expect(Device.CPU).toBe('cpu');
      expect(Device.CUDA).toBe('cuda');
      expect(Device.MPS).toBe('mps');
      expect(Device.TPU).toBe('tpu');
    });
  });

  describe('DataType enum', () => {
    it('should have correct values', () => {
      expect(DataType.FLOAT16).toBe('float16');
      expect(DataType.FLOAT32).toBe('float32');
      expect(DataType.INT8).toBe('int8');
      expect(DataType.BFLOAT16).toBe('bfloat16');
    });
  });
});

describe('ModelConfig', () => {
  it('should create a valid model config', () => {
    const config: ModelConfig = {
      name: 'test-model',
      backend: Backend.PYTORCH,
      device: Device.CPU,
      dtype: DataType.FLOAT32,
    };

    expect(config.name).toBe('test-model');
    expect(config.backend).toBe(Backend.PYTORCH);
    expect(config.device).toBe(Device.CPU);
  });

  it('should support optional fields', () => {
    const config: ModelConfig = {
      name: 'test-model',
      version: '1.0.0',
      path: '/models/test',
      backend: Backend.JAX,
      device: Device.CUDA,
      options: { batch_size: 32 },
    };

    expect(config.version).toBe('1.0.0');
    expect(config.path).toBe('/models/test');
    expect(config.options?.batch_size).toBe(32);
  });
});

describe('InferenceOptions', () => {
  it('should create valid inference options', () => {
    const options: InferenceOptions = {
      batchSize: 16,
      maxLength: 512,
      temperature: 0.7,
      topK: 50,
      topP: 0.9,
    };

    expect(options.batchSize).toBe(16);
    expect(options.maxLength).toBe(512);
    expect(options.temperature).toBe(0.7);
  });
});

describe('AgentConfig', () => {
  it('should create a valid agent config', () => {
    const config: AgentConfig = {
      name: 'test-agent',
      model: {
        name: 'llama-3',
        backend: Backend.PYTORCH,
        device: Device.CUDA,
      },
      maxIterations: 10,
    };

    expect(config.name).toBe('test-agent');
    expect(config.model.name).toBe('llama-3');
    expect(config.maxIterations).toBe(10);
  });

  it('should support tools and memory', () => {
    const config: AgentConfig = {
      name: 'test-agent',
      model: {
        name: 'llama-3',
        backend: Backend.PYTORCH,
        device: Device.CPU,
      },
      tools: [
        {
          name: 'search',
          description: 'Search the web',
          execute: async () => 'result',
        },
      ],
      memory: {
        type: 'conversation',
        maxTokens: 4096,
      },
    };

    expect(config.tools?.length).toBe(1);
    expect(config.tools?.[0].name).toBe('search');
    expect(config.memory?.type).toBe('conversation');
  });
});

describe('GNNConfig', () => {
  it('should create a valid GNN config', () => {
    const config: GNNConfig = {
      type: 'gat',
      numLayers: 3,
      hiddenDim: 256,
      numHeads: 8,
      dropout: 0.1,
    };

    expect(config.type).toBe('gat');
    expect(config.numLayers).toBe(3);
    expect(config.numHeads).toBe(8);
  });
});

describe('ESNConfig', () => {
  it('should create a valid ESN config', () => {
    const config: ESNConfig = {
      reservoirSize: 1000,
      spectralRadius: 0.9,
      inputScaling: 0.5,
      leakingRate: 0.3,
      sparsity: 0.1,
    };

    expect(config.reservoirSize).toBe(1000);
    expect(config.spectralRadius).toBe(0.9);
    expect(config.sparsity).toBe(0.1);
  });
});
