# nexus-agent-apk/engine/CMakeLists.txt
# Standalone build for the Nexus Assistant Android engine (libnexus_engine.so).
#
# Produces ONE self-contained shared library with llama.cpp + ggml statically
# embedded, so the APK only has to ship a single .so per ABI.
#
# Configure (NDK cross-compile):
#   cmake -S . -B build/arm64-v8a \
#     -DCMAKE_TOOLCHAIN_FILE=$NDK/build/cmake/android.toolchain.cmake \
#     -DANDROID_ABI=arm64-v8a -DANDROID_PLATFORM=android-24 \
#     -DCMAKE_BUILD_TYPE=Release -GNinja
#   cmake --build build/arm64-v8a -j
#
# Or let Gradle drive it via app/build.gradle.kts (externalNativeBuild).
cmake_minimum_required(VERSION 3.22.1)

project(nexus_engine LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ---------------------------------------------------------------------------
# Bundled llama.cpp runtime (two levels up: ../../Nexus-AI/core/inference)
# ---------------------------------------------------------------------------
get_filename_component(NEXUS_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/../.." ABSOLUTE)
set(LLAMA_CPP_DIR "${NEXUS_ROOT}/Nexus-AI/core/inference/llama.cpp"
    CACHE PATH "Path to the bundled llama.cpp tree")

if(NOT EXISTS "${LLAMA_CPP_DIR}/CMakeLists.txt")
    message(FATAL_ERROR "llama.cpp not found at ${LLAMA_CPP_DIR}")
endif()

# CPU-only, no examples/tests/server; everything static so we can fold it
# into a single libnexus_engine.so.
set(BUILD_SHARED_LIBS      OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_COMMON     ON  CACHE BOOL "" FORCE)
set(LLAMA_BUILD_TESTS      OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_EXAMPLES   OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_SERVER     OFF CACHE BOOL "" FORCE)
set(LLAMA_LLGUIDANCE       OFF CACHE BOOL "" FORCE)
set(GGML_LLAMAFILE         OFF CACHE BOOL "" FORCE)
set(GGML_OPENMP            OFF CACHE BOOL "" FORCE)
set(GGML_BUILD_TESTS       OFF CACHE BOOL "" FORCE)
set(GGML_BUILD_EXAMPLES    OFF CACHE BOOL "" FORCE)

add_subdirectory("${LLAMA_CPP_DIR}" build-llama EXCLUDE_FROM_ALL)

find_package(Threads REQUIRED)

# ---------------------------------------------------------------------------
# The JNI engine shell — compiled directly against the sources of `llama`
# and `common` so the linker can fold them into one shared object. This
# avoids libllama.so.50x SONAME churn inside the APK.
# ---------------------------------------------------------------------------
file(GLOB NEXUS_LLAMA_SRC "${LLAMA_CPP_DIR}/src/*.cpp")
file(GLOB NEXUS_GGML_SRC  "${LLAMA_CPP_DIR}/ggml/src/*.c"
                           "${LLAMA_CPP_DIR}/ggml/src/*.cpp")
file(GLOB NEXUS_GGML_CPU  "${LLAMA_CPP_DIR}/ggml/src/ggml-cpu/*.cpp"
                          "${LLAMA_CPP_DIR}/ggml/src/ggml-cpu/*.c")
file(GLOB NEXUS_COMMON_SRC "${LLAMA_CPP_DIR}/common/*.cpp")

add_library(nexus_engine SHARED
    nexus_android_engine.cpp
    ${NEXUS_LLAMA_SRC}
    ${NEXUS_GGML_SRC}
    ${NEXUS_GGML_CPU}
    ${NEXUS_COMMON_SRC})

target_compile_definitions(nexus_engine PRIVATE
    LLAMA_LIBRARY_DYNAMIC_ALLOCATIONS=0)

target_include_directories(nexus_engine PRIVATE
    "${LLAMA_CPP_DIR}/include"
    "${LLAMA_CPP_DIR}/ggml/include"
    "${LLAMA_CPP_DIR}/ggml/src"
    "${LLAMA_CPP_DIR}/src"
    "${LLAMA_CPP_DIR}/common")

target_link_libraries(nexus_engine PRIVATE
    android log m Threads::Threads)

set_target_properties(nexus_engine PROPERTIES
    OUTPUT_NAME "nexus_engine"
    C_VISIBILITY_PRESET default
    CXX_VISIBILITY_PRESET default)
