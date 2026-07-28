"""
Type definitions for o9nn SDK.
"""

from enum import Enum
from typing import Any
from pydantic import BaseModel, Field


class Backend(str, Enum):
    """ML Backend types."""
    PYTORCH = "pytorch"
    JAX = "jax"
    TENSORFLOW = "tensorflow"
    ONNX = "onnx"


class Device(str, Enum):
    """Device types."""
    CPU = "cpu"
    CUDA = "cuda"
    MPS = "mps"
    TPU = "tpu"


class DataType(str, Enum):
    """Data types."""
    FLOAT16 = "float16"
    FLOAT32 = "float32"
    FLOAT64 = "float64"
    INT8 = "int8"
    INT16 = "int16"
    INT32 = "int32"
    INT64 = "int64"
    UINT8 = "uint8"
    BOOL = "bool"
    BFLOAT16 = "bfloat16"


class ModelConfig(BaseModel):
    """Model configuration."""
    name: str
    version: str | None = None
    path: str | None = None
    backend: Backend = Backend.PYTORCH
    device: Device = Device.CPU
    dtype: DataType | None = DataType.FLOAT32
    options: dict[str, Any] | None = None


class InferenceOptions(BaseModel):
    """Inference options."""
    batch_size: int | None = Field(default=None, alias="batchSize")
    max_length: int | None = Field(default=None, alias="maxLength")
    temperature: float | None = None
    top_k: int | None = Field(default=None, alias="topK")
    top_p: float | None = Field(default=None, alias="topP")
    stream: bool | None = None
    timeout: int | None = None

    class Config:
        populate_by_name = True


class SchedulerConfig(BaseModel):
    """Learning rate scheduler configuration."""
    type: str
    warmup_steps: int | None = Field(default=None, alias="warmupSteps")
    total_steps: int | None = Field(default=None, alias="totalSteps")

    class Config:
        populate_by_name = True


class TrainingConfig(BaseModel):
    """Training configuration."""
    epochs: int
    batch_size: int = Field(alias="batchSize")
    learning_rate: float = Field(alias="learningRate")
    optimizer: str = "adam"
    scheduler: SchedulerConfig | None = None
    gradient_accumulation_steps: int | None = Field(default=None, alias="gradientAccumulationSteps")
    max_grad_norm: float | None = Field(default=None, alias="maxGradNorm")
    seed: int | None = None

    class Config:
        populate_by_name = True


class ParameterSchema(BaseModel):
    """Tool parameter schema."""
    type: str
    description: str | None = None
    required: bool | None = None
    default: Any | None = None
    enum: list[Any] | None = None


class ToolConfig(BaseModel):
    """Tool configuration."""
    name: str
    description: str
    parameters: dict[str, ParameterSchema] | None = None


class VectorStoreConfig(BaseModel):
    """Vector store configuration."""
    type: str
    dimensions: int


class MemoryConfig(BaseModel):
    """Memory configuration."""
    type: str
    max_tokens: int | None = Field(default=None, alias="maxTokens")
    vector_store: VectorStoreConfig | None = Field(default=None, alias="vectorStore")

    class Config:
        populate_by_name = True


class AgentConfig(BaseModel):
    """Agent configuration."""
    name: str
    model: ModelConfig
    tools: list[ToolConfig] | None = None
    memory: MemoryConfig | None = None
    max_iterations: int | None = Field(default=None, alias="maxIterations")

    class Config:
        populate_by_name = True


class GNNConfig(BaseModel):
    """GNN configuration."""
    type: str
    num_layers: int = Field(alias="numLayers")
    hidden_dim: int = Field(alias="hiddenDim")
    num_heads: int | None = Field(default=None, alias="numHeads")
    dropout: float | None = None
    aggregator: str | None = None

    class Config:
        populate_by_name = True


class ESNConfig(BaseModel):
    """Echo State Network configuration."""
    reservoir_size: int = Field(alias="reservoirSize")
    spectral_radius: float = Field(alias="spectralRadius")
    input_scaling: float = Field(alias="inputScaling")
    leaking_rate: float = Field(alias="leakingRate")
    sparsity: float | None = None
    noise: float | None = None
    washout: int | None = None

    class Config:
        populate_by_name = True
