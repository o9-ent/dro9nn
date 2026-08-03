# cog-sdk-cpp

C++ SDK for the o9nn cognitive computing platform.

## Requirements

- C++17 or later
- CMake 3.16+
- OpenSSL (for HTTPS support)
- nlohmann_json (included via vcpkg or FetchContent)

## Installation

### Via vcpkg

```bash
vcpkg install o9nn-cog-sdk
```

### Via CMake FetchContent

```cmake
include(FetchContent)

FetchContent_Declare(
    cogsdk
    GIT_REPOSITORY https://github.com/o9nn/dro9nn.git
    GIT_TAG main
    SOURCE_SUBDIR packages/sdk/cpp
)

FetchContent_MakeAvailable(cogsdk)

target_link_libraries(your_target PRIVATE cogsdk::cogsdk)
```

### Building from source

```bash
cd packages/sdk/cpp
mkdir build && cd build
cmake ..
cmake --build .
cmake --install . --prefix /usr/local
```

## Quick Start

```cpp
#include <cogsdk/cogsdk.hpp>
#include <iostream>

int main() {
    // Create client with default configuration
    cogsdk::Config config;
    config.base_url = "http://localhost:8080";
    config.api_key = "your-api-key";
    
    cogsdk::Client client(config);
    
    // List models
    auto models = client.models().list();
    for (const auto& model : models) {
        std::cout << "Model: " << model.name << std::endl;
    }
    
    // Run inference
    cogsdk::InferenceRequest req;
    req.model = "llama-2-7b-chat";
    req.prompt = "Hello, world!";
    req.max_tokens = 100;
    
    auto response = client.models().infer(req);
    std::cout << "Response: " << response.text << std::endl;
    
    return 0;
}
```

## API Reference

### Client

The main entry point for the SDK.

```cpp
cogsdk::Client client(config);

// Access managers
client.models()   // Model operations
client.agents()   // Agent operations
```

### Models

```cpp
auto& models = client.models();

// List models
auto list = models.list();

// Get model info
auto info = models.get("model-name");

// Run inference
cogsdk::InferenceRequest req;
req.model = "model-name";
req.prompt = "Your prompt";
auto response = models.infer(req);

// Stream inference
models.infer_stream(req, [](const std::string& chunk) {
    std::cout << chunk;
});
```

### Agents

```cpp
auto& agents = client.agents();

// List agents
auto list = agents.list();

// Create agent
cogsdk::AgentConfig config;
config.name = "my-agent";
config.model = "llama-2-7b-chat";
auto agent = agents.create(config);

// Send message
auto response = agents.send(agent.id, "Hello!");
```

## Error Handling

The SDK uses exceptions for error handling:

```cpp
try {
    auto response = client.models().infer(req);
} catch (const cogsdk::ApiError& e) {
    std::cerr << "API Error: " << e.what() << std::endl;
    std::cerr << "Status: " << e.status_code << std::endl;
} catch (const cogsdk::NetworkError& e) {
    std::cerr << "Network Error: " << e.what() << std::endl;
}
```

## Configuration

```cpp
cogsdk::Config config;
config.base_url = "http://localhost:8080";  // API base URL
config.api_key = "your-api-key";            // API key
config.timeout = std::chrono::seconds(30);  // Request timeout
config.retry_count = 3;                     // Number of retries
```

## Thread Safety

The `Client` class is thread-safe. Multiple threads can share a single client instance.

## License

MIT License
