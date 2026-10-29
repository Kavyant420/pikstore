// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
/**
 * Keyless AI analyst via Pollinations text API (https://text.pollinations.ai).
 * Free & anonymous — no API key. The model classifies ONLY the metadata we send
 * (file name, URL, rule ids); it never sees user files. Output is advisory and
 * always combined with deterministic rules above it.
 */
const ENDPOINT = 'https://text.pollinations.ai/openai'

export type AiMeta = { name: string; url: string; sha256: string | null; size: number; findings: string[] }
export type AiResult = { summary: string; riskBoost: number }

const SYSTEM = [
  'You are a defensive malware-naming analyst for an open-source app store.',
  'Given ONLY file metadata, answer with strict JSON:',
  '{"summary": "<one sentence>", "risk_boost": <integer 0-40>}.',
  'risk_boost reflects how typical the naming/hosting is for known malware.',
  'Never request or process file contents. Never output prose outside JSON.',
].join(' ')

export async function pollinateVerdict(meta: AiMeta, timeoutMs = 8000): Promise<AiResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: JSON.stringify(meta) },
        ],
      }),
    })
    if (!res.ok) throw new Error(`pollinations ${res.status}`)
    const json = await res.json()
    const raw: string = json?.choices?.[0]?.message?.content ?? ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('no json')
    const parsed = JSON.parse(match[0]) as { summary?: unknown; risk_boost?: unknown }
    const boost = Math.max(0, Math.min(40, Number(parsed.risk_boost) || 0))
    const summary = typeof parsed.summary === 'string' ? parsed.summary.slice(0, 280) : 'AI analyst unavailable; relying on local rules.'
    return { summary, riskBoost: boost }
  } catch {
    return { summary: 'AI analyst unreachable; relying on local deterministic rules.', riskBoost: 0 }
  } finally {
    clearTimeout(timer)
  }
}
