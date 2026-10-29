// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
/**
 * Scanner pipeline v2 — composes local heuristics + free keyless AI analysis.
 * NO API KEYS REQUIRED: uses Pollinations text endpoint (open, anonymous).
 */
import { SIGNATURES } from './signature-db'
import { checkName, checkUrl, checkCadence, type Finding } from './heuristics'
import { pollinateVerdict } from './ai-pollinations'
import { sha256Hex } from '../crypto/sha256'

export type ScanInput = { name: string; url: string; sha256?: string; size: number; publishedDates?: string[] }
export type ScanOutcome = { findings: Finding[]; aiSummary: string; risk: number; fingerprint: string }

export async function runScanV2(input: ScanInput): Promise<ScanOutcome> {
  const findings: Finding[] = [...checkName(input.name), ...checkUrl(input.url), ...checkCadence(input.publishedDates ?? [])]
  for (const sig of SIGNATURES) {
    if (sig.pattern instanceof RegExp && sig.pattern.test(input.name)) {
      findings.push({ rule: sig.id, severity: sig.severity, detail: `${sig.family} — ${sig.reference}` })
    }
  }
  if (input.size < 150 * 1024 && /\.(exe|msi)$/i.test(input.name)) {
    findings.push({ rule: 'tiny-installer', severity: 'medium', detail: 'Executable installer under 150 KB — possible downloader stub.' })
  }
  const ai = await pollinateVerdict({ name: input.name, url: input.url, sha256: input.sha256 ?? null, size: input.size, findings: findings.map((f) => f.rule) })
  const sevWeight = { info: 0, low: 5, medium: 20, high: 45, critical: 80 } as const
  const risk = Math.min(100, findings.reduce((acc, f) => acc + sevWeight[f.severity as keyof typeof sevWeight], 0) + ai.riskBoost)
  return { findings, aiSummary: ai.summary, risk, fingerprint: input.sha256 ?? sha256Hex(input.url + input.name) }
}
