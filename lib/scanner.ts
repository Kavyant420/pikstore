import 'server-only'
import type { GhRepo, ResolvedAsset } from './github'
import type { Platform } from './platform'
import type { ScanCheck, ScanReport, Verdict } from './scan-types'

type EngineStats = { malicious: number; suspicious: number; harmless: number; undetected: number }

async function lookupVirusTotal(sha256: string): Promise<
  { status: 'found'; stats: EngineStats; permalink: string } | { status: 'unknown' } | { status: 'unavailable' }
> {
  const key = process.env.VIRUSTOTAL_API_KEY
  if (!key) return { status: 'unavailable' }
  try {
    const res = await fetch(`https://www.virustotal.com/api/v3/files/${sha256}`, {
      headers: { 'x-apikey': key },
      next: { revalidate: 21600 },
    })
    if (res.status === 404) return { status: 'unknown' }
    if (!res.ok) return { status: 'unavailable' }
    const json = await res.json()
    const stats = json?.data?.attributes?.last_analysis_stats as EngineStats | undefined
    if (!stats) return { status: 'unknown' }
    return { status: 'found', stats, permalink: `https://www.virustotal.com/gui/file/${sha256}` }
  } catch {
    return { status: 'unavailable' }
  }
}

const DAY = 86_400_000

export async function scanAsset(repo: GhRepo, asset: ResolvedAsset, platform: Platform): Promise<ScanReport> {
  const checks: ScanCheck[] = []
  const lower = asset.name.toLowerCase()

  checks.push(
    asset.sha256
      ? {
          id: 'integrity',
          label: 'Integrity',
          status: 'pass',
          detail: 'SHA-256 fingerprint published by GitHub for this exact file.',
        }
      : {
          id: 'integrity',
          label: 'Integrity',
          status: 'warn',
          detail: 'The publisher did not provide a SHA-256 fingerprint, so the file cannot be fingerprinted.',
        },
  )

  let engines: ScanReport['engines'] = null
  if (asset.sha256) {
    const vt = await lookupVirusTotal(asset.sha256)
    if (vt.status === 'found') {
      const total = vt.stats.malicious + vt.stats.suspicious + vt.stats.harmless + vt.stats.undetected
      engines = { ...vt.stats, total, permalink: vt.permalink }
      const flagged = vt.stats.malicious
      checks.push({
        id: 'engines',
        label: 'Antivirus engines',
        status: flagged >= 3 ? 'fail' : flagged > 0 || vt.stats.suspicious >= 2 ? 'warn' : 'pass',
        detail:
          flagged === 0 && vt.stats.suspicious === 0
            ? `0 of ${total} engines flagged this file.`
            : `${flagged} malicious and ${vt.stats.suspicious} suspicious detections across ${total} engines.`,
      })
    } else if (vt.status === 'unknown') {
      checks.push({
        id: 'engines',
        label: 'Antivirus engines',
        status: 'warn',
        detail: 'This exact file has not been analyzed by VirusTotal yet.',
      })
    } else {
      checks.push({
        id: 'engines',
        label: 'Antivirus engines',
        status: 'skip',
        detail: 'Multi-engine scanning is not configured. Add a VirusTotal API key to enable it.',
      })
    }
  }

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
    checks.push({
      id: 'signature',
      label: 'Code signature',
      status: 'warn',
      detail: 'The publisher marks this build as unsigned. Your OS may show a security prompt.',
    })
  }

  const verdict: Verdict = checks.some((c) => c.status === 'fail')
    ? 'danger'
    : checks.some((c) => c.status === 'warn')
      ? 'caution'
      : 'clean'

  return {
    verdict,
    checks,
    engines,
    file: {
      name: asset.name,
      size: asset.size,
      sha256: asset.sha256,
      url: asset.url,
      version: asset.version,
      publishedAt: asset.publishedAt,
    },
    scannedAt: new Date().toISOString(),
  }
}
