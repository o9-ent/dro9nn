# Agent Demo

This example demonstrates the agent framework capabilities of the o9nn platform.

## Basic Agent Chat

### TypeScript

```typescript
import { 
  CogClient, 
  AgentManager, 
  AgentBuilder,
  createTool,
  Backend,
  Device 
} from '@o9nn/cog-sdk';

async function basicChat() {
  const client = new CogClient({
    baseUrl: 'http://localhost:8080',
    apiKey: process.env.O9NN_API_KEY,
  });

  const agents = new AgentManager(client);

  // Simple chat
  const response = await agents.chat('assistant', 'What is machine learning?');
  console.log('Agent:', response.message.content);
}

basicChat().catch(console.error);
```

## Agent with Tools

### TypeScript

```typescript
import { 
  CogClient, 
  AgentManager, 
  AgentBuilder,
  createTool,
  Backend,
  Device 
} from '@o9nn/cog-sdk';

async function agentWithTools() {
  const client = new CogClient({
    baseUrl: 'http://localhost:8080',
  });

  const agents = new AgentManager(client);

  // Define tools
  const searchTool = createTool(
    'search',
    'Search the web for information',
    async (params) => {
      // Implement search logic
      return { results: ['Result 1', 'Result 2'] };
    },
    {
      query: { type: 'string', description: 'Search query', required: true },
    }
  );

  const calculatorTool = createTool(
    'calculator',
    'Perform mathematical calculations',
    async (params) => {
      const { expression } = params;
      // Safe eval for math expressions
      return { result: eval(expression as string) };
    },
    {
      expression: { type: 'string', description: 'Math expression', required: true },
    }
  );

  // Build agent config
  const config = new AgentBuilder('research-assistant')
    .withModel({
      name: 'llama-3-8b',
      backend: Backend.PYTORCH,
      device: Device.CUDA,
    })
    .addTool(searchTool)
    .addTool(calculatorTool)
    .withMemory({ type: 'conversation', maxTokens: 4096 })
    .withMaxIterations(10)
    .build();

  // Create agent
  const agent = await agents.create(config);
  console.log('Created agent:', agent.id);

  // Chat with tool usage
  let response = await agents.chat(agent.id, 'What is 25 * 4?');
  
  // Handle tool calls
  if (response.toolCalls && response.toolCalls.length > 0) {
    for (const call of response.toolCalls) {
      console.log(`Executing tool: ${call.name}`);
      const result = await executeTool(call.name, call.arguments);
      response = await agents.executeToolResult(agent.id, call.id, result);
    }
  }

  console.log('Final response:', response.message.content);
}

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'calculator':
      return { result: eval(args.expression as string) };
    case 'search':
      return { results: ['Mock result for: ' + args.query] };
    default:
      return { error: 'Unknown tool' };
  }
}

agentWithTools().catch(console.error);
```

### Python

```python
import asyncio
from o9nn_sdk import (
    create_sdk,
    AgentManager,
    AgentBuilder,
    create_tool,
    ModelConfig,
    Backend,
    Device,
    MemoryConfig,
)

async def agent_with_tools():
    client = create_sdk(base_url="http://localhost:8080")
    
    async with client:
        agents = AgentManager(client)
        
        # Build agent config
        config = (
            AgentBuilder("research-assistant")
            .with_model(ModelConfig(
                name="llama-3-8b",
                backend=Backend.PYTORCH,
                device=Device.CUDA,
            ))
            .add_tool(create_tool(
                "search",
                "Search the web for information",
                {"query": {"type": "string", "description": "Search query"}},
            ))
            .add_tool(create_tool(
                "calculator",
                "Perform mathematical calculations",
                {"expression": {"type": "string", "description": "Math expression"}},
            ))
            .with_memory(MemoryConfig(type="conversation", max_tokens=4096))
            .with_max_iterations(10)
            .build()
        )
        
        # Create agent
        agent = await agents.create(config)
        print(f"Created agent: {agent.id}")
        
        # Chat
        response = await agents.chat(agent.id, "What is 25 * 4?")
        
        # Handle tool calls
        if response.tool_calls:
            for call in response.tool_calls:
                print(f"Executing tool: {call.name}")
                result = execute_tool(call.name, call.arguments)
                response = await agents.execute_tool_result(agent.id, call.id, result)
        
        print(f"Final response: {response.message.content}")

def execute_tool(name: str, args: dict):
    if name == "calculator":
        return {"result": eval(args["expression"])}
    elif name == "search":
        return {"results": [f"Mock result for: {args['query']}"]}
    return {"error": "Unknown tool"}

asyncio.run(agent_with_tools())
```

## Multi-Turn Conversation

```python
import asyncio
from o9nn_sdk import create_sdk, AgentManager, AgentMessage

async def multi_turn_chat():
    client = create_sdk(base_url="http://localhost:8080")
    
    async with client:
        agents = AgentManager(client)
        history = []
        
        questions = [
            "What is Python?",
            "What are its main features?",
            "Can you give me a code example?",
        ]
        
        for question in questions:
            print(f"\nUser: {question}")
            
            response = await agents.chat("assistant", question, history)
            print(f"Agent: {response.message.content}")
            
            # Update history
            history.append(AgentMessage(role="user", content=question))
            history.append(response.message)

asyncio.run(multi_turn_chat())
```
