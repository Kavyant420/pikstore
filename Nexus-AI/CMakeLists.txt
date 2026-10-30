# Nexus - By PIK Intelligence (V0.1)
# Top-level build for the native inference core:
#   * libnexus_engine  — shared library wrapping the bundled llama.cpp runtime
#   * nexus-cli        — offline streaming test host (apps/desktop/src/nexus_cli.cpp)
#
# Configure & build (Linux/macOS):
#   cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
#   cmake --build build -j
# Cross-compile instructions for Windows/Android live in docs/BUILD_TARGETS.md.
cmake_minimum_required(VERSION 3.16)

project(NexusAI VERSION 0.1.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release CACHE STRING "Build type" FORCE)
endif()

# Hide everything except the NEXUS_API C ABI in the shared engine library.
set(CMAKE_CXX_VISIBILITY_PRESET hidden)
set(CMAKE_VISIBILITY_INLINES_HIDDEN ON)

# ---------------------------------------------------------------------------
# Bundled llama.cpp runtime (offline, CPU-first). Keep heavy extras disabled.
# ---------------------------------------------------------------------------
set(LLAMA_BUILD_COMMON     ON  CACHE BOOL "" FORCE)
set(LLAMA_BUILD_TESTS      OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_EXAMPLES   OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_SERVER     OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_UI         OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_TOOLS      OFF CACHE BOOL "" FORCE)
set(LLAMA_LLGUIDANCE       OFF CACHE BOOL "" FORCE)
set(BUILD_SHARED_LIBS      OFF CACHE BOOL "" FORCE)

add_subdirectory(core/inference/llama.cpp EXCLUDE_FROM_ALL)

find_package(Threads REQUIRED)

# ---------------------------------------------------------------------------
# nexus_engine — the single C ABI boundary for all Nexus app shells
# ---------------------------------------------------------------------------
add_library(nexus_engine SHARED
    core/native_api/nexus_engine.cpp)

target_include_directories(nexus_engine PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/core/native_api)

target_compile_definitions(nexus_engine PRIVATE NEXUS_ENGINE_BUILD)

target_link_libraries(nexus_engine PRIVATE
    llama
    common
    Threads::Threads)

set_target_properties(nexus_engine PROPERTIES OUTPUT_NAME "nexus_engine")

# ---------------------------------------------------------------------------
# nexus-cli — desktop/test host
# ---------------------------------------------------------------------------
add_executable(nexus-cli apps/desktop/src/nexus_cli.cpp)
target_link_libraries(nexus-cli PRIVATE nexus_engine)

# ---------------------------------------------------------------------------
# Model provisioning helper target (offline-safe):
#   cmake --build build --target provision-model
# Runs scripts/provision_model.sh which fetches Qwen3-0.6B GGUF (one-time,
# pinned URL + SHA-256 verification) into models/. The engine itself NEVER
# downloads anything at runtime.
# ---------------------------------------------------------------------------
add_custom_target(provision-model
    COMMAND ${CMAKE_COMMAND} -E env MODELS_DIR=${CMAKE_CURRENT_SOURCE_DIR}/models
            bash ${CMAKE_CURRENT_SOURCE_DIR}/scripts/provision_model.sh
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    COMMENT "Provisioning Qwen3-0.6B GGUF with SHA-256 integrity check")

enable_testing()
add_test(NAME cli_smoke_no_args
         COMMAND nexus-cli)
set_tests_properties(cli_smoke_no_args PROPERTIES WILL_FAIL TRUE)
