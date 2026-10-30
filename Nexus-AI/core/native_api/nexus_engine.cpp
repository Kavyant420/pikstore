// nexus_engine.cpp — Nexus - By PIK Intelligence (V0.1 core)
//
// Wraps the bundled llama.cpp runtime behind a small, stable C ABI.
//  * Loads GGUF entirely from local disk (mmap); never downloads anything.
//  * Applies the model's embedded chat template via common/chat.h.
//  * Streams decoded UTF-8 deltas token-by-token to the UI callback.
//  * Honours cancellation through the callback return value.
#include "nexus_engine.h"

#include "llama.h"
#include "chat.h"
#include "common.h"
#include "json.hpp"
#include "sampling.h"
#include "log.h"

#include <atomic>
#include <cstring>
#include <ctime>
#include <mutex>
#include <stdexcept>
#include <string>
#include <thread>
#include <vector>

using json = nlohmann::ordered_json;

struct nexus_engine {
    llama_model * model = nullptr;
    llama_context * ctx = nullptr;
    common_chat_templates_ptr tmpls;
    std::atomic<bool> busy{false};
    std::string info_json;
    std::mutex info_mtx;
};

// b4900 does not export a unique_ptr alias for the sampler — own it here.
struct nexus_sampler_deleter {
    void operator()(common_sampler * s) { common_sampler_free(s); }
};
using nexus_sampler_ptr = std::unique_ptr<common_sampler, nexus_sampler_deleter>;

static void set_err(char * err, int err_len, const std::string & msg) {
    if (err && err_len > 0) {
        std::strncpy(err, msg.c_str(), err_len - 1);
        err[err_len - 1] = '\0';
    }
}

extern "C" NEXUS_API nexus_engine_t * nexus_engine_create(const char * model_path,
                                                          int32_t ctx_len,
                                                          char * err,
                                                          int err_len) {
    if (!model_path || !*model_path) {
        set_err(err, err_len, "no model path provided");
        return nullptr;
    }

    auto * eng = new (std::nothrow) nexus_engine();
    if (!eng) {
        set_err(err, err_len, "out of memory allocating engine");
        return nullptr;
    }

    // Silence llama.cpp log spam; errors are surfaced explicitly instead.
    common_log_set_verbosity_thold(0);

    llama_model_params mparams = llama_model_default_params();
    mparams.use_mmap  = true;   // memory-mapped load (performance requirement)
    mparams.use_mlock = false;
    mparams.check_tensors = true; // model integrity validation on load
    eng->model = llama_model_load_from_file(model_path, mparams);
    if (!eng->model) {
        set_err(err, err_len, std::string("failed to load GGUF model: ") + model_path +
                              ". Verify the file with SHA-256 and re-provision it.");
        delete eng;
        return nullptr;
    }

    llama_context_params cparams = llama_context_default_params();
    cparams.n_ctx          = ctx_len > 0 ? (uint32_t) ctx_len : 4096;
    cparams.n_batch        = 512;
    eng->ctx = llama_init_from_model(eng->model, cparams);
    if (!eng->ctx) {
        set_err(err, err_len, "failed to create llama context (try a smaller context length)");
        llama_model_free(eng->model);
        delete eng;
        return nullptr;
    }

    // Chat templates come from the model itself (GGUF metadata).
    eng->tmpls = common_chat_templates_init(eng->model, /* chat_template override */ {});
    if (!eng->tmpls) {
        set_err(err, err_len, "model has no usable chat template");
        llama_free(eng->ctx);
        llama_model_free(eng->model);
        delete eng;
        return nullptr;
    }

    // Build info JSON once.
    char qname[128] = {0};
    llama_model_meta_val_str(eng->model, "general.quantization_version", qname, sizeof(qname));
    json info;
    info["file"]         = model_path;
    info["quantization"] = qname;
    const llama_vocab * v = llama_model_get_vocab(eng->model);
    info["n_vocab"]      = (int64_t) llama_vocab_n_tokens(v);
    info["n_ctx_train"]  = (int64_t) llama_model_n_ctx_train(eng->model);
    info["n_ctx"]        = (int64_t) llama_n_ctx(eng->ctx);
    info["offline"]      = true;
    {
        std::lock_guard<std::mutex> lk(eng->info_mtx);
        eng->info_json = info.dump();
    }
    return eng;
}

extern "C" NEXUS_API void nexus_engine_destroy(nexus_engine_t * eng) {
    if (!eng) return;
    while (eng->busy.load()) std::this_thread::yield(); // wait for generation to end
    if (eng->ctx)   llama_free(eng->ctx);
    if (eng->model) llama_model_free(eng->model);
    delete eng;
}

