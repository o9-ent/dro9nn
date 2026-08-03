/**
 * @file test_client.cpp
 * @brief Tests for Client class
 */

#include <catch2/catch_test_macros.hpp>
#include <cogsdk/cogsdk.hpp>

using namespace cogsdk;

TEST_CASE("Client can be created with default config", "[client]") {
    Client client;
    
    REQUIRE(client.config().base_url == "http://localhost:8080");
    REQUIRE(client.config().api_key.empty());
}

TEST_CASE("Client can be created with custom config", "[client]") {
    Config config;
    config.base_url = "https://api.example.com";
    config.api_key = "test-key";
    config.timeout = std::chrono::seconds(60);
    
    Client client(config);
    
    REQUIRE(client.config().base_url == "https://api.example.com");
    REQUIRE(client.config().api_key == "test-key");
    REQUIRE(client.config().timeout.count() == 60);
}

TEST_CASE("Client provides access to managers", "[client]") {
    Client client;
    
    // These should not throw
    [[maybe_unused]] auto& models = client.models();
    [[maybe_unused]] auto& agents = client.agents();
}

TEST_CASE("Client is movable", "[client]") {
    Config config;
    config.api_key = "test-key";
    
    Client client1(config);
    Client client2 = std::move(client1);
    
    REQUIRE(client2.config().api_key == "test-key");
}

TEST_CASE("SDK version constants are defined", "[version]") {
    REQUIRE(std::string(VERSION) == "0.1.0");
    REQUIRE(VERSION_MAJOR == 0);
    REQUIRE(VERSION_MINOR == 1);
    REQUIRE(VERSION_PATCH == 0);
}
