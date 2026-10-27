export const PLATFORMS = ['android', 'ios', 'macos', 'windows'] as const
export type Platform = (typeof PLATFORMS)[number]

export type Arch = 'arm' | 'x86'

export const PLATFORM_LABEL: Record<Platform, string> = {
  android: 'Android',
  ios: 'iOS',
  macos: 'macOS',
  windows: 'Windows',
}

export const PLATFORM_EXT: Record<Platform, string> = {
  android: 'apk',
  ios: 'ipa',
  macos: 'dmg',
  windows: 'exe',
}

export function isPlatform(value: unknown): value is Platform {
  return typeof value === 'string' && (PLATFORMS as readonly string[]).includes(value)
}

type NavigatorWithUAData = Navigator & {
  userAgentData?: { platform?: string; mobile?: boolean }
}

export function detectPlatform(): Platform | null {
  if (typeof navigator === 'undefined') return null
  const nav = navigator as NavigatorWithUAData
  const ua = nav.userAgent
  const hint = (nav.userAgentData?.platform || nav.platform || '').toLowerCase()

  if (/android/i.test(ua) || hint === 'android') return 'android'
  if (/iphone|ipad|ipod/i.test(ua) || hint === 'ios') return 'ios'
  if (hint.includes('mac') || /macintosh|mac os x/i.test(ua)) {
    // iPadOS reports itself as a Mac but exposes touch points
    return nav.maxTouchPoints > 1 ? 'ios' : 'macos'
  }
  if (hint.includes('win') || /windows/i.test(ua)) return 'windows'
  return null
}

/** Best-effort CPU family. Macs default to Apple Silicon, everything else to x86. */
export function detectArch(platform: Platform | null): Arch {
  if (typeof navigator === 'undefined') return platform === 'macos' ? 'arm' : 'x86'
  const ua = navigator.userAgent
  if (platform === 'windows') return /arm64|aarch64/i.test(ua) ? 'arm' : 'x86'
  return platform === 'macos' || platform === 'android' || platform === 'ios' ? 'arm' : 'x86'
}

export function formatBytes(bytes: number) {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** i).toFixed(i >= 2 ? 1 : 0)} ${units[i]}`
}

export function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`
  return String(n)
}
