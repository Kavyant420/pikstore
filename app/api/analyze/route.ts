// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
import 'server-only'

/**
 * POST /api/analyze — keyless AI-assisted metadata verdict.
 * Accepts { name, url, sha256?, size }. No secrets, no uploads, rate limited.
 */
import { NextResponse } from 'next/server'
import { allowRequest } from '../../../lib/security/rate-guard'
import { runScanV2 } from '../../../lib/security/scanner-v2'
import { redactSecrets } from '../../../lib/security/redact'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon'
  const rl = allowRequest(`analyze:${ip}`)
  if (!rl.ok) return NextResponse.json({ error: 'rate_limited', retryAfterMs: rl.retryAfterMs }, { status: 429 })
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const b = body as Record<string, unknown>
  const name = typeof b.name === 'string' ? redactSecrets(b.name).slice(0, 200) : ''
  const url = typeof b.url === 'string' ? b.url.slice(0, 500) : ''
  if (!name || !url) return NextResponse.json({ error: 'name_and_url_required' }, { status: 422 })
  const outcome = await runScanV2({
    name,
    url,
    sha256: typeof b.sha256 === 'string' && /^[0-9a-f]{64}$/i.test(b.sha256) ? b.sha256 : undefined,
    size: Number(b.size) || 0,
  })
  return NextResponse.json(outcome, { headers: { 'Cache-Control': 'no-store' } })
}
