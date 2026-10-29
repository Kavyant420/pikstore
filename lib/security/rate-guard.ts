// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
/**
 * In-memory sliding-window limiter for scan endpoints (single-instance best effort).
 */
const WINDOW_MS = 60_000
const MAX_HITS = 30
const buckets = new Map<string, number[]>()

export function allowRequest(key: string, now = Date.now()): { ok: boolean; retryAfterMs: number } {
  const cutoff = now - WINDOW_MS
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff)
  if (hits.length >= MAX_HITS) {
    buckets.set(key, hits)
    return { ok: false, retryAfterMs: hits[0] + WINDOW_MS - now }
  }
  hits.push(now)
  buckets.set(key, hits)
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v[v.length - 1] < cutoff) buckets.delete(k)
  }
  return { ok: true, retryAfterMs: 0 }
}
