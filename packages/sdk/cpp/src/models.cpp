/**
 * @file models.cpp
 * @brief Model manager implementation
 */

#include "cogsdk/models.hpp"
#include "cogsdk/errors.hpp"
#include "http.hpp"

namespace cogsdk {

// ModelInfo JSON serialization
json ModelInfo::to_json() const {
    return {
        {"id", id},
        {"name", name},
        {"version", version},
        {"backend", backend},
        {"size_bytes", size_bytes},
        {"parameters", parameters},
        {"context_length", context_length},
        {"quantization", quantization},
        {"status", status},
        {"metadata", metadata}
    };
}

ModelInfo ModelInfo::from_json(const json& j) {
    ModelInfo info;
    info.id = j.value("id", "");
    info.name = j.value("name", "");
    info.version = j.value("version", "");
    info.backend = j.value("backend", "");
    info.size_bytes = j.value("size_bytes", int64_t(0));
    info.parameters = j.value("parameters", int64_t(0));
    info.context_length = j.value("context_length", 4096);
    info.quantization = j.value("quantization", "");
    info.status = j.value("status", "");
    if (j.contains("metadata")) {
        info.metadata = j["metadata"];
    }
    return info;
}

// InferenceRequest JSON serialization
json InferenceRequest::to_json() const {
    json j = {
        {"model", model},
        {"prompt", prompt}
    };
    
    if (max_tokens) j["max_tokens"] = *max_tokens;
    if (temperature) j["temperature"] = *temperature;
    if (top_p) j["top_p"] = *top_p;
    if (top_k) j["top_k"] = *top_k;
    if (stop && !stop->empty()) j["stop"] = *stop;
    if (stream) j["stream"] = *stream;
    
    // Merge extra fields
    if (!extra.is_null()) {
        for (auto& [key, value] : extra.items()) {
            j[key] = value;
        }
    }
    
    return j;
}

// InferenceResponse JSON deserialization
InferenceResponse InferenceResponse::from_json(const json& j) {
    InferenceResponse resp;
    resp.id = j.value("id", "");
    resp.model = j.value("model", "");
    resp.text = j.value("text", "");
    
    // Handle nested choices format (OpenAI-compatible)
    if (j.contains("choices") && j["choices"].is_array() && !j["choices"].empty()) {
        auto& choice = j["choices"][0];
        if (choice.contains("text")) {
            resp.text = choice["text"];
        } else if (choice.contains("message") && choice["message"].contains("content")) {
            resp.text = choice["message"]["content"];
        }
        resp.finish_reason = choice.value("finish_reason", "");
    }
    
    // Handle usage info
    if (j.contains("usage")) {
        resp.prompt_tokens = j["usage"].value("prompt_tokens", 0);
        resp.completion_tokens = j["usage"].value("completion_tokens", 0);
        resp.total_tokens = j["usage"].value("total_tokens", 0);
    }
    
    if (j.contains("metadata")) {
        resp.metadata = j["metadata"];
    }
    
    return resp;
}

// ModelManager implementation
class ModelManager::Impl {
public:
    explicit Impl(std::shared_ptr<HttpClient> http_client)
        : http_client_(std::move(http_client)) {}
    
    std::shared_ptr<HttpClient> http_client_;
};

ModelManager::ModelManager(std::shared_ptr<HttpClient> http_client)
    : impl_(std::make_unique<Impl>(std::move(http_client))) {}

ModelManager::~ModelManager() = default;

std::vector<ModelInfo> ModelManager::list() {
    auto response = impl_->http_client_->get("/api/v1/models");
    
    std::vector<ModelInfo> models;
    if (response.contains("models") && response["models"].is_array()) {
        for (const auto& model_json : response["models"]) {
            models.push_back(ModelInfo::from_json(model_json));
        }
    } else if (response.is_array()) {
        for (const auto& model_json : response) {
            models.push_back(ModelInfo::from_json(model_json));
        }
    }
    
    return models;
}

ModelInfo ModelManager::get(const std::string& model_name) {
    try {
        auto response = impl_->http_client_->get("/api/v1/models/" + model_name);
        return ModelInfo::from_json(response);
    } catch (const ApiError& e) {
        if (e.status_code == 404) {
            throw ModelNotFoundError(model_name);
        }
        throw;
    }
}

InferenceResponse ModelManager::infer(const InferenceRequest& request) {
    auto response = impl_->http_client_->post("/api/v1/inference", request.to_json());
    return InferenceResponse::from_json(response);
}

InferenceResponse ModelManager::infer_stream(const InferenceRequest& request, StreamCallback callback) {
    std::string accumulated;
    
    auto req_json = request.to_json();
    req_json["stream"] = true;
    
    impl_->http_client_->post_stream("/api/v1/inference", req_json, 
        [&accumulated, &callback](const std::string& chunk) {
            accumulated += chunk;
            callback(chunk);
        });
    
    // Return final response
    InferenceResponse resp;
    resp.model = request.model;
    resp.text = accumulated;
    return resp;
}

bool ModelManager::exists(const std::string& model_name) {
    try {
        get(model_name);
        return true;
    } catch (const ModelNotFoundError&) {
        return false;
    }
}

void ModelManager::download(const std::string& model_name, const json& options) {
    json body = {{"model", model_name}};
    if (!options.is_null()) {
        for (auto& [key, value] : options.items()) {
            body[key] = value;
        }
    }
    impl_->http_client_->post("/api/v1/models/download", body);
}

void ModelManager::remove(const std::string& model_name) {
    impl_->http_client_->del("/api/v1/models/" + model_name);
}

} // namespace cogsdk
