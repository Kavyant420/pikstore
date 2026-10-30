// nexus_android_engine.cpp — Nexus Assistant Android engine core
// Bridges the app's Rust/JNI shell to a statically-linked llama.cpp runtime.
// All inference is 100% on-device: model files live in app-private storage,
// there is no network code path in this file. - By PIK Intelligence
#include "llama.h"
#include "ggml-backend.h"

#include <android/log.h>
#include <jni.h>

#include <atomic>
#include <ctime>
#include <mutex>
#include <string>
#include <thread>
#include <vector>

#define TAG "NexusEngine"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO,  TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

namespace {

struct Engine {
    JavaVM *   jvm      = nullptr;
    jobject    cb       = nullptr;      // global ref -> Kotlin callback
    jmethodID  midTok   = nullptr;
    jmethodID  midDone  = nullptr;
    jmethodID  midErr   = nullptr;

    llama_model *          model  = nullptr;
    llama_context *        lctx   = nullptr;
    const llama_vocab *    vocab  = nullptr;
    std::vector<llama_token> prompt;    // persistent KV prefix (system)
    std::mutex             mu;
    std::atomic<bool>      busy{false};
    std::atomic<bool>      cancel{false};
};

Engine * g_eng = nullptr;
std::mutex g_eng_mu;

// ---- minimal JSON reader for [{"role":..,"content":..}, ...] --------------
// The UI shell guarantees well-formed input (it produces the JSON itself),
// so we only need string-safe scanning with escape handling.
struct Msg { std::string role, content; };

static bool json_next_string(const std::string & s, size_t & i, std::string & out) {
    out.clear();
    while (i < s.size() && s[i] != '"') ++i;
    if (i >= s.size()) return false;
    ++i; // opening quote
    while (i < s.size()) {
        char c = s[i++];
        if (c == '"') return true;
        if (c == '\\' && i < s.size()) {
            char e = s[i++];
            switch (e) {
                case 'n': out += '\n'; break;
                case 't': out += '\t'; break;
                case 'r': out += '\r'; break;
                case '"': out += '"';  break;
                case '\\':out += '\\'; break;
                case '/': out += '/';  break;
                case 'u': { // decode \uXXXX (BMP only, surrogate pairs joined)
                    auto hex4 = [&](unsigned & v) -> bool {
                        v = 0;
                        if (i + 4 > s.size()) return false;
                        for (int k = 0; k < 4; ++k) {
                            char h = s[i++]; v <<= 4;
                            if (h >= '0' && h <= '9') v |= h - '0';
                            else if (h >= 'a' && h <= 'f') v |= h - 'a' + 10;
                            else if (h >= 'A' && h <= 'F') v |= h - 'A' + 10;
                            else return false;
                        }
                        return true;
                    };
                    unsigned cp = 0;
                    if (!hex4(cp)) { out += '?'; break; }
                    if (cp >= 0xD800 && cp <= 0xDBFF) { // high surrogate
                        unsigned lo = 0;
                        if (i + 6 <= s.size() && s[i] == '\\' && s[i+1] == 'u' && hex4(lo) &&
                            lo >= 0xDC00 && lo <= 0xDFFF) {
                            cp = 0x10000 + ((cp - 0xD800) << 10) + (lo - 0xDC00);
                        }
                    }
                    if (cp < 0x80) out += (char)cp;
                    else if (cp < 0x800) { out += (char)(0xC0|cp>>6); out += (char)(0x80|cp&0x3F); }
                    else if (cp < 0x10000) { out += (char)(0xE0|cp>>12); out += (char)(0x80|(cp>>6)&0x3F); out += (char)(0x80|cp&0x3F); }
                    else { out += (char)(0xF0|cp>>18); out += (char)(0x80|(cp>>12)&0x3F); out += (char)(0x80|(cp>>6)&0x3F); out += (char)(0x80|cp&0x3F); }
                    break;
                }
                default: out += e;
            }
        } else out += c;
    }
    return false;
}

static std::vector<Msg> parse_messages(const char * json) {
    std::vector<Msg> msgs;
    std::string s(json ? json : "");
    size_t i = 0;
    while (i < s.size()) {
        size_t rp = s.find("\"role\"", i);
        if (rp == std::string::npos) break;
        i = rp + 6;
        Msg m;
        std::string val;
        if (!json_next_string(s, i, val)) break;   // colon then value
        m.role = val;
        size_t cp = s.find("\"content\"", i);
        if (cp == std::string::npos) break;
        i = cp + 9;
        if (!json_next_string(s, i, val)) break;
        m.content = val;
        msgs.push_back(std::move(m));
    }
    return msgs;
}

// ---- token streaming callback into Kotlin ----------------------------------
int on_token(const char * utf8, void * user) {
    Engine * e = (Engine *)user;
    if (e->cancel.load()) return 1; // request cancellation
    JNIEnv * env = nullptr;
    bool attached = false;
    int rc = e->jvm->GetEnv((void **)&env, JNI_VERSION_1_6);
    if (rc == JNI_EDETACHED) {
        if (e->jvm->AttachCurrentThread(&env, nullptr) != JNI_OK) return 1;
        attached = true;
    } else if (rc != JNI_OK) return 1;
    if (env && e->cb && e->midTok) {
        jstring js = env->NewStringUTF(utf8);
        env->CallVoidMethod(e->cb, e->midTok, js);
        if (env->ExceptionCheck()) env->ExceptionClear();
        env->DeleteLocalRef(js);
    }
    if (attached) e->jvm->DetachCurrentThread();
    return 0;
}

static void notify_done(const std::string & text) {
    Engine * e = g_eng;
    if (!e || !e->jvm || !e->cb || !e->midDone) return;
    JNIEnv * env = nullptr;
    bool attached = false;
    int rc = e->jvm->GetEnv((void **)&env, JNI_VERSION_1_6);
    if (rc == JNI_EDETACHED) {
        if (e->jvm->AttachCurrentThread(&env, nullptr) != JNI_OK) return;
        attached = true;
    } else if (rc != JNI_OK) return;
    jstring js = env->NewStringUTF(text.c_str());
    env->CallVoidMethod(e->cb, e->midDone, js);
    if (env->ExceptionCheck()) env->ExceptionClear();
    env->DeleteLocalRef(js);
    if (attached) e->jvm->DetachCurrentThread();
}

// ---- core generation --------------------------------------------------------
static void run_chat(const std::vector<Msg> & msgs, int max_tokens, float temp, float top_p, int seed) {
    Engine * e = g_eng;
    std::string full;
    std::string err;
    do {
        std::lock_guard<std::mutex> lk(e->mu);
        if (!e->model || !e->lctx) { err = "engine not loaded"; break; }

        // Apply the model's own chat template (Qwen3 ChatML built into GGUF).
        std::string tmpl = llama_model_chat_template(e->model, nullptr);
        if (tmpl.empty()) { err = "no chat template in model"; break; }
        std::string prompt_str;
        {
            size_t n = msgs.size() > 64 ? 64 : msgs.size();
            std::vector<llama_chat_message> cm(n);
            for (size_t k = 0; k < n; ++k) {
                cm[k].role    = msgs[k].role.c_str();
                cm[k].content = msgs[k].content.c_str();
            }
            int32_t need = llama_chat_apply_template(tmpl.c_str(), cm.data(), n, true, nullptr, 0);
            if (need <= 0) { err = "template size query failed"; break; }
            std::vector<char> buf(need + 8, 0);
            int32_t got = llama_chat_apply_template(tmpl.c_str(), cm.data(), n, true, buf.data(), (int32_t)buf.size());
            if (got < 0 || got > (int32_t)buf.size()) { err = "template apply failed"; break; }
            prompt_str.assign(buf.data(), got);
        }

        std::vector<llama_token> toks(llama_n_ctx(e->lctx));
        int nt = llama_tokenize(e->vocab, prompt_str.c_str(), (int32_t)prompt_str.size(),
                                toks.data(), (int32_t)toks.size(), /*add_bos*/ true, /*parse_special*/ true);
        if (nt < 0) { err = "tokenize failed"; break; }
        toks.resize(nt);

        // Trim common prefix with cached prompt to avoid re-decoding the system turn.
        size_t p = 0;
        while (p < e->prompt.size() && p < toks.size() && e->prompt[p] == toks[p]) ++p;
        llama_kv_self_seq_rm(e->lctx, 0, (llama_pos)p, -1);

        llama_pos pos_cur = (llama_pos)p;
        for (size_t k = p; k < toks.size();) {
            if (e->cancel.load()) { err = "cancelled"; goto finish_no_notify; }
            int chunk = (int)std::min<size_t>(64, toks.size() - k);
            llama_batch batch = llama_batch_get_one(&toks[k], chunk);
            for (int32_t j = 0; j < batch.n_tokens; ++j) batch.pos[j] = pos_cur++;
            if (llama_decode(e->lctx, batch) != 0) { err = "decode failed"; goto finish_no_notify; }
            k += chunk;
        }
        e->prompt = toks; // cache for next turn

        {
            uint32_t sg = seed > 0 ? (uint32_t)seed : (uint32_t)(time(nullptr) ^ (uintptr_t)&pos_cur);
            llama_sampler * smpl = llama_sampler_chain_init(llama_sampler_chain_default_params());
            llama_sampler_chain_add(smpl, llama_sampler_init_temp(temp));
            llama_sampler_chain_add(smpl, llama_sampler_init_top_p(top_p, 1));
            llama_sampler_chain_add(smpl, llama_sampler_init_dist(sg));

            int produced = 0;
            while (produced < max_tokens && !e->cancel.load()) {
                llama_token id = llama_sampler_sample(smpl, e->lctx, -1);
                llama_sampler_accept(smpl, id);
                if (llama_vocab_is_eog(e->vocab, id)) break;
                char piece[256];
                int n = llama_token_to_piece(e->vocab, id, piece, sizeof(piece), 0, true);
                if (n > 0) {
                    piece[n] = 0;
                    full.append(piece, n);
                    on_token(piece, e);
                }
                llama_token next = id;
                llama_batch one = llama_batch_get_one(&next, 1);
                one.pos[0] = pos_cur++;
                if (llama_decode(e->lctx, one) != 0) { err = "decode failed mid-gen"; break; }
                ++produced;
            }
            llama_sampler_free(smpl);
        }
        e->cancel.store(false);
    } while (false);
finish_no_notify:
    if (!err.empty()) LOGE("%s", err.c_str());
    notify_done(full);
    g_eng->busy.store(false);
}

} // anonymous namespace

