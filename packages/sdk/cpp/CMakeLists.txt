cmake_minimum_required(VERSION 3.16)
project(cogsdk VERSION 0.1.0 LANGUAGES CXX)

# C++ Standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Options
option(COGSDK_BUILD_TESTS "Build tests" ON)
option(COGSDK_BUILD_EXAMPLES "Build examples" OFF)
option(COGSDK_USE_SYSTEM_JSON "Use system nlohmann_json" OFF)

# Dependencies
include(FetchContent)

# nlohmann_json
if(NOT COGSDK_USE_SYSTEM_JSON)
    FetchContent_Declare(
        json
        GIT_REPOSITORY https://github.com/nlohmann/json.git
        GIT_TAG v3.11.3
        GIT_SHALLOW TRUE
    )
    FetchContent_MakeAvailable(json)
else()
    find_package(nlohmann_json REQUIRED)
endif()

# httplib (header-only HTTP library)
FetchContent_Declare(
    httplib
    GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
    GIT_TAG v0.15.3
    GIT_SHALLOW TRUE
)
FetchContent_MakeAvailable(httplib)

# Library sources
set(COGSDK_SOURCES
    src/client.cpp
    src/models.cpp
    src/agents.cpp
    src/http.cpp
)

# Create library
add_library(cogsdk ${COGSDK_SOURCES})
add_library(cogsdk::cogsdk ALIAS cogsdk)

target_include_directories(cogsdk
    PUBLIC
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
        $<INSTALL_INTERFACE:include>
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/src
)

target_link_libraries(cogsdk
    PUBLIC
        nlohmann_json::nlohmann_json
    PRIVATE
        httplib::httplib
)

# OpenSSL for HTTPS support
find_package(OpenSSL)
if(OpenSSL_FOUND)
    target_link_libraries(cogsdk PRIVATE OpenSSL::SSL OpenSSL::Crypto)
    target_compile_definitions(cogsdk PRIVATE CPPHTTPLIB_OPENSSL_SUPPORT)
endif()

# Compiler warnings
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    target_compile_options(cogsdk PRIVATE -Wall -Wextra -Wpedantic)
elseif(CMAKE_CXX_COMPILER_ID STREQUAL "MSVC")
    target_compile_options(cogsdk PRIVATE /W4)
endif()

# Tests
if(COGSDK_BUILD_TESTS)
    enable_testing()
    add_subdirectory(tests)
endif()

# Installation
include(GNUInstallDirs)
include(CMakePackageConfigHelpers)

install(TARGETS cogsdk
    EXPORT cogsdkTargets
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
    INCLUDES DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}
)

install(DIRECTORY include/cogsdk
    DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}
)

install(EXPORT cogsdkTargets
    FILE cogsdkTargets.cmake
    NAMESPACE cogsdk::
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/cogsdk
)

# Package configuration
write_basic_package_version_file(
    "${CMAKE_CURRENT_BINARY_DIR}/cogsdkConfigVersion.cmake"
    VERSION ${PROJECT_VERSION}
    COMPATIBILITY SameMajorVersion
)

configure_package_config_file(
    "${CMAKE_CURRENT_SOURCE_DIR}/cmake/cogsdkConfig.cmake.in"
    "${CMAKE_CURRENT_BINARY_DIR}/cogsdkConfig.cmake"
    INSTALL_DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/cogsdk
)

install(FILES
    "${CMAKE_CURRENT_BINARY_DIR}/cogsdkConfig.cmake"
    "${CMAKE_CURRENT_BINARY_DIR}/cogsdkConfigVersion.cmake"
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/cogsdk
)

# pkg-config
configure_file(
    "${CMAKE_CURRENT_SOURCE_DIR}/cmake/cogsdk.pc.in"
    "${CMAKE_CURRENT_BINARY_DIR}/cogsdk.pc"
    @ONLY
)

install(FILES "${CMAKE_CURRENT_BINARY_DIR}/cogsdk.pc"
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/pkgconfig
)