extern "C" NEXUS_API const char * nexus_engine_info_json(nexus_engine_t * eng) {
    if (!eng) return "{}";
    std::lock_guard<std::mutex> lk(eng->info_mtx);
    return eng->info_json.c_str();
}

extern "C" NEXUS_API int nexus_engine_chat(nexus_engine_t * eng,
                                           const char * messages_json,
                                           const nexus_gen_params_t * gp,
                                           nexus_token_cb on_token,
                                           void * user,
                                           int32_t * out_tokens) {
    if (!eng || !messages_json || !on_token) return -1;
    if (eng->busy.exchange(true)) return -2; // one generation at a time

    int rc = 0;
    int32_t n_generated = 0;

    try {
        json jmsg = json::parse(messages_json);
        if (!jmsg.is_array()) throw std::runtime_error("messages must be a JSON array");

        std::vector<common_chat_msg> msgs;
        for (auto & m : jmsg) {
            common_chat_msg msg;
            msg.role    = m.at("role").get<std::string>();
            msg.content = m.at("content").get<std::string>();
            msgs.push_back(std::move(msg));
        }

        common_chat_templates_inputs inputs;
        inputs.messages              = std::move(msgs);
        inputs.add_generation_prompt = true;
        inputs.use_jinja             = true;
        inputs.extract_reasoning     = false; // Qwen3: no thinking block on CPU chat

        auto applied = common_chat_templates_apply(eng->tmpls.get(), inputs);
        const std::string & prompt = applied.prompt;

        const llama_vocab * vocab = llama_model_get_vocab(eng->model);

        std::vector<llama_token> tokens(prompt.size() * 4 + 8);
        int n_tok = llama_tokenize(vocab,
                                   prompt.data(), (int32_t) prompt.size(),
                                   tokens.data(), (int32_t) tokens.size(),
                                   /* add_special */ true, /* parse_special */ true);
        if (n_tok <= 0) throw std::runtime_error("prompt tokenization failed");
        tokens.resize((size_t) n_tok);

        common_params_sampling sp;
        sp.temp  = gp ? gp->temperature : 0.7f;
        sp.top_p = gp ? gp->top_p : 0.8f;
        sp.seed  = (gp && gp->seed != 0) ? gp->seed : (int32_t) std::time(nullptr);
        nexus_sampler_ptr smpl(common_sampler_init(eng->model, sp));

        const int32_t max_new = (gp && gp->max_tokens > 0) ? gp->max_tokens : 128;

        // Context capacity guard: trim oldest prompt tokens if it cannot fit.
        uint32_t n_ctx = llama_n_ctx(eng->ctx);
        if ((uint32_t) n_tok + (uint32_t) max_new > n_ctx) {
            int32_t room = (int32_t) n_ctx - max_new - 8;
            if (room < 8) throw std::runtime_error("context too small for this request");
            tokens.erase(tokens.begin(), tokens.begin() + (n_tok - room));
        }

        llama_batch batch = llama_batch_get_one(tokens.data(), (int32_t) tokens.size());
        bool cancelled = false;
        std::string piece;

        while (!cancelled) {
            if (llama_decode(eng->ctx, batch) != 0) {
                throw std::runtime_error("decode failed (low memory? reduce context length)");
            }
            llama_token new_token = common_sampler_sample(smpl.get(), eng->ctx, -1, true);
            common_sampler_accept(smpl.get(), new_token, true);
            ++n_generated;

            const bool is_eog = llama_vocab_is_eog(vocab, new_token);
            if (!is_eog) {
                int n = llama_token_to_piece(vocab, new_token, nullptr, 0, 0, true);
                if (n > 0) {
                    piece.resize(n);
                    llama_token_to_piece(vocab, new_token, piece.data(), n, 0, true);
                    if (on_token(piece.c_str(), user) != 0) cancelled = true;
                }
            }
            if (cancelled || is_eog) break;
            if (n_generated >= max_new) break;

            batch = llama_batch_get_one(&new_token, 1);
        }

        if (out_tokens) *out_tokens = n_generated;
    } catch (const std::exception & e) {
        // Report the error as a final streamed delta so the UI can show it.
        std::string msg = std::string("\n[nexus-engine-error] ") + e.what();
        on_token(msg.c_str(), user);
        rc = -3;
        if (out_tokens) *out_tokens = n_generated;
    }

    eng->busy.store(false);
    return rc;
}
