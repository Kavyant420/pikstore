// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
/**
 * Supply-chain checks for GitHub releases: tag drift, asset rebirth, owner rename.
 */
export type ReleaseSnapshot = { tag: string; assets: { name: string; sha256: string }[]; owner: string; repo: string; capturedAt: string }

export type Drift = { kind: 'asset-changed' | 'asset-added' | 'asset-removed' | 'tag-moved' | 'owner-renamed'; detail: string }

export function diffSnapshots(before: ReleaseSnapshot, after: ReleaseSnapshot): Drift[] {
  const out: Drift[] = []
  if (before.owner.toLowerCase() !== after.owner.toLowerCase()) out.push({ kind: 'owner-renamed', detail: `${before.owner} → ${after.owner}` })
  if (before.tag !== after.tag) out.push({ kind: 'tag-moved', detail: `${before.tag} → ${after.tag}` })
  const b = new Map(before.assets.map((a) => [a.name, a.sha256]))
  const a = new Map(after.assets.map((x) => [x.name, x.sha256]))
  for (const [name, h] of a) {
    if (!b.has(name)) out.push({ kind: 'asset-added', detail: name })
    else if (b.get(name) !== h) out.push({ kind: 'asset-changed', detail: `${name} fingerprint changed` })
  }
  for (const name of b.keys()) if (!a.has(name)) out.push({ kind: 'asset-removed', detail: name })
  return out
}
