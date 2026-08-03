/**
 * @file test_types.cpp
 * @brief Tests for SDK types
 */

#include <catch2/catch_test_macros.hpp>
#include <cogsdk/types.hpp>

using namespace cogsdk;

TEST_CASE("Config has sensible defaults", "[types]") {
    Config config;
    
    REQUIRE(config.base_url == "http://localhost:8080");
    REQUIRE(config.api_key.empty());
    REQUIRE(config.timeout.count() == 30);
    REQUIRE(config.retry_count == 3);
}

TEST_CASE("ModelInfo JSON serialization", "[types]") {
    ModelInfo info;
    info.id = "model-123";
    info.name = "test-model";
    info.version = "1.0.0";
    info.backend = "llama.cpp";
    info.size_bytes = 1024 * 1024 * 1024;
    info.parameters = 7000000000;
    info.context_length = 4096;
    
    auto j = info.to_json();
    
    REQUIRE(j["id"] == "model-123");
    REQUIRE(j["name"] == "test-model");
    REQUIRE(j["version"] == "1.0.0");
    REQUIRE(j["backend"] == "llama.cpp");
    REQUIRE(j["size_bytes"] == 1073741824);
    REQUIRE(j["parameters"] == 7000000000);
    REQUIRE(j["context_length"] == 4096);
}

TEST_CASE("ModelInfo JSON deserialization", "[types]") {
    json j = {
        {"id", "model-456"},
        {"name", "another-model"},
        {"version", "2.0.0"},
        {"backend", "onnx"},
        {"size_bytes", 2048},
        {"parameters", 1000000},
        {"context_length", 8192},
        {"status", "ready"}
    };
    
    auto info = ModelInfo::from_json(j);
    
    REQUIRE(info.id == "model-456");
    REQUIRE(info.name == "another-model");
    REQUIRE(info.version == "2.0.0");
    REQUIRE(info.backend == "onnx");
    REQUIRE(info.size_bytes == 2048);
    REQUIRE(info.parameters == 1000000);
    REQUIRE(info.context_length == 8192);
    REQUIRE(info.status == "ready");
}

TEST_CASE("InferenceRequest JSON serialization", "[types]") {
    InferenceRequest req;
    req.model = "llama-2-7b";
    req.prompt = "Hello, world!";
    req.max_tokens = 100;
    req.temperature = 0.7f;
    
    auto j = req.to_json();
    
    REQUIRE(j["model"] == "llama-2-7b");
    REQUIRE(j["prompt"] == "Hello, world!");
    REQUIRE(j["max_tokens"] == 100);
    REQUIRE(j["temperature"] == 0.7f);
}

TEST_CASE("InferenceRequest with optional fields", "[types]") {
    InferenceRequest req;
    req.model = "test";
    req.prompt = "test";
    
    auto j = req.to_json();
    
    REQUIRE(j.contains("model"));
    REQUIRE(j.contains("prompt"));
    REQUIRE_FALSE(j.contains("max_tokens"));
    REQUIRE_FALSE(j.contains("temperature"));
}

TEST_CASE("InferenceResponse JSON deserialization", "[types]") {
    json j = {
        {"id", "resp-123"},
        {"model", "llama-2-7b"},
        {"text", "Hello!"},
        {"usage", {
            {"prompt_tokens", 10},
            {"completion_tokens", 5},
            {"total_tokens", 15}
        }}
    };
    
    auto resp = InferenceResponse::from_json(j);
    
    REQUIRE(resp.id == "resp-123");
    REQUIRE(resp.model == "llama-2-7b");
    REQUIRE(resp.text == "Hello!");
    REQUIRE(resp.prompt_tokens == 10);
    REQUIRE(resp.completion_tokens == 5);
    REQUIRE(resp.total_tokens == 15);
}

TEST_CASE("InferenceResponse with choices format", "[types]") {
    json j = {
        {"id", "resp-456"},
        {"model", "gpt-4"},
        {"choices", {{
            {"text", "Generated text"},
            {"finish_reason", "stop"}
        }}}
    };
    
    auto resp = InferenceResponse::from_json(j);
    
    REQUIRE(resp.text == "Generated text");
    REQUIRE(resp.finish_reason == "stop");
}

TEST_CASE("AgentInfo JSON round-trip", "[types]") {
    AgentInfo info;
    info.id = "agent-123";
    info.name = "test-agent";
    info.model = "llama-2-7b";
    info.status = "active";
    info.system_prompt = "You are a helpful assistant.";
    info.tools = {"search", "calculator"};
    
    auto j = info.to_json();
    auto info2 = AgentInfo::from_json(j);
    
    REQUIRE(info2.id == info.id);
    REQUIRE(info2.name == info.name);
    REQUIRE(info2.model == info.model);
    REQUIRE(info2.status == info.status);
    REQUIRE(info2.system_prompt == info.system_prompt);
    REQUIRE(info2.tools == info.tools);
}

TEST_CASE("AgentMessage JSON round-trip", "[types]") {
    AgentMessage msg;
    msg.role = "assistant";
    msg.content = "Hello, how can I help?";
    msg.name = "assistant-name";
    
    auto j = msg.to_json();
    auto msg2 = AgentMessage::from_json(j);
    
    REQUIRE(msg2.role == msg.role);
    REQUIRE(msg2.content == msg.content);
    REQUIRE(msg2.name.has_value());
    REQUIRE(*msg2.name == *msg.name);
}
