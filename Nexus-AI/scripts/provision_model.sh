#!/usr/bin/env bash
# provision_model.sh — Nexus - By PIK Intelligence (V0.1)
#
# One-time, build-machine-only provisioning of the Qwen3-0.6B GGUF used by
# Nexus. The end-user app NEVER downloads models at runtime; it ships/installs
# this file and verifies integrity before loading (see nexus_engine.cpp).
#
# Usage:   MODELS_DIR=/path/to/models bash scripts/provision_model.sh [quant]
# quant  : Q4_K_M (default, recommended), IQ2_XXS (low-RAM dev smoke test),
#          or any file name listed in the upstream repo.
#
# Integrity: every artifact is checked against a pinned SHA-256 pulled from
# the HuggingFace LFS metadata (authoritative OID == sha256).
set -euo pipefail

REPO="unsloth/Qwen3-0.6B-GGUF"
QUANT="${1:-Q4_K_M}"
# Unsloth "UD" (Dynamic) quants are stored with a UD- prefix in the repo.
case "$QUANT" in
    IQ*) FILENAME="Qwen3-0.6B-UD-${QUANT}.gguf" ;;
    *)   FILENAME="Qwen3-0.6B-${QUANT}.gguf" ;;
esac
MODELS_DIR="${MODELS_DIR:-$(cd "$(dirname "$0")/.." && pwd)/models}"
URL="https://huggingface.co/${REPO}/resolve/main/${FILENAME}"

mkdir -p "$MODELS_DIR"
DEST="$MODELS_DIR/$FILENAME"

if [[ -f "$DEST" ]]; then
    echo "[provision] already present: $DEST"
else
    echo "[provision] downloading $FILENAME (one-time, build machine only)..."
    curl -L --fail --retry 3 --progress-bar -o "$DEST.part" "$URL"
    mv "$DEST.part" "$DEST"
fi

# --- SHA-256 verification -----------------------------------------------------
EXPECTED="$(curl -s --max-time 30 \
    "https://huggingface.co/api/models/${REPO}/tree/main" \
    | python3 -c "
import json, sys
name = '$FILENAME'
for f in json.load(sys.stdin):
    if f['path'] == name:
        print(f.get('lfs', {}).get('oid', ''))
        break
" || true)"

if [[ -z "$EXPECTED" ]]; then
    echo "[provision] ERROR: could not resolve pinned SHA-256 for $FILENAME" >&2
    exit 1
fi

echo "[provision] verifying SHA-256 ($EXPECTED)..."
ACTUAL="$(sha256sum "$DEST" | awk '{print $1}')"
if [[ "$ACTUAL" != "$EXPECTED" ]]; then
    echo "[provision] INTEGRITY FAILURE: expected $EXPECTED got $ACTUAL" >&2
    echo "[provision] removing corrupt artifact; Nexus will refuse to load it." >&2
    rm -f "$DEST"
    exit 1
fi

# Write a sidecar manifest the installer / PikStore popup can display.
SIZE_BYTES="$(stat -c%s "$DEST" 2>/dev/null || stat -f%z "$DEST")"
cat > "$DEST.sha256" <<MANIFEST
{
  "file": "$FILENAME",
  "sha256": "$ACTUAL",
  "bytes": $SIZE_BYTES,
  "repo": "$REPO",
  "source_url": "$URL",
  "provisioned_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
MANIFEST

echo "[provision] OK: $DEST ($SIZE_BYTES bytes, sha256 verified)"
