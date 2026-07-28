# @o9nn/llm-inference

LLM inference engine for the o9nn ecosystem.

## Features

- llama.cpp integration
- Multiple quantization formats (GGUF, GPTQ, AWQ)
- Batch inference
- Streaming generation
- OpenAI-compatible API

## Installation

```bash
pip install o9nn-llm-inference
```

## Usage

```python
from o9nn.llm.inference import load_model, generate

model = load_model("llama-2-7b-chat.gguf")
response = model.generate("Hello, how are you?", max_tokens=100)
```

## Supported Models

- LLaMA family (LLaMA 2, LLaMA 3)
- Mistral
- Phi
- Gemma
- And more...

## License

MIT © o9nn Organization
