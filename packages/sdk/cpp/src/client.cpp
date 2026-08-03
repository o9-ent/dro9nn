/**
 * @file client.cpp
 * @brief Client implementation
 */

#include "cogsdk/client.hpp"
#include "cogsdk/models.hpp"
#include "cogsdk/agents.hpp"
#include "cogsdk/errors.hpp"
#include "http.hpp"

namespace cogsdk {

class Client::Impl {
public:
    explicit Impl(const Config& config) 
        : config_(config)
        , http_client_(std::make_shared<HttpClient>(config))
        , model_manager_(std::make_unique<ModelManager>(http_client_))
        , agent_manager_(std::make_unique<AgentManager>(http_client_)) {}
    
    Config config_;
    std::shared_ptr<HttpClient> http_client_;
    std::unique_ptr<ModelManager> model_manager_;
    std::unique_ptr<AgentManager> agent_manager_;
};

Client::Client() : Client(Config{}) {}

Client::Client(const Config& config) : impl_(std::make_unique<Impl>(config)) {}

Client::~Client() = default;

Client::Client(Client&& other) noexcept = default;
Client& Client::operator=(Client&& other) noexcept = default;

ModelManager& Client::models() {
    return *impl_->model_manager_;
}

AgentManager& Client::agents() {
    return *impl_->agent_manager_;
}

const Config& Client::config() const {
    return impl_->config_;
}

bool Client::health_check() {
    try {
        impl_->http_client_->get("/health");
        return true;
    } catch (const Error&) {
        return false;
    }
}

std::shared_ptr<HttpClient> Client::http_client() const {
    return impl_->http_client_;
}

} // namespace cogsdk
