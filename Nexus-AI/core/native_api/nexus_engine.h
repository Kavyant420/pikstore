// nexus_engine.h — Nexus - By PIK Intelligence
// Embedded native inference engine API (V0.1).
//
// This is the single C ABI boundary between the Nexus application shell
// (Windows desktop, Android JNI, CLI test host) and the bundled llama.cpp
// runtime. There is NO network involvement: models are loaded from local
// GGUF files only.
#ifndef NEXUS_ENGINE_H
#define NEXUS_ENGINE_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#if defined(_WIN32)
  #ifdef NEXUS_ENGINE_BUILD
    #define NEXUS_API __declspec(dllexport)
  #else
    #define NEXUS_API __declspec(dllimport)
  #endif
#else
  #define NEXUS_API __attribute__((visibility("default")))
#endif

typedef struct nexus_engine nexus_engine_t;

// Generation parameters exposed to the UI (temperature / top-p / ctx etc.)
typedef struct nexus_gen_params {
    int32_t   max_tokens;        // <=0: default (128 used when unset)
    float     temperature;       // 0..2
    float     top_p;             // 0..1
    int32_t   seed;              // 0 = random
    int32_t   n_threads;         // <=0: auto
} nexus_gen_params_t;

// Callback invoked for every decoded text delta while streaming.
// Return non-zero to request cancellation of the current generation.
typedef int (*nexus_token_cb)(const char * utf8, void * user);

// Load a GGUF model + create context. Fully offline (mmap enabled).
// model_path : local .gguf file (required)
// ctx_len    : KV/context size (clamped by runtime)
// On failure returns NULL and fills err (if provided).
NEXUS_API nexus_engine_t * nexus_engine_create(const char * model_path,
                                               int32_t      ctx_len,
                                               char *       err,
                                               int          err_len);

// Destroy engine, free all native resources. Safe to call with NULL.
NEXUS_API void nexus_engine_destroy(nexus_engine_t * eng);

// Chat completion. messages_json is an array:
//   [{"role":"system","content":"..."},{"role":"user","content":"..."}]
// The model's own chat template (from the GGUF) is applied internally.
// Streams deltas through on_token; returns 0 on success, negative on error.
// out_tokens receives generated token count (may be NULL).
NEXUS_API int nexus_engine_chat(nexus_engine_t *           eng,
                                const char *               messages_json,
                                const nexus_gen_params_t * gp,
                                nexus_token_cb             on_token,
                                void *                     user,
                                int32_t *                  out_tokens);

// Engine info as a JSON string (model metadata, quantization, vocab size…).
// Returned pointer owned by engine; valid until next call.
NEXUS_API const char * nexus_engine_info_json(nexus_engine_t * eng);

#ifdef __cplusplus
}
#endif

#endif // NEXUS_ENGINE_H
