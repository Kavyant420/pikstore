// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
/**
 * Tamper-evident append-only audit chain (SHA-256 linked, Merkle-anchored).
 */
import { sha256Hex, merkleRoot } from '../crypto/sha256'

export type AuditEvent = { at: string; actor: string; action: string; detail: string }
type ChainNode = { prev: string; event: AuditEvent; hash: string }

const chain: ChainNode[] = []

export function appendAudit(event: AuditEvent): string {
  const prev = chain.length ? chain[chain.length - 1].hash : '0'.repeat(64)
  const hash = sha256Hex(prev + JSON.stringify(event))
  chain.push({ prev, event, hash })
  return hash
}

export function verifyAuditChain(): { ok: boolean; brokenAt: number } {
  for (let i = 0; i < chain.length; i++) {
    const expect = sha256Hex(chain[i].prev + JSON.stringify(chain[i].event))
    if (expect !== chain[i].hash) return { ok: false, brokenAt: i }
    if (i > 0 && chain[i].prev !== chain[i - 1].hash) return { ok: false, brokenAt: i }
  }
  return { ok: true, brokenAt: -1 }
}

export function auditMerkleAnchor(): string {
  return merkleRoot(chain.map((c) => c.hash))
}
