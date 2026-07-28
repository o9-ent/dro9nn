"""
Agent framework for o9nn SDK.
"""

from typing import Any, Callable, Awaitable
from pydantic import BaseModel, Field
from datetime import datetime

from .client import CogClient
from .types import AgentConfig, ToolConfig, MemoryConfig, ModelConfig, ParameterSchema


class AgentInfo(BaseModel):
    """Agent information."""
    id: str
    name: str
    status: str
    model: ModelConfig
    tools: list[str]
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    class Config:
        populate_by_name = True


class AgentMessage(BaseModel):
    """Agent message."""
    role: str
    content: str
    name: str | None = None
    tool_call_id: str | None = Field(default=None, alias="toolCallId")

    class Config:
        populate_by_name = True


class ToolCall(BaseModel):
    """Tool call."""
    id: str
    name: str
    arguments: dict[str, Any]


class UsageInfo(BaseModel):
    """Token usage information."""
    prompt_tokens: int = Field(alias="promptTokens")
    completion_tokens: int = Field(alias="completionTokens")
    total_tokens: int = Field(alias="totalTokens")

    class Config:
        populate_by_name = True


class AgentResponse(BaseModel):
    """Agent response."""
    id: str
    agent_id: str = Field(alias="agentId")
    message: AgentMessage
    tool_calls: list[ToolCall] | None = Field(default=None, alias="toolCalls")
    usage: UsageInfo
    finish_reason: str = Field(alias="finishReason")

    class Config:
        populate_by_name = True


class ConversationHistory(BaseModel):
    """Conversation history."""
    messages: list[AgentMessage]
    summary: str | None = None
    token_count: int = Field(alias="tokenCount")

    class Config:
        populate_by_name = True


class AgentManager:
    """Agent manager for creating and interacting with AI agents."""
    
    def __init__(self, client: CogClient):
        """Initialize the agent manager.
        
        Args:
            client: CogClient instance.
        """
        self.client = client
    
    async def list(self) -> list[AgentInfo]:
        """List available agents.
        
        Returns:
            List of agent information.
        """
        data = await self.client.get("/api/v1/agents")
        return [AgentInfo(**a) for a in data]
    
    async def get(self, agent_id: str) -> AgentInfo:
        """Get agent information.
        
        Args:
            agent_id: Agent ID.
            
        Returns:
            Agent information.
        """
        data = await self.client.get(f"/api/v1/agents/{agent_id}")
        return AgentInfo(**data)
    
    async def create(self, config: AgentConfig) -> AgentInfo:
        """Create a new agent.
        
        Args:
            config: Agent configuration.
            
        Returns:
            Created agent information.
        """
        data = await self.client.post(
            "/api/v1/agents",
            body=config.model_dump(by_alias=True, exclude_none=True),
        )
        return AgentInfo(**data)
    
    async def delete(self, agent_id: str) -> None:
        """Delete an agent.
        
        Args:
            agent_id: Agent ID.
        """
        await self.client.delete(f"/api/v1/agents/{agent_id}")
    
    async def chat(
        self,
        agent_id: str,
        message: str,
        history: list[AgentMessage] | None = None,
    ) -> AgentResponse:
        """Chat with an agent.
        
        Args:
            agent_id: Agent ID.
            message: User message.
            history: Optional conversation history.
            
        Returns:
            Agent response.
        """
        body: dict[str, Any] = {"message": message}
        if history:
            body["history"] = [m.model_dump(by_alias=True, exclude_none=True) for m in history]
        
        data = await self.client.post(f"/api/v1/agents/{agent_id}/chat", body=body)
        return AgentResponse(**data)
    
    async def execute_tool_result(
        self,
        agent_id: str,
        tool_call_id: str,
        result: Any,
    ) -> AgentResponse:
        """Execute a tool call result.
        
        Args:
            agent_id: Agent ID.
            tool_call_id: Tool call ID.
            result: Tool execution result.
            
        Returns:
            Agent response.
        """
        data = await self.client.post(
            f"/api/v1/agents/{agent_id}/tool-result",
            body={"toolCallId": tool_call_id, "result": result},
        )
        return AgentResponse(**data)
    
    async def get_history(
        self,
        agent_id: str,
        session_id: str | None = None,
    ) -> ConversationHistory:
        """Get conversation history.
        
        Args:
            agent_id: Agent ID.
            session_id: Optional session ID.
            
        Returns:
            Conversation history.
        """
        params = {"sessionId": session_id} if session_id else None
        data = await self.client.get(f"/api/v1/agents/{agent_id}/history", params=params)
        return ConversationHistory(**data)
    
    async def clear_history(
        self,
        agent_id: str,
        session_id: str | None = None,
    ) -> None:
        """Clear conversation history.
        
        Args:
            agent_id: Agent ID.
            session_id: Optional session ID.
        """
        params = {"sessionId": session_id} if session_id else None
        await self.client.delete(f"/api/v1/agents/{agent_id}/history", params=params)


class AgentBuilder:
    """Agent builder for creating agent configurations."""
    
    def __init__(self, name: str):
        """Initialize the builder.
        
        Args:
            name: Agent name.
        """
        self._name = name
        self._model: ModelConfig | None = None
        self._tools: list[ToolConfig] = []
        self._memory: MemoryConfig | None = None
        self._max_iterations: int | None = None
    
    def with_model(self, model: ModelConfig) -> "AgentBuilder":
        """Set the model configuration.
        
        Args:
            model: Model configuration.
            
        Returns:
            Self for chaining.
        """
        self._model = model
        return self
    
    def add_tool(self, tool: ToolConfig) -> "AgentBuilder":
        """Add a tool to the agent.
        
        Args:
            tool: Tool configuration.
            
        Returns:
            Self for chaining.
        """
        self._tools.append(tool)
        return self
    
    def with_memory(self, memory: MemoryConfig) -> "AgentBuilder":
        """Set memory configuration.
        
        Args:
            memory: Memory configuration.
            
        Returns:
            Self for chaining.
        """
        self._memory = memory
        return self
    
    def with_max_iterations(self, max_iterations: int) -> "AgentBuilder":
        """Set maximum iterations.
        
        Args:
            max_iterations: Maximum iterations.
            
        Returns:
            Self for chaining.
        """
        self._max_iterations = max_iterations
        return self
    
    def build(self) -> AgentConfig:
        """Build the agent configuration.
        
        Returns:
            Agent configuration.
            
        Raises:
            ValueError: If required fields are missing.
        """
        if not self._model:
            raise ValueError("Model is required")
        
        return AgentConfig(
            name=self._name,
            model=self._model,
            tools=self._tools if self._tools else None,
            memory=self._memory,
            max_iterations=self._max_iterations,
        )


def create_tool(
    name: str,
    description: str,
    parameters: dict[str, dict[str, Any]] | None = None,
) -> ToolConfig:
    """Create a tool configuration.
    
    Args:
        name: Tool name.
        description: Tool description.
        parameters: Tool parameters.
        
    Returns:
        Tool configuration.
    """
    param_schemas = None
    if parameters:
        param_schemas = {
            k: ParameterSchema(**v) for k, v in parameters.items()
        }
    
    return ToolConfig(
        name=name,
        description=description,
        parameters=param_schemas,
    )
