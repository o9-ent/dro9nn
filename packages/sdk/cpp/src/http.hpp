/**
 * @file http.hpp
 * @brief Internal HTTP client for the SDK
 */

#ifndef COGSDK_HTTP_HPP
#define COGSDK_HTTP_HPP

#include "cogsdk/types.hpp"
#include <memory>

namespace cogsdk {

/**
 * @brief Internal HTTP client for API requests
 */
class HttpClient {
public:
    explicit HttpClient(const Config& config);
    ~HttpClient();
    
    // Non-copyable
    HttpClient(const HttpClient&) = delete;
    HttpClient& operator=(const HttpClient&) = delete;
    
    /**
     * @brief Make a GET request
     * @param endpoint API endpoint
     * @return Response as JSON
     */
    json get(const std::string& endpoint);
    
    /**
     * @brief Make a POST request
     * @param endpoint API endpoint
     * @param body Request body
     * @return Response as JSON
     */
    json post(const std::string& endpoint, const json& body);
    
    /**
     * @brief Make a PUT request
     * @param endpoint API endpoint
     * @param body Request body
     * @return Response as JSON
     */
    json put(const std::string& endpoint, const json& body);
    
    /**
     * @brief Make a DELETE request
     * @param endpoint API endpoint
     * @return Response as JSON
     */
    json del(const std::string& endpoint);
    
    /**
     * @brief Make a streaming POST request
     * @param endpoint API endpoint
     * @param body Request body
     * @param callback Callback for each chunk
     */
    void post_stream(
        const std::string& endpoint,
        const json& body,
        StreamCallback callback
    );
    
    /**
     * @brief Get the configuration
     * @return Current configuration
     */
    const Config& config() const;

private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

} // namespace cogsdk

#endif // COGSDK_HTTP_HPP