// ============================ JNI surface ====================================
extern "C" {

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM * vm, void *) {
    g_eng = new Engine();
    g_eng->jvm = vm;
    LOGI("Nexus engine library loaded");
    return JNI_VERSION_1_6;
}

JNIEXPORT jboolean JNICALL
Java_app_pik_nexus_NativeEngine_loadModel(JNIEnv * env, jclass, jstring path_, jint ctxLen) {
    const char * path = env->GetStringUTFChars(path_, nullptr);
    std::lock_guard<std::mutex> lk(g_eng->mu);
    if (g_eng->model) { llama_free(g_eng->lctx); llama_model_free(g_eng->model); g_eng->model=nullptr; g_eng->lctx=nullptr; }
    llama_model_params mp = llama_model_default_params();
    mp.use_mmap = true;
    mp.n_gpu_layers = 0; // CPU only
    g_eng->model = llama_model_load_from_file(path, mp);
    env->ReleaseStringUTFChars(path_, path);
    if (!g_eng->model) { LOGE("model load failed"); return JNI_FALSE; }
    llama_context_params cp = llama_context_default_params();
    cp.n_ctx     = ctxLen > 0 ? (uint32_t)ctxLen : 4096;
    cp.n_batch   = 256;
    cp.n_ubatch  = 256;
    cp.n_threads = cp.n_threads_batch = std::thread::hardware_concurrency() ?: 4;
    g_eng->lctx = llama_init_from_model(g_eng->model, cp);
    if (!g_eng->lctx) { llama_model_free(g_eng->model); g_eng->model=nullptr; LOGE("ctx init failed"); return JNI_FALSE; }
    g_eng->vocab = llama_model_get_vocab(g_eng->model);
    g_eng->prompt.clear();
    LOGI("model ready, ctx=%u", cp.n_ctx);
    return JNI_TRUE;
}

