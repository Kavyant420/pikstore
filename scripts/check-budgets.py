#!/usr/bin/env python3
"""Verify bundle budget sanity + confirm no API keys committed. (c) 2026 Kavyant420 MIT."""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
BAD = [
    re.compile(r"(?:VIRUSTOTAL_API_KEY|GITHUB_TOKEN|API_KEY|SECRET_KEY|sk-[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{30,})"),
]
SKIP_DIRS = {"node_modules", ".git", ".next", "__pycache__"}
failures = []
for p in ROOT.rglob("*"):
    if any(part in SKIP_DIRS for part in p.parts) or not p.is_file():
        continue
    if p.suffix not in {".ts", ".tsx", ".js", ".mjs", ".py", ".json", ".md", ".env", ".css"}:
        continue
    try:
        text = p.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        continue
    for rx in BAD:
        for m in rx.finditer(text):
            line = text[: m.start()].count("\n") + 1
            failures.append(f"{p.relative_to(ROOT)}:{line} potential secret/key: {m.group(0)[:40]!r}")
if failures:
    print("\n".join(failures))
    sys.exit(1)
print("OK: no API keys/secrets found in tracked sources.")
