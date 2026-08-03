/**
 * @file agents.cpp
 * @brief Agent manager implementation
 */

#include "cogsdk/agents.hpp"
#include "cogsdk/errors.hpp"
#include "http.hpp"

namespace cogsdk {

// AgentInfo JSON serialization
json AgentInfo::to_json() const {
    return {
        {"id", id},
        {"name", name},
        {"model", model},
        {"status", status},
        {"system_prompt", system_prompt},
        {"tools", tools},
        {"memory_config", memory_config},
        {"metadata", metadata}
    };
}

AgentInfo AgentInfo::from_json(const json& j) {
    AgentInfo info;
    info.id = j.value("id", "");
    info.name = j.value("name", "");
    info.model = j.value("model", "");
    info.status = j.value("status", "");
    info.system_prompt = j.value("system_prompt", "");
    
    if (j.contains("tools") && j["tools"].is_array()) {
        for (const auto& tool : j["tools"]) {
            if (tool.is_string()) {
                info.tools.push_back(tool);
            }
        }
    }
    
    if (j.contains("memory_config")) {
        info.memory_config = j["memory_config"];
    }
    if (j.contains("metadata")) {
        info.metadata = j["metadata"];
    }
    
    return info;
}

// AgentConfig JSON serialization
json AgentConfig::to_json() const {
    json j = {
        {"name", name},
        {"model", model}
    };
    
    if (system_prompt) j["system_prompt"] = *system_prompt;
    if (tools && !tools->empty()) j["tools"] = *tools;
    if (!memory_config.is_null()) j["memory_config"] = memory_config;
    if (!metadata.is_null()) j["metadata"] = metadata;
    
    return j;
}

// AgentMessage JSON serialization
json AgentMessage::to_json() const {
    json j = {
        {"role", role},
        {"content", content}
    };
    
    if (name) j["name"] = *name;
    if (!tool_calls.is_null()) j["tool_calls"] = tool_calls;
    if (!tool_call_id.is_null()) j["tool_call_id"] = tool_call_id;
    
    return j;
}

AgentMessage AgentMessage::from_json(const json& j) {
    AgentMessage msg;
    msg.role = j.value("role", "");
    msg.content = j.value("content", "");
    
    if (j.contains("name") && !j["name"].is_null()) {
        msg.name = j["name"].get<std::string>();
    }
    if (j.contains("tool_calls")) {
        msg.tool_calls = j["tool_calls"];
    }
    if (j.contains("tool_call_id")) {
        msg.tool_call_id = j["tool_call_id"];
    }
    
    return msg;
}

// AgentResponse JSON deserialization
AgentResponse AgentResponse::from_json(const json& j) {
    AgentResponse resp;
    resp.id = j.value("id", "");
    resp.agent_id = j.value("agent_id", "");
    
    if (j.contains("message")) {
        resp.message = AgentMessage::from_json(j["message"]);
    }
    
    if (j.contains("history") && j["history"].is_array()) {
        for (const auto& msg_json : j["history"]) {
            resp.history.push_back(AgentMessage::from_json(msg_json));
        }
    }
    
    if (j.contains("metadata")) {
        resp.metadata = j["metadata"];
    }
    
    return resp;
}

// AgentManager implementation
class AgentManager::Impl {
public:
    explicit Impl(std::shared_ptr<HttpClient> http_client)
        : http_client_(std::move(http_client)) {}
    
    std::shared_ptr<HttpClient> http_client_;
};

AgentManager::AgentManager(std::shared_ptr<HttpClient> http_client)
    : impl_(std::make_unique<Impl>(std::move(http_client))) {}

AgentManager::~AgentManager() = default;

std::vector<AgentInfo> AgentManager::list() {
    auto response = impl_->http_client_->get("/api/v1/agents");
    
    std::vector<AgentInfo> agents;
    if (response.contains("agents") && response["agents"].is_array()) {
        for (const auto& agent_json : response["agents"]) {
            agents.push_back(AgentInfo::from_json(agent_json));
        }
    } else if (response.is_array()) {
        for (const auto& agent_json : response) {
            agents.push_back(AgentInfo::from_json(agent_json));
        }
    }
    
    return agents;
}

AgentInfo AgentManager::get(const std::string& agent_id) {
    try {
        auto response = impl_->http_client_->get("/api/v1/agents/" + agent_id);
        return AgentInfo::from_json(response);
    } catch (const ApiError& e) {
        if (e.status_code == 404) {
            throw AgentNotFoundError(agent_id);
        }
        throw;
    }
}

AgentInfo AgentManager::create(const AgentConfig& config) {
    auto response = impl_->http_client_->post("/api/v1/agents", config.to_json());
    return AgentInfo::from_json(response);
}

void AgentManager::remove(const std::string& agent_id) {
    impl_->http_client_->del("/api/v1/agents/" + agent_id);
}

AgentResponse AgentManager::send(const std::string& agent_id, const std::string& message) {
    json body = {
        {"message", message}
    };
    auto response = impl_->http_client_->post("/api/v1/agents/" + agent_id + "/chat", body);
    return AgentResponse::from_json(response);
}

AgentResponse AgentManager::send_stream(
    const std::string& agent_id,
    const std::string& message,
    StreamCallback callback
) {
    std::string accumulated;
    
    json body = {
        {"message", message},
        {"stream", true}
    };
    
    impl_->http_client_->post_stream("/api/v1/agents/" + agent_id + "/chat", body,
        [&accumulated, &callback](const std::string& chunk) {
            accumulated += chunk;
            callback(chunk);
        });
    
    // Return final response
    AgentResponse resp;
    resp.agent_id = agent_id;
    resp.message.role = "assistant";
    resp.message.content = accumulated;
    return resp;
}

std::vector<AgentMessage> AgentManager::history(const std::string& agent_id) {
    auto response = impl_->http_client_->get("/api/v1/agents/" + agent_id + "/history");
    
    std::vector<AgentMessage> messages;
    if (response.contains("messages") && response["messages"].is_array()) {
        for (const auto& msg_json : response["messages"]) {
            messages.push_back(AgentMessage::from_json(msg_json));
        }
    } else if (response.is_array()) {
        for (const auto& msg_json : response) {
            messages.push_back(AgentMessage::from_json(msg_json));
        }
    }
    
    return messages;
}

void AgentManager::clear_history(const std::string& agent_id) {
    impl_->http_client_->del("/api/v1/agents/" + agent_id + "/history");
}

} // namespace cogsdk
