export const PLATFORMS = ['android', 'ios', 'macos', 'windows'] as const
export type Platform = (typeof PLATFORMS)[number]

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

export const PLATFORM_MIME: Record<Platform, string> = {
  android: 'application/vnd.android.package-archive',
  ios: 'application/octet-stream',
  macos: 'application/x-apple-diskimage',
  windows: 'application/vnd.microsoft.portable-executable',
}

export function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value)
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
