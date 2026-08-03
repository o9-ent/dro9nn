/**
 * @file http.cpp
 * @brief HTTP client implementation
 */

#include "http.hpp"
#include "cogsdk/errors.hpp"

#define CPPHTTPLIB_OPENSSL_SUPPORT
#include <httplib.h>

#include <sstream>

namespace cogsdk {

class HttpClient::Impl {
public:
    explicit Impl(const Config& config) : config_(config) {
        // Parse base URL
        std::string url = config.base_url;
        bool is_https = url.find("https://") == 0;
        
        // Remove protocol prefix
        if (is_https) {
            url = url.substr(8);
        } else if (url.find("http://") == 0) {
            url = url.substr(7);
        }
        
        // Extract host and port
        std::string host = url;
        int port = is_https ? 443 : 80;
        
        auto colon_pos = url.find(':');
        if (colon_pos != std::string::npos) {
            host = url.substr(0, colon_pos);
            port = std::stoi(url.substr(colon_pos + 1));
        } else {
            // Remove path if present
            auto slash_pos = url.find('/');
            if (slash_pos != std::string::npos) {
                host = url.substr(0, slash_pos);
            }
        }
        
        if (is_https) {
            https_client_ = std::make_unique<httplib::SSLClient>(host, port);
            https_client_->set_connection_timeout(config.timeout.count());
            https_client_->set_read_timeout(config.timeout.count());
        } else {
            http_client_ = std::make_unique<httplib::Client>(host, port);
            http_client_->set_connection_timeout(config.timeout.count());
            http_client_->set_read_timeout(config.timeout.count());
        }
    }
    
    httplib::Headers build_headers() {
        httplib::Headers headers;
        headers.emplace("Content-Type", "application/json");
        
        if (!config_.api_key.empty()) {
            headers.emplace("Authorization", "Bearer " + config_.api_key);
        }
        
        for (const auto& [key, value] : config_.headers) {
            headers.emplace(key, value);
        }
        
        return headers;
    }
    
    json handle_response(const httplib::Result& result, const std::string& endpoint) {
        if (!result) {
            throw NetworkError("Request to " + endpoint + " failed: connection error");
        }
        
        if (result->status >= 400) {
            if (result->status == 401) {
                throw AuthenticationError();
            }
            if (result->status == 429) {
                throw RateLimitError();
            }
            throw ApiError(result->status, httplib::status_message(result->status), result->body);
        }
        
        if (result->body.empty()) {
            return json::object();
        }
        
        try {
            return json::parse(result->body);
        } catch (const json::parse_error& e) {
            throw Error("Failed to parse response: " + std::string(e.what()));
        }
    }
    
    json get(const std::string& endpoint) {
        auto headers = build_headers();
        
        httplib::Result result;
        if (https_client_) {
            result = https_client_->Get(endpoint, headers);
        } else {
            result = http_client_->Get(endpoint, headers);
        }
        
        return handle_response(result, endpoint);
    }
    
    json post(const std::string& endpoint, const json& body) {
        auto headers = build_headers();
        std::string body_str = body.dump();
        
        httplib::Result result;
        if (https_client_) {
            result = https_client_->Post(endpoint, headers, body_str, "application/json");
        } else {
            result = http_client_->Post(endpoint, headers, body_str, "application/json");
        }
        
        return handle_response(result, endpoint);
    }
    
    json put(const std::string& endpoint, const json& body) {
        auto headers = build_headers();
        std::string body_str = body.dump();
        
        httplib::Result result;
        if (https_client_) {
            result = https_client_->Put(endpoint, headers, body_str, "application/json");
        } else {
            result = http_client_->Put(endpoint, headers, body_str, "application/json");
        }
        
        return handle_response(result, endpoint);
    }
    
    json del(const std::string& endpoint) {
        auto headers = build_headers();
        
        httplib::Result result;
        if (https_client_) {
            result = https_client_->Delete(endpoint, headers);
        } else {
            result = http_client_->Delete(endpoint, headers);
        }
        
        return handle_response(result, endpoint);
    }
    
    void post_stream(const std::string& endpoint, const json& body, StreamCallback callback) {
        auto headers = build_headers();
        std::string body_str = body.dump();
        
        auto content_receiver = [&callback](const char* data, size_t length) {
            callback(std::string(data, length));
            return true;
        };
        
        httplib::Result result;
        if (https_client_) {
            result = https_client_->Post(
                endpoint, headers, body_str, "application/json",
                content_receiver
            );
        } else {
            result = http_client_->Post(
                endpoint, headers, body_str, "application/json",
                content_receiver
            );
        }
        
        if (!result || result->status >= 400) {
            handle_response(result, endpoint);
        }
    }
    
    const Config& config() const { return config_; }

private:
    Config config_;
    std::unique_ptr<httplib::Client> http_client_;
    std::unique_ptr<httplib::SSLClient> https_client_;
};

HttpClient::HttpClient(const Config& config) : impl_(std::make_unique<Impl>(config)) {}
HttpClient::~HttpClient() = default;

json HttpClient::get(const std::string& endpoint) {
    return impl_->get(endpoint);
}

json HttpClient::post(const std::string& endpoint, const json& body) {
    return impl_->post(endpoint, body);
}

json HttpClient::put(const std::string& endpoint, const json& body) {
    return impl_->put(endpoint, body);
}

json HttpClient::del(const std::string& endpoint) {
    return impl_->del(endpoint);
}

void HttpClient::post_stream(const std::string& endpoint, const json& body, StreamCallback callback) {
    impl_->post_stream(endpoint, body, callback);
}

const Config& HttpClient::config() const {
    return impl_->config();
}

} // namespace cogsdk
