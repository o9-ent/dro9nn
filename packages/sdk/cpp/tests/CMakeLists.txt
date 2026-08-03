# Tests for cogsdk

# Fetch Catch2 for testing
FetchContent_Declare(
    Catch2
    GIT_REPOSITORY https://github.com/catchorg/Catch2.git
    GIT_TAG v3.5.2
    GIT_SHALLOW TRUE
)
FetchContent_MakeAvailable(Catch2)

# Test executable
add_executable(cogsdk_tests
    test_types.cpp
    test_client.cpp
)

target_link_libraries(cogsdk_tests
    PRIVATE
        cogsdk
        Catch2::Catch2WithMain
)

# Register tests with CTest
include(Catch)
catch_discover_tests(cogsdk_tests)
