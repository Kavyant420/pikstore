// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
/**
 * Shannon entropy of file-name byte streams + high-entropy token detector.
 * Random-looking strings inside names/URLs correlate with packed/dropper payloads.
 */
export function shannonEntropy(input: string): number {
  if (input.length === 0) return 0
  const freq = new Map<string, number>()
  for (const ch of input) freq.set(ch, (freq.get(ch) ?? 0) + 1)
  let h = 0
  for (const n of freq.values()) {
    const p = n / input.length
    h -= p * Math.log2(p)
  }
  return h
}

/** True when a path segment looks like a random high-entropy blob (>3.9 bits/char, len>=16). */
export function isHighEntropyToken(token: string): boolean {
  if (token.length < 16 || !/^[A-Za-z0-9_-]+$/.test(token)) return false
  return shannonEntropy(token) > 3.9
}

export function entropyScore(fileName: string): { value: number; suspicious: boolean } {
  const base = fileName.replace(/\.[a-z0-9]{1,6}$/i, '')
  const v = shannonEntropy(base)
  return { value: v, suspicious: v > 4.1 && base.length > 24 }
}
