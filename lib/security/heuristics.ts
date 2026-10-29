// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
/**
 * Behaviour-independent heuristics applied to release metadata.
 * Each rule returns an explainable finding; nothing is obfuscated.
 */
import { isHighEntropyToken } from './entropy'

export type Finding = { rule: string; severity: 'info' | 'low' | 'medium' | 'high' | 'critical'; detail: string }

export function checkName(name: string): Finding[] {
  const out: Finding[] = []
  const parts = name.split(/[._-]/).filter((p) => p.length >= 16)
  for (const p of parts) {
    if (isHighEntropyToken(p)) out.push({ rule: 'entropy-token', severity: 'medium', detail: `Segment "${p.slice(0, 12)}…" has unusually high entropy.` })
  }
  if (/\.(exe|msi|dmg|pkg|apk)(\.zip|\.rar|\.7z)?$/i.test(name) === false && /\.(zip|rar|7z|tar|gz)$/i.test(name)) {
    out.push({ rule: 'archive-delivery', severity: 'info', detail: 'Delivered as archive; contents cannot be fingerprinted before extraction.' })
  }
  return out
}

export function checkUrl(url: string): Finding[] {
  const out: Finding[] = []
  if (!url.startsWith('https://')) out.push({ rule: 'no-tls', severity: 'high', detail: 'Asset URL is not HTTPS.' })
  if (/^(http:)?\/\/[0-9]{1,3}(\.[0-9]{1,3}){3}/.test(url)) out.push({ rule: 'raw-ip', severity: 'high', detail: 'Raw IP host detected — legitimate publishers use domains.' })
  try {
    const host = new URL(url).hostname
    if (host.split('.').slice(-2).join('.').length < 5) out.push({ rule: 'short-domain', severity: 'low', detail: `Suspiciously short domain: ${host}` })
  } catch {
    out.push({ rule: 'bad-url', severity: 'medium', detail: 'URL failed parsing.' })
  }
  return out
}

export function checkCadence(datesIso: string[]): Finding[] {
  if (datesIso.length < 3) return []
  const gaps: number[] = []
  for (let i = 1; i < datesIso.length; i++) gaps.push(new Date(datesIso[i]).getTime() - new Date(datesIso[i - 1]).getTime())
  const burst = gaps.filter((g) => g < 60_000).length
  return burst >= 2 ? [{ rule: 'release-burst', severity: 'low', detail: `${burst} releases within one minute — automated re-publishing.` }] : []
}
