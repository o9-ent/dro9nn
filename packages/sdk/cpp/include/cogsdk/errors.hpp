/**
 * @file errors.hpp
 * @brief Error types for the o9nn Cognitive SDK
 */

#ifndef COGSDK_ERRORS_HPP
#define COGSDK_ERRORS_HPP

#include <exception>
#include <string>

namespace cogsdk {

/**
 * @brief Base exception for SDK errors
 */
class Error : public std::exception {
public:
    explicit Error(std::string message) : message_(std::move(message)) {}
    
    const char* what() const noexcept override {
        return message_.c_str();
    }
    
protected:
    std::string message_;
};

/**
 * @brief API error with status code
 */
class ApiError : public Error {
public:
    ApiError(int status_code, std::string message, std::string body = "")
        : Error(std::move(message))
        , status_code(status_code)
        , body(std::move(body)) {}
    
    /// HTTP status code
    int status_code;
    
    /// Response body
    std::string body;
};

/**
 * @brief Network/connection error
 */
class NetworkError : public Error {
public:
    explicit NetworkError(std::string message) : Error(std::move(message)) {}
};

/**
 * @brief Request timeout error
 */
class TimeoutError : public Error {
public:
    explicit TimeoutError(std::string message = "Request timed out")
        : Error(std::move(message)) {}
};

/**
 * @brief Configuration error
 */
class ConfigError : public Error {
public:
    explicit ConfigError(std::string message) : Error(std::move(message)) {}
};

/**
 * @brief Validation error
 */
class ValidationError : public Error {
public:
    explicit ValidationError(std::string message) : Error(std::move(message)) {}
};

/**
 * @brief Model not found error
 */
class ModelNotFoundError : public ApiError {
public:
    explicit ModelNotFoundError(const std::string& model_name)
        : ApiError(404, "Model not found: " + model_name) {}
};

/**
 * @brief Agent not found error
 */
class AgentNotFoundError : public ApiError {
public:
    explicit AgentNotFoundError(const std::string& agent_id)
        : ApiError(404, "Agent not found: " + agent_id) {}
};

/**
 * @brief Authentication error
 */
class AuthenticationError : public ApiError {
public:
    explicit AuthenticationError(std::string message = "Authentication failed")
        : ApiError(401, std::move(message)) {}
};

/**
 * @brief Rate limit exceeded error
 */
class RateLimitError : public ApiError {
public:
    explicit RateLimitError(int retry_after = 0)
        : ApiError(429, "Rate limit exceeded")
        , retry_after(retry_after) {}
    
    /// Seconds to wait before retrying
    int retry_after;
};

} // namespace cogsdk

#endif // COGSDK_ERRORS_HPP
