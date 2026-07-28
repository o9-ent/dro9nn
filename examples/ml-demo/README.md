# ML Demo

This example demonstrates machine learning capabilities of the o9nn platform.

## Model Inference

### TypeScript

```typescript
import { CogClient, ModelManager, Backend, Device } from '@o9nn/cog-sdk';

async function runInference() {
  const client = new CogClient({
    baseUrl: 'http://localhost:8080',
    apiKey: process.env.O9NN_API_KEY,
  });

  const models = new ModelManager(client);

  // Load a model
  const model = await models.load({
    name: 'resnet50',
    backend: Backend.PYTORCH,
    device: Device.CPU,
  });
  console.log('Loaded model:', model.name);

  // Run inference
  const result = await models.infer(model.id, {
    image: 'base64_encoded_image_data',
  });
  console.log('Prediction:', result.output);

  // Unload model
  await models.unload(model.id);
}

runInference().catch(console.error);
```

### Python

```python
import asyncio
from o9nn_sdk import create_sdk, ModelManager, ModelConfig, Backend, Device

async def run_inference():
    client = create_sdk(base_url="http://localhost:8080")
    
    async with client:
        models = ModelManager(client)
        
        # Load a model
        config = ModelConfig(
            name="resnet50",
            backend=Backend.PYTORCH,
            device=Device.CPU,
        )
        model = await models.load(config)
        print(f"Loaded model: {model.name}")
        
        # Run inference
        result = await models.infer(model.id, {"image": "base64_encoded_image_data"})
        print(f"Prediction: {result.output}")
        
        # Unload model
        await models.unload(model.id)

asyncio.run(run_inference())
```

## Text Generation

### TypeScript

```typescript
import { CogClient, ModelManager, Backend, Device } from '@o9nn/cog-sdk';

async function generateText() {
  const client = new CogClient({
    baseUrl: 'http://localhost:8080',
  });

  const models = new ModelManager(client);

  // Load LLM
  const model = await models.load({
    name: 'llama-3-8b',
    backend: Backend.PYTORCH,
    device: Device.CUDA,
  });

  // Generate text
  const result = await models.generate(model.id, {
    prompt: 'Write a haiku about artificial intelligence:',
    maxLength: 100,
    temperature: 0.7,
    topP: 0.9,
  });

  console.log('Generated:', result.output);
}

generateText().catch(console.error);
```

### Python with Streaming

```python
import asyncio
from o9nn_sdk import create_sdk, ModelManager, GenerationOptions

async def generate_with_streaming():
    client = create_sdk(base_url="http://localhost:8080")
    
    async with client:
        models = ModelManager(client)
        
        options = GenerationOptions(
            prompt="Write a story about a robot learning to paint:",
            max_length=200,
            temperature=0.8,
        )
        
        print("Generating: ", end="", flush=True)
        async for chunk in models.generate_stream("llama-3-8b", options):
            print(chunk["token"], end="", flush=True)
        print()

asyncio.run(generate_with_streaming())
```

## Benchmarking

```python
import asyncio
import time
from o9nn_sdk import create_sdk, ModelManager

async def benchmark_inference():
    client = create_sdk(base_url="http://localhost:8080")
    
    async with client:
        models = ModelManager(client)
        
        # Warm up
        for _ in range(5):
            await models.infer("model-id", {"text": "warmup"})
        
        # Benchmark
        times = []
        for _ in range(100):
            start = time.perf_counter()
            await models.infer("model-id", {"text": "benchmark"})
            times.append(time.perf_counter() - start)
        
        avg_time = sum(times) / len(times)
        print(f"Average latency: {avg_time * 1000:.2f}ms")
        print(f"Throughput: {1 / avg_time:.2f} req/s")

asyncio.run(benchmark_inference())
```
