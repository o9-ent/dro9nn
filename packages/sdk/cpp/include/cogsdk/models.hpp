/**
 * @file models.hpp
 * @brief Model management for the o9nn Cognitive SDK
 */

#ifndef COGSDK_MODELS_HPP
#define COGSDK_MODELS_HPP

#include "cogsdk/types.hpp"
#include <memory>
#include <vector>

namespace cogsdk {

class HttpClient;

/**
 * @brief Manager for model operations
 * 
 * Provides methods for listing, querying, and running inference on models.
 */
class ModelManager {
public:
    /**
     * @brief Construct a model manager
     * @param http_client Shared HTTP client
     */
    explicit ModelManager(std::shared_ptr<HttpClient> http_client);
    
    /**
     * @brief Destructor
     */
    ~ModelManager();
    
    /**
     * @brief List all available models
     * @return Vector of model information
     */
    std::vector<ModelInfo> list();
    
    /**
     * @brief Get information about a specific model
     * @param model_name Name of the model
     * @return Model information
     * @throws ModelNotFoundError if model doesn't exist
     */
    ModelInfo get(const std::string& model_name);
    
    /**
     * @brief Run inference on a model
     * @param request Inference request
     * @return Inference response
     */
    InferenceResponse infer(const InferenceRequest& request);
    
    /**
     * @brief Run streaming inference on a model
     * @param request Inference request
     * @param callback Callback for streaming chunks
     * @return Final inference response
     */
    InferenceResponse infer_stream(
        const InferenceRequest& request,
        StreamCallback callback
    );
    
    /**
     * @brief Check if a model exists
     * @param model_name Name of the model
     * @return true if model exists
     */
    bool exists(const std::string& model_name);
    
    /**
     * @brief Download a model
     * @param model_name Name of the model to download
     * @param options Optional download options
     */
    void download(const std::string& model_name, const json& options = {});
    
    /**
     * @brief Delete a model
     * @param model_name Name of the model to delete
     */
    void remove(const std::string& model_name);

private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

} // namespace cogsdk

#endif // COGSDK_MODELS_HPP
