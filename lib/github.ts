import 'server-only'
import { PLATFORMS, type Arch, type Platform } from './platform'

const API = 'https://api.github.com'
const SAFE_SEGMENT = /^[A-Za-z0-9_.-]{1,100}$/

export function isSafeSegment(value: string | null): value is string {
  return !!value && SAFE_SEGMENT.test(value)
}

type GhAsset = {
  id: number
  name: string
  size: number
  digest?: string | null
  browser_download_url: string
  download_count: number
  updated_at: string
  content_type: string
}

type GhRelease = {
  tag_name: string
  name: string | null
  draft: boolean
  prerelease: boolean
  published_at: string
  html_url: string
  assets: GhAsset[]
}

export type GhRepo = {
  full_name: string
  name: string
  description: string | null
  stargazers_count: number
  created_at: string
  pushed_at: string
  archived: boolean
  fork: boolean
  html_url: string
  license: { spdx_id: string | null } | null
  owner: { login: string; avatar_url: string; type: string }
}

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

async function gh<T>(path: string, revalidate = 3600): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'PikStore',
  }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  const res = await fetch(`${API}${path}`, { headers, next: { revalidate } })
  if (!res.ok) {
    const limited = res.status === 403 || res.status === 429
    throw new GitHubError(
      limited ? 'GitHub rate limit reached. Try again shortly.' : `GitHub responded ${res.status}`,
      limited ? 429 : res.status,
    )
  }
  return res.json() as Promise<T>
}

export function getRepo(owner: string, repo: string) {
  return gh<GhRepo>(`/repos/${owner}/${repo}`)
}

function getReleases(owner: string, repo: string) {
  return gh<GhRelease[]>(`/repos/${owner}/${repo}/releases?per_page=8`)
}

export type ResolvedAsset = {
  id: number
  name: string
  size: number
  sha256: string | null
  url: string
  downloads: number
  version: string
  publishedAt: string
  releaseUrl: string
}

const NOISE = /\.(blockmap|sig|asc|sha256|sha512|md5|txt|ya?ml|json|zsync|zst|sym|pdb)$/i
const CLI = /(^|[-_.])(cli|symbols|debug-symbols|source)([-_.]|$)/i
const NIGHTLY = /(nightly|canary|beta|alpha|preview)/i

function score(name: string, platform: Platform, arch: Arch): number | null {
  const n = name.toLowerCase()
  if (NOISE.test(n) || CLI.test(n)) return null

  let s = 0
  if (NIGHTLY.test(n)) s -= 25

  switch (platform) {
    case 'android': {
      if (!n.endsWith('.apk')) return null
      if (/universal/.test(n)) s += 30
      if (/arm64|aarch64|arm64-v8a|arm64v8/.test(n)) s += 20
      if (/x86|x64|armv7|arm32|armeabi|-arm\.apk/.test(n)) s -= 20
      if (/google-play|play-store/.test(n)) s -= 5
      return s
    }
    case 'ios': {
      if (!n.endsWith('.ipa') || /core|framework/.test(n)) return null
      return s
    }
    case 'macos': {
      if (n.endsWith('.dmg')) s += 12
      else if (n.endsWith('.pkg')) s += 6
      else if (n.endsWith('.zip') && /mac|darwin|osx/.test(n)) s += 0
      else return null
      if (/universal/.test(n)) s += 30
      const isArm = /arm64|aarch64|apple|silicon/.test(n)
      const isIntel = /x64|x86_64|intel|amd64/.test(n)
      if (isArm) s += arch === 'arm' ? 20 : -15
      if (isIntel) s += arch === 'x86' ? 20 : -15
      return s
    }
    case 'windows': {
      if (n.endsWith('.exe')) s += 12
      else if (n.endsWith('.msi')) s += 9
      else if (n.endsWith('.msix')) s += 4
      else return null
      if (/setup|installer|install/.test(n)) s += 10
      const isArm = /arm64|aarch64/.test(n)
      if (isArm) s += arch === 'arm' ? 25 : -30
      if (/x64|x86_64|amd64|win64/.test(n)) s += arch === 'x86' ? 12 : -5
      if (/ia32|win32|x86(?!_64)|32bit|-32\./.test(n)) s -= 12
      if (/portable/.test(n)) s -= 6
      if (/unsigned/.test(n)) s -= 10
      return s
    }
  }
}

function pick(releases: GhRelease[], platform: Platform, arch: Arch): ResolvedAsset | null {
  for (const release of releases) {
    if (release.draft || release.prerelease) continue
    let best: { asset: GhAsset; s: number } | null = null
    for (const asset of release.assets) {
      const s = score(asset.name, platform, arch)
      if (s === null) continue
      if (!best || s > best.s) best = { asset, s }
    }
    if (best) {
      const digest = best.asset.digest
      return {
        id: best.asset.id,
        name: best.asset.name,
        size: best.asset.size,
        sha256: digest?.startsWith('sha256:') ? digest.slice(7) : null,
        url: best.asset.browser_download_url,
        downloads: best.asset.download_count,
        version: release.tag_name.replace(/^v(?=\d)/, ''),
        publishedAt: release.published_at,
        releaseUrl: release.html_url,
      }
    }
  }
  return null
}

export async function resolveAsset(owner: string, repo: string, platform: Platform, arch: Arch) {
  const releases = await getReleases(owner, repo)
  return pick(releases, platform, arch)
}

export async function resolveAllPlatforms(owner: string, repo: string) {
  const releases = await getReleases(owner, repo)
  const entries = PLATFORMS.map((p) => [p, pick(releases, p, p === 'macos' || p === 'android' ? 'arm' : 'x86')])
  return Object.fromEntries(entries) as Record<Platform, ResolvedAsset | null>
}

export type SearchHit = {
  full_name: string
  name: string
  description: string | null
  stargazers_count: number
  owner: { login: string; avatar_url: string }
}

export async function searchRepos(query: string) {
  const q = encodeURIComponent(`${query} in:name,description,topics stars:>=150 archived:false fork:false`)
  const data = await gh<{ items: SearchHit[] }>(`/search/repositories?q=${q}&sort=stars&order=desc&per_page=12`, 1800)
  return data.items
}
