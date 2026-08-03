/**
 * @file types.hpp
 * @brief Common types for the o9nn Cognitive SDK
 */

#ifndef COGSDK_TYPES_HPP
#define COGSDK_TYPES_HPP

#include <string>
#include <vector>
#include <optional>
#include <chrono>
#include <map>
#include <functional>
#include <nlohmann/json.hpp>

namespace cogsdk {

using json = nlohmann::json;

/**
 * @brief SDK configuration
 */
struct Config {
    /// Base URL of the API server
    std::string base_url = "http://localhost:8080";
    
    /// API key for authentication
    std::string api_key;
    
    /// Request timeout
    std::chrono::seconds timeout{30};
    
    /// Number of retry attempts
    int retry_count = 3;
    
    /// Additional headers
    std::map<std::string, std::string> headers;
};

/**
 * @brief Model information
 */
struct ModelInfo {
    std::string id;
    std::string name;
    std::string version;
    std::string backend;
    int64_t size_bytes = 0;
    int64_t parameters = 0;
    int context_length = 4096;
    std::string quantization;
    std::string status;
    json metadata;
    
    /// Serialize to JSON
    json to_json() const;
    
    /// Deserialize from JSON
    static ModelInfo from_json(const json& j);
};

/**
 * @brief Inference request
 */
struct InferenceRequest {
    std::string model;
    std::string prompt;
    std::optional<int> max_tokens;
    std::optional<float> temperature;
    std::optional<float> top_p;
    std::optional<int> top_k;
    std::optional<std::vector<std::string>> stop;
    std::optional<bool> stream;
    json extra;
    
    /// Serialize to JSON
    json to_json() const;
};

/**
 * @brief Inference response
 */
struct InferenceResponse {
    std::string id;
    std::string model;
    std::string text;
    int prompt_tokens = 0;
    int completion_tokens = 0;
    int total_tokens = 0;
    std::string finish_reason;
    json metadata;
    
    /// Deserialize from JSON
    static InferenceResponse from_json(const json& j);
};

/**
 * @brief Agent information
 */
struct AgentInfo {
    std::string id;
    std::string name;
    std::string model;
    std::string status;
    std::string system_prompt;
    std::vector<std::string> tools;
    json memory_config;
    json metadata;
    
    /// Serialize to JSON
    json to_json() const;
    
    /// Deserialize from JSON
    static AgentInfo from_json(const json& j);
};

/**
 * @brief Agent configuration for creation
 */
struct AgentConfig {
    std::string name;
    std::string model;
    std::optional<std::string> system_prompt;
    std::optional<std::vector<std::string>> tools;
    json memory_config;
    json metadata;
    
    /// Serialize to JSON
    json to_json() const;
};

/**
 * @brief Agent message
 */
struct AgentMessage {
    std::string role;  // "user", "assistant", "system", "tool"
    std::string content;
    std::optional<std::string> name;
    json tool_calls;
    json tool_call_id;
    
    /// Serialize to JSON
    json to_json() const;
    
    /// Deserialize from JSON
    static AgentMessage from_json(const json& j);
};

/**
 * @brief Agent response
 */
struct AgentResponse {
    std::string id;
    std::string agent_id;
    AgentMessage message;
    std::vector<AgentMessage> history;
    json metadata;
    
    /// Deserialize from JSON
    static AgentResponse from_json(const json& j);
};

/**
 * @brief Callback for streaming responses
 */
using StreamCallback = std::function<void(const std::string& chunk)>;

} // namespace cogsdk

#endif // COGSDK_TYPES_HPP
