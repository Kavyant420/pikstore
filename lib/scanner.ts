// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
import 'server-only'
import type { GhRepo, ResolvedAsset } from './github'
import type { Platform } from './platform'
import type { ScanCheck, ScanReport, Verdict } from './scan-types'
import { runScanV2 } from './security/scanner-v2'

/**
 * Server scan pipeline. Fully keyless by design:
 *  - SHA-256 fingerprints published by GitHub (integrity),
 *  - deterministic local heuristics + curated signature DB,
 *  - advisory classification via Pollinations text API (free, no API key).
 */
export async function scanAsset(repo: GhRepo, asset: ResolvedAsset, platform: Platform): Promise<ScanReport> {
  const checks: ScanCheck[] = []

  checks.push(
    asset.sha256
      ? { id: 'integrity', label: 'Integrity', status: 'pass', detail: 'SHA-256 fingerprint published by GitHub for this exact file.' }
      : { id: 'integrity', label: 'Integrity', status: 'warn', detail: 'The publisher did not provide a SHA-256 fingerprint, so the file cannot be fingerprinted.' },
  )

  // Keyless AI + rules engine (Pollinations — no API key required).
  let aiSummary = ''
  try {
    const outcome = await runScanV2({ name: asset.name, url: asset.url, sha256: asset.sha256 ?? undefined, size: asset.size })
    aiSummary = outcome.aiSummary
    const risky = outcome.findings.some((f) => f.severity === 'high' || f.severity === 'critical')
    checks.push({
      id: 'ai-rules',
      label: 'AI + rule engine',
      status: risky ? 'fail' : outcome.risk > 20 ? 'warn' : 'pass',
      detail: aiSummary || `${outcome.findings.length} rule findings, risk ${outcome.risk}/100.`,
    })
  } catch {
    checks.push({ id: 'ai-rules', label: 'AI + rule engine', status: 'skip', detail: 'Keyless AI analyst was unreachable; local checks still applied.' })
  }

  const lower = asset.name.toLowerCase()
  const doubleExt = /\.(pdf|docx?|xlsx?|jpe?g|png|txt|mp[34])\.(exe|msi|apk|dmg|pkg|scr|bat)$/i.test(lower)
  const dangerousExt = /\.(scr|bat|cmd|vbs|js|jar|ps1)$/i.test(lower)
  const tooSmall = asset.size < 150 * 1024
  checks.push({
    id: 'file',
    label: 'File structure',
    status: doubleExt || dangerousExt ? 'fail' : tooSmall ? 'warn' : 'pass',
    detail: doubleExt
      ? 'Disguised double extension detected — a common malware trick.'
      : dangerousExt
        ? 'Script-type executable, which is not a normal installer format.'
        : tooSmall
          ? 'Unusually small for an installer. It may be a downloader stub.'
          : `Expected installer format for ${platform === 'macos' ? 'macOS' : platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'Windows'}.`,
  })

  const DAY = 86_400_000
  const ageDays = (Date.now() - new Date(repo.created_at).getTime()) / DAY
  const lowTrust = repo.stargazers_count < 50 && ageDays < 60
  checks.push({
    id: 'publisher',
    label: 'Publisher reputation',
    status: repo.archived || lowTrust ? 'warn' : 'pass',
    detail: repo.archived
      ? 'This project is archived and no longer maintained.'
      : lowTrust
        ? 'A new project with very few stars. Its reputation has not been established yet.'
        : `${repo.full_name} · ${repo.stargazers_count.toLocaleString('en-US')} stars · active since ${new Date(repo.created_at).getFullYear()}.`,
  })

  if (/unsigned/.test(lower)) {
    checks.push({ id: 'signature', label: 'Code signature', status: 'warn', detail: 'The publisher marks this build as unsigned. Your OS may show a security prompt.' })
  }

  const verdict: Verdict = checks.some((c) => c.status === 'fail') ? 'danger' : checks.some((c) => c.status === 'warn') ? 'caution' : 'clean'

  return {
    verdict,
    checks,
    engines: null,
    file: { name: asset.name, size: asset.size, sha256: asset.sha256, url: asset.url, version: asset.version, publishedAt: asset.publishedAt },
    scannedAt: new Date().toISOString(),
  }
}
