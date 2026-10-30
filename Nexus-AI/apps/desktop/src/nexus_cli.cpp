// nexus_cli.cpp — Nexus - By PIK Intelligence (V0.1 test host)
// Minimal streaming REPL proving the embedded engine works fully offline.
// Usage: nexus-cli <model.gguf> [ctx_len]
#include "nexus_engine.h"

#include <cstdio>
#include <cstring>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

static int stream_out(const char * utf8, void *) {
    fputs(utf8, stdout);
    fflush(stdout);
    return 0; // never cancel from here; Ctrl-C kills the process
}

int main(int argc, char ** argv) {
    if (argc < 2) {
        std::fprintf(stderr, "usage: %s <model.gguf> [ctx_len]\n", argv[0]);
        return 2;
    }
    const char * model = argv[1];
    int32_t ctx = argc > 2 ? std::atoi(argv[2]) : 4096;

    char err[512] = {0};
    std::printf("[nexus] loading model (offline, mmap): %s\n", model);
    nexus_engine_t * eng = nexus_engine_create(model, ctx, err, sizeof(err));
    if (!eng) {
        std::fprintf(stderr, "[nexus] DIAGNOSTIC — model failed to load:\n  %s\n", err);
        std::fprintf(stderr, "[nexus] Nexus will NOT download another model. Verify the GGUF file's SHA-256 and re-provision.\n");
        return 1;
    }
    std::printf("[nexus] engine ready. info: %s\n", nexus_engine_info_json(eng));
    std::printf("[nexus] type your message, 'exit' to quit. Streaming Qwen output below.\n\n");

    nexus_gen_params_t gp{192, 0.7f, 0.8f, 42, 0};

    // Conversation history (system + alternating user/assistant).
    std::string hist = "[";
    auto push = [&](const char * role, const std::string & text) {
        // crude JSON escape for the test host only
        std::ostringstream esc;
        for (char c : text) {
            switch (c) { case '"': esc << "\\\""; break;
                         case '\\': esc << "\\\\"; break;
                         case '\n': esc << "\\n"; break;
                         default: esc << c; }
        }
        if (hist.size() > 1) hist += ",";
        hist += "{\"role\":\"";
        hist += role;
        hist += "\",\"content\":\"";
        hist += esc.str();
        hist += "\"}";
    };
    push("system", "You are Nexus, a private offline AI assistant by PIK Intelligence. Be helpful and concise.");

    std::string line, all;
    while (true) {
        std::printf("you> ");
        if (!std::getline(std::cin, line)) break;
        if (line == "exit" || line == "quit") break;
        if (line.empty()) continue;
        push("user", line);
        hist += "]";
        std::printf("nexus> ");
        int32_t ntok = 0;
        int rc = nexus_engine_chat(eng, hist.c_str(), &gp, stream_out, nullptr, &ntok);
        std::printf("\n[nexus] rc=%d tokens=%d\n\n", rc, ntok);
        // reopen array for next turn; record assistant reply is omitted in this
        // minimal host (single-turn memory kept via re-sending last user msg).
        hist.resize(hist.size() - 1); // drop trailing ']'
        hist += ",{\"role\":\"assistant\",\"content\":\"(previous reply omitted in cli host)\"}]";
        (void) all;
    }
    nexus_engine_destroy(eng);
    std::printf("\n[nexus] engine unloaded cleanly.\n");
    return 0;
}
