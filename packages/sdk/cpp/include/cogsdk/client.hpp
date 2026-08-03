/**
 * @file client.hpp
 * @brief Main client for the o9nn Cognitive SDK
 */

#ifndef COGSDK_CLIENT_HPP
#define COGSDK_CLIENT_HPP

#include "cogsdk/types.hpp"
#include <memory>

namespace cogsdk {

// Forward declarations
class ModelManager;
class AgentManager;
class HttpClient;

/**
 * @brief Main client for interacting with the o9nn API
 * 
 * The Client class is the primary entry point for the SDK. It manages
 * the HTTP connection and provides access to resource managers.
 * 
 * @example
 * @code
 * cogsdk::Config config;
 * config.base_url = "http://localhost:8080";
 * config.api_key = "your-api-key";
 * 
 * cogsdk::Client client(config);
 * 
 * auto models = client.models().list();
 * @endcode
 */
class Client {
public:
    /**
     * @brief Construct a client with default configuration
     */
    Client();
    
    /**
     * @brief Construct a client with custom configuration
     * @param config SDK configuration
     */
    explicit Client(const Config& config);
    
    /**
     * @brief Destructor
     */
    ~Client();
    
    // Non-copyable
    Client(const Client&) = delete;
    Client& operator=(const Client&) = delete;
    
    // Movable
    Client(Client&& other) noexcept;
    Client& operator=(Client&& other) noexcept;
    
    /**
     * @brief Get the model manager
     * @return Reference to the model manager
     */
    ModelManager& models();
    
    /**
     * @brief Get the agent manager
     * @return Reference to the agent manager
     */
    AgentManager& agents();
    
    /**
     * @brief Get the current configuration
     * @return Current configuration
     */
    const Config& config() const;
    
    /**
     * @brief Check if the API is reachable
     * @return true if the API health check passes
     */
    bool health_check();
    
    /**
     * @brief Get the internal HTTP client
     * @return Shared pointer to HTTP client
     */
    std::shared_ptr<HttpClient> http_client() const;

private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

} // namespace cogsdk

#endif // COGSDK_CLIENT_HPP
