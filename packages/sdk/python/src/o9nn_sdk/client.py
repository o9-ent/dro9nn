"""
HTTP Client for o9nn API.
"""

import logging
from typing import Any, TypeVar
from pydantic import BaseModel

import httpx

logger = logging.getLogger(__name__)

T = TypeVar("T")


class ClientConfig(BaseModel):
    """Client configuration."""
    base_url: str = "http://localhost:8080"
    api_key: str | None = None
    timeout: float = 30.0
    headers: dict[str, str] | None = None


class ApiError(Exception):
    """API error with status code and body."""
    
    def __init__(self, message: str, status_code: int, body: str):
        super().__init__(message)
        self.status_code = status_code
        self.body = body


class CogClient:
    """HTTP Client for interacting with o9nn API."""
    
    def __init__(self, config: ClientConfig | None = None):
        """Initialize the client.
        
        Args:
            config: Client configuration.
        """
        self.config = config or ClientConfig()
        self._client = httpx.AsyncClient(
            base_url=self.config.base_url,
            timeout=self.config.timeout,
            headers=self._build_headers(),
        )
    
    def _build_headers(self) -> dict[str, str]:
        """Build request headers."""
        headers = {
            "Content-Type": "application/json",
            **(self.config.headers or {}),
        }
        if self.config.api_key:
            headers["Authorization"] = "Bearer " + self.config.api_key
        return headers
    
    async def __aenter__(self) -> "CogClient":
        return self
    
    async def __aexit__(self, *args: Any) -> None:
        await self.close()
    
    async def close(self) -> None:
        """Close the client."""
        await self._client.aclose()
    
    async def request(
        self,
        method: str,
        endpoint: str,
        body: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Make an HTTP request.
        
        Args:
            method: HTTP method.
            endpoint: API endpoint.
            body: Request body.
            params: Query parameters.
            
        Returns:
            Response data.
            
        Raises:
            ApiError: If the request fails.
        """
        logger.debug(f"{method} {endpoint}")
        
        kwargs: dict[str, Any] = {}
        if body is not None:
            kwargs["json"] = body
        if params is not None:
            kwargs["params"] = params
        
        try:
            response = await self._client.request(method, endpoint, **kwargs)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise ApiError(
                f"API request failed: {e.response.status_code}",
                e.response.status_code,
                e.response.text,
            ) from e
    
    async def get(
        self,
        endpoint: str,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """GET request."""
        return await self.request("GET", endpoint, params=params)
    
    async def post(
        self,
        endpoint: str,
        body: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """POST request."""
        return await self.request("POST", endpoint, body=body, params=params)
    
    async def put(
        self,
        endpoint: str,
        body: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """PUT request."""
        return await self.request("PUT", endpoint, body=body, params=params)
    
    async def delete(
        self,
        endpoint: str,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """DELETE request."""
        return await self.request("DELETE", endpoint, params=params)
