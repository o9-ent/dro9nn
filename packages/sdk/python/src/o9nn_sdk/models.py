"""
Model management for o9nn SDK.
"""

from typing import Any, AsyncIterator
from pydantic import BaseModel, Field
from datetime import datetime

from .client import CogClient
from .types import Backend, InferenceOptions, ModelConfig


class ModelInfo(BaseModel):
    """Model information."""
    id: str
    name: str
    version: str
    backend: Backend
    size: int
    quantization: str | None = None
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    class Config:
        populate_by_name = True


class UsageInfo(BaseModel):
    """Token usage information."""
    prompt_tokens: int = Field(alias="promptTokens")
    completion_tokens: int = Field(alias="completionTokens")
    total_tokens: int = Field(alias="totalTokens")

    class Config:
        populate_by_name = True


class InferenceResult(BaseModel):
    """Inference result."""
    id: str
    model_id: str = Field(alias="modelId")
    output: Any
    usage: UsageInfo
    latency: float

    class Config:
        populate_by_name = True


class GenerationOptions(InferenceOptions):
    """Generation options."""
    prompt: str
    stop_sequences: list[str] | None = Field(default=None, alias="stopSequences")
    repetition_penalty: float | None = Field(default=None, alias="repetitionPenalty")
    presence_penalty: float | None = Field(default=None, alias="presencePenalty")
    frequency_penalty: float | None = Field(default=None, alias="frequencyPenalty")

    class Config:
        populate_by_name = True


class ModelManager:
    """Model manager for listing, loading, and running inference."""
    
    def __init__(self, client: CogClient):
        """Initialize the model manager.
        
        Args:
            client: CogClient instance.
        """
        self.client = client
    
    async def list(self, backend: Backend | None = None) -> list[ModelInfo]:
        """List available models.
        
        Args:
            backend: Optional backend filter.
            
        Returns:
            List of model information.
        """
        params = {"backend": backend.value} if backend else None
        data = await self.client.get("/api/v1/models", params=params)
        return [ModelInfo(**m) for m in data]
    
    async def get(self, model_id: str) -> ModelInfo:
        """Get model information.
        
        Args:
            model_id: Model ID.
            
        Returns:
            Model information.
        """
        data = await self.client.get(f"/api/v1/models/{model_id}")
        return ModelInfo(**data)
    
    async def load(self, config: ModelConfig) -> ModelInfo:
        """Load a model.
        
        Args:
            config: Model configuration.
            
        Returns:
            Loaded model information.
        """
        data = await self.client.post(
            "/api/v1/models/load",
            body=config.model_dump(by_alias=True, exclude_none=True),
        )
        return ModelInfo(**data)
    
    async def unload(self, model_id: str) -> None:
        """Unload a model.
        
        Args:
            model_id: Model ID.
        """
        await self.client.delete(f"/api/v1/models/{model_id}")
    
    async def infer(
        self,
        model_id: str,
        input_data: Any,
        options: InferenceOptions | None = None,
    ) -> InferenceResult:
        """Run inference on a model.
        
        Args:
            model_id: Model ID.
            input_data: Input data.
            options: Inference options.
            
        Returns:
            Inference result.
        """
        body: dict[str, Any] = {"input": input_data}
        if options:
            body["options"] = options.model_dump(by_alias=True, exclude_none=True)
        
        data = await self.client.post(f"/api/v1/models/{model_id}/infer", body=body)
        return InferenceResult(**data)
    
    async def generate(
        self,
        model_id: str,
        options: GenerationOptions,
    ) -> InferenceResult:
        """Generate text using a language model.
        
        Args:
            model_id: Model ID.
            options: Generation options.
            
        Returns:
            Generation result.
        """
        data = await self.client.post(
            f"/api/v1/models/{model_id}/generate",
            body=options.model_dump(by_alias=True, exclude_none=True),
        )
        return InferenceResult(**data)
    
    async def generate_stream(
        self,
        model_id: str,
        options: GenerationOptions,
    ) -> AsyncIterator[dict[str, Any]]:
        """Stream generation results.
        
        Args:
            model_id: Model ID.
            options: Generation options.
            
        Yields:
            Token chunks.
        """
        # Placeholder for streaming implementation
        # In a real implementation, this would handle SSE or WebSocket streaming
        result = await self.generate(model_id, options)
        yield {"token": result.output, "finished": True}


def create_model_config(
    name: str,
    *,
    backend: Backend = Backend.PYTORCH,
    device: str = "cpu",
    dtype: str | None = "float32",
    **kwargs: Any,
) -> ModelConfig:
    """Create a model configuration.
    
    Args:
        name: Model name.
        backend: ML backend.
        device: Device type.
        dtype: Data type.
        **kwargs: Additional options.
        
    Returns:
        Model configuration.
    """
    from .types import Device, DataType
    
    return ModelConfig(
        name=name,
        backend=backend,
        device=Device(device),
        dtype=DataType(dtype) if dtype else None,
        **kwargs,
    )
