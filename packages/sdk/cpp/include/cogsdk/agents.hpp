/**
 * @file agents.hpp
 * @brief Agent management for the o9nn Cognitive SDK
 */

#ifndef COGSDK_AGENTS_HPP
#define COGSDK_AGENTS_HPP

#include "cogsdk/types.hpp"
#include <memory>
#include <vector>

namespace cogsdk {

class HttpClient;

/**
 * @brief Manager for agent operations
 * 
 * Provides methods for creating, managing, and interacting with AI agents.
 */
class AgentManager {
public:
    /**
     * @brief Construct an agent manager
     * @param http_client Shared HTTP client
     */
    explicit AgentManager(std::shared_ptr<HttpClient> http_client);
    
    /**
     * @brief Destructor
     */
    ~AgentManager();
    
    /**
     * @brief List all agents
     * @return Vector of agent information
     */
    std::vector<AgentInfo> list();
    
    /**
     * @brief Get information about a specific agent
     * @param agent_id ID of the agent
     * @return Agent information
     * @throws AgentNotFoundError if agent doesn't exist
     */
    AgentInfo get(const std::string& agent_id);
    
    /**
     * @brief Create a new agent
     * @param config Agent configuration
     * @return Created agent information
     */
    AgentInfo create(const AgentConfig& config);
    
    /**
     * @brief Delete an agent
     * @param agent_id ID of the agent to delete
     */
    void remove(const std::string& agent_id);
    
    /**
     * @brief Send a message to an agent
     * @param agent_id ID of the agent
     * @param message Message content
     * @return Agent response
     */
    AgentResponse send(const std::string& agent_id, const std::string& message);
    
    /**
     * @brief Send a message to an agent with streaming
     * @param agent_id ID of the agent
     * @param message Message content
     * @param callback Callback for streaming chunks
     * @return Final agent response
     */
    AgentResponse send_stream(
        const std::string& agent_id,
        const std::string& message,
        StreamCallback callback
    );
    
    /**
     * @brief Get conversation history for an agent
     * @param agent_id ID of the agent
     * @return Vector of messages in the conversation
     */
    std::vector<AgentMessage> history(const std::string& agent_id);
    
    /**
     * @brief Clear conversation history for an agent
     * @param agent_id ID of the agent
     */
    void clear_history(const std::string& agent_id);

private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

} // namespace cogsdk

#endif // COGSDK_AGENTS_HPP
