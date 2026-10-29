// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
/**
 * Release manifest integrity: maps asset name -> expected SHA-256 and
 * computes a Merkle root so UI can display a single anchor fingerprint.
 */
import { merkleRoot, sha256Hex, timingSafeEqualHex } from '../crypto/sha256'

export type ManifestEntry = { name: string; sha256: string; size: number }

export function manifestDigest(entries: readonly ManifestEntry[]): string {
  return merkleRoot([...entries].sort((a, b) => a.name.localeCompare(b.name)).map((e) => sha256Hex(`${e.name}|${e.sha256}|${e.size}`)))
}

export function matchFingerprint(expected: string, actual: string): boolean {
  return timingSafeEqualHex(expected, actual)
}