JNIEXPORT void JNICALL
Java_app_pik_nexus_NativeEngine_setCallback(JNIEnv * env, jclass, jobject cb) {
    if (g_eng->cb) env->DeleteGlobalRef(g_eng->cb);
    g_eng->cb = cb ? env->NewGlobalRef(cb) : nullptr;
    if (g_eng->cb) {
        jclass cls = env->GetObjectClass(g_eng->cb);
        g_eng->midTok  = env->GetMethodID(cls, "onToken", "(Ljava/lang/String;)V");
        g_eng->midDone = env->GetMethodID(cls, "onDone",  "(Ljava/lang/String;)V");
        g_eng->midErr  = env->GetMethodID(cls, "onError", "(Ljava/lang/String;)V");
        env->DeleteLocalRef(cls);
    }
}

JNIEXPORT jboolean JNICALL
Java_app_pik_nexus_NativeEngine_isBusy(JNIEnv *, jclass) {
    return g_eng && g_eng->busy.load() ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT void JNICALL
Java_app_pik_nexus_NativeEngine_cancel(JNIEnv *, jclass) {
    if (g_eng) g_eng->cancel.store(true);
}

// messages_json: [{"role":"system|user|assistant","content":"..."}]
JNIEXPORT void JNICALL
Java_app_pik_nexus_NativeEngine_chatAsync(JNIEnv * env, jclass, jstring json_, jlong maxTok, jdouble temp, jdouble topP, jlong seed) {
    if (!g_eng || g_eng->busy.exchange(true)) return;
    const char * js = env->GetStringUTFChars(json_, nullptr);
    std::vector<Msg> msgs = parse_messages(js);
    env->ReleaseStringUTFChars(json_, js);
    int mt = (int)maxTok; float t = (float)temp, p = (float)topP; int sd = (int)seed;
    std::thread([msgs = std::move(msgs), mt, t, p, sd]() { run_chat(msgs, mt, t, p, sd); }).detach();
}

JNIEXPORT jstring JNICALL
Java_app_pik_nexus_NativeEngine_modelInfo(JNIEnv * env, jclass) {
    std::lock_guard<std::mutex> lk(g_eng->mu);
    if (!g_eng || !g_eng->model) return env->NewStringUTF("");
    std::string s;
    char buf[512] = {0};
    llama_model_meta_val_str(g_eng->model, "general.name", buf, sizeof(buf));
    s += std::string("name=") + buf;
    s += "|params=" + std::to_string(llama_model_n_params(g_eng->model));
    s += "|ctx=" + std::to_string(llama_n_ctx(g_eng->lctx ? g_eng->lctx : nullptr));
    return env->NewStringUTF(s.c_str());
}

} // extern "C"
