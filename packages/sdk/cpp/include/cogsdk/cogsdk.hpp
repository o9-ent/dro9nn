/**
 * @file cogsdk.hpp
 * @brief Main header for the o9nn Cognitive SDK
 * 
 * This is the main entry point for the C++ SDK. Include this header
 * to access all SDK functionality.
 */

#ifndef COGSDK_COGSDK_HPP
#define COGSDK_COGSDK_HPP

#include "cogsdk/types.hpp"
#include "cogsdk/client.hpp"
#include "cogsdk/models.hpp"
#include "cogsdk/agents.hpp"
#include "cogsdk/errors.hpp"

/**
 * @namespace cogsdk
 * @brief o9nn Cognitive SDK namespace
 * 
 * Contains all classes and functions for interacting with the o9nn
 * cognitive computing platform.
 */
namespace cogsdk {

/// SDK version string
constexpr const char* VERSION = "0.1.0";

/// SDK version major number
constexpr int VERSION_MAJOR = 0;

/// SDK version minor number
constexpr int VERSION_MINOR = 1;

/// SDK version patch number
constexpr int VERSION_PATCH = 0;

} // namespace cogsdk

#endif // COGSDK_COGSDK_HPP
