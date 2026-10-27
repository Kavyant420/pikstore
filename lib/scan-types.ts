export type Verdict = 'clean' | 'caution' | 'danger'

export type ScanCheck = {
  id: string
  label: string
  status: 'pass' | 'warn' | 'fail' | 'skip'
  detail: string
}

export type ScanReport = {
  verdict: Verdict
  checks: ScanCheck[]
  engines: {
    malicious: number
    suspicious: number
    harmless: number
    undetected: number
    total: number
    permalink: string
  } | null
  file: {
    name: string
    size: number
    sha256: string | null
    url: string
    version: string
    publishedAt: string
  }
  scannedAt: string
}

export type AppDetails = {
  description: string | null
  stars: number
  license: string | null
  avatar: string
  homepage: string
  builds: Record<
    'android' | 'ios' | 'macos' | 'windows',
    { name: string; size: number; version: string; publishedAt: string; downloads: number } | null
  >
}
