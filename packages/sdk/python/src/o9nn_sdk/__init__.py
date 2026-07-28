"""
o9nn Cognitive SDK - Python client for the o9nn platform.
"""

from .client import CogClient, ClientConfig
from .models import ModelManager, ModelInfo, InferenceResult, GenerationOptions
from .agents import AgentManager, AgentInfo, AgentResponse, AgentBuilder, create_tool
from .types import (
    Backend,
    Device,
    DataType,
    ModelConfig,
    InferenceOptions,
    AgentConfig,
    ToolConfig,
    MemoryConfig,
)

__version__ = "0.1.0"
__all__ = [
    # Client
    "CogClient",
    "ClientConfig",
    # Models
    "ModelManager",
    "ModelInfo",
    "InferenceResult",
    "GenerationOptions",
    # Agents
    "AgentManager",
    "AgentInfo",
    "AgentResponse",
    "AgentBuilder",
    "create_tool",
    # Types
    "Backend",
    "Device",
    "DataType",
    "ModelConfig",
    "InferenceOptions",
    "AgentConfig",
    "ToolConfig",
    "MemoryConfig",
]


def create_sdk(
    base_url: str = "http://localhost:8080",
    api_key: str | None = None,
    timeout: float = 30.0,
) -> CogClient:
    """Create a configured o9nn SDK client.
    
    Args:
        base_url: The API base URL.
        api_key: Optional API key for authentication.
        timeout: Request timeout in seconds.
        
    Returns:
        Configured CogClient instance.
    """
    import os
    
    config = ClientConfig(
        base_url=base_url or os.getenv("O9NN_API_URL", "http://localhost:8080"),
        api_key=api_key or os.getenv("O9NN_API_KEY"),
        timeout=timeout,
    )
    return CogClient(config)
