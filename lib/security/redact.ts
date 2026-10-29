// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
/**
 * Secret redaction for anything echoed to logs/UI. Prevents accidental
 * exposure of tokens/keys even though this app stores none.
 */
const PATTERNS: [RegExp, string][] = [
  [/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,255}\b/g, '[REDACTED_GITHUB_TOKEN]'],
  [/\bsk-[A-Za-z0-9_-]{16,}\b/g, '[REDACTED_API_KEY]'],
  [/(api[_-]?key|apikey|secret|token|password)\s*[:=]\s*[^&\s"'<]{6,}/gi, '$1=[REDACTED]'],
  [/\bx-apikey:\s*[^\s"']+/gi, 'x-apikey:[REDACTED]'],
  [/(AKIA|ASIA)[0-9A-Z]{16}/g, '[REDACTED_AWS_KEY]'],
]

export function redactSecrets(text: string): string {
  return PATTERNS.reduce((acc, [re, repl]) => acc.replace(re, repl), text)
}

export function containsSecret(text: string): boolean {
  return PATTERNS.some(([re]) => (re.lastIndex = 0, re.test(text)))
}
