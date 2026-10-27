import type { Platform } from './platform'

export type AppBuild = {
  version: string
  size: string
  minOS: string
  /** Set to a real installer URL to serve it; otherwise a placeholder file is generated. */
  url?: string
}

export const CATEGORIES = [
  'All',
  'Photo & Video',
  'Productivity',
  'Music',
  'Health & Fitness',
  'Design',
  'Utilities',
  'Weather',
  'Developer Tools',
] as const

export type Category = Exclude<(typeof CATEGORIES)[number], 'All'>

export type StoreApp = {
  slug: string
  name: string
  developer: string
  tagline: string
  description: string
  category: Category
  icon: string
  banner?: string
  rating: number
  ratingCount: string
  downloads: string
  age: string
  builds: Partial<Record<Platform, AppBuild>>
}

export const APPS: StoreApp[] = [
  {
    slug: 'lumen',
    name: 'Lumen',
    developer: 'Prism Labs',
    tagline: 'Pro photo editing, beautifully simple.',
    description:
      'Lumen brings studio-grade color, light and masking tools to every screen you own. Edits sync instantly between your phone and desktop, and on-device AI keeps your library private.',
    category: 'Photo & Video',
    icon: '/icons/lumen.png',
    banner: '/featured/lumen.png',
    rating: 4.9,
    ratingCount: '182K',
    downloads: '10M+',
    age: '4+',
    builds: {
      android: { version: '6.2.0', size: '84 MB', minOS: 'Android 10' },
      ios: { version: '6.2.0', size: '96 MB', minOS: 'iOS 17' },
      macos: { version: '6.2.0', size: '212 MB', minOS: 'macOS 13' },
      windows: { version: '6.1.4', size: '238 MB', minOS: 'Windows 10' },
    },
  },
  {
    slug: 'tidewave',
    name: 'Tidewave',
    developer: 'Tidewave Audio',
    tagline: 'Lossless music that moves with you.',
    description:
      'Stream 100 million tracks in lossless and spatial audio. Tidewave learns the rhythm of your day and builds mixes that flow from morning focus to late-night sets.',
    category: 'Music',
    icon: '/icons/tidewave.png',
    banner: '/featured/tidewave.png',
    rating: 4.8,
    ratingCount: '1.2M',
    downloads: '100M+',
    age: '12+',
    builds: {
      android: { version: '9.4.1', size: '62 MB', minOS: 'Android 9' },
      ios: { version: '9.4.1', size: '118 MB', minOS: 'iOS 16' },
      macos: { version: '9.4.0', size: '145 MB', minOS: 'macOS 12' },
      windows: { version: '9.4.0', size: '160 MB', minOS: 'Windows 10' },
    },
  },
  {
    slug: 'kiln',
    name: 'Kiln',
    developer: 'Kiln Studio',
    tagline: 'Sculpt in 3D, right from your desk.',
    description:
      'Kiln is a real-time 3D design suite with physically based rendering, parametric modeling and live collaboration. Built for architects, product designers and the endlessly curious.',
    category: 'Design',
    icon: '/icons/kiln.png',
    banner: '/featured/kiln.png',
    rating: 4.7,
    ratingCount: '48K',
    downloads: '1M+',
    age: '4+',
    builds: {
      macos: { version: '3.0.2', size: '640 MB', minOS: 'macOS 14' },
      windows: { version: '3.0.2', size: '702 MB', minOS: 'Windows 11' },
      ios: { version: '2.8.0', size: '310 MB', minOS: 'iPadOS 17' },
    },
  },
  {
    slug: 'driftnote',
    name: 'Driftnote',
    developer: 'Paperplane Co.',
    tagline: 'Notes that think alongside you.',
    description:
      'Capture ideas in text, sketches and voice. Driftnote links related thoughts automatically and surfaces them right when you need them, across every device.',
    category: 'Productivity',
    icon: '/icons/driftnote.png',
    rating: 4.8,
    ratingCount: '96K',
    downloads: '5M+',
    age: '4+',
    builds: {
      android: { version: '4.1.3', size: '38 MB', minOS: 'Android 9' },
      ios: { version: '4.1.3', size: '44 MB', minOS: 'iOS 16' },
      macos: { version: '4.1.2', size: '92 MB', minOS: 'macOS 12' },
      windows: { version: '4.1.2', size: '104 MB', minOS: 'Windows 10' },
    },
  },
  {
    slug: 'pulse',
    name: 'Pulse',
    developer: 'Ringfit Health',
    tagline: 'Close your rings, everywhere.',
    description:
      'Track workouts, heart rate zones and recovery with gorgeous, glanceable rings. Pulse pairs with most wearables and turns your progress into gentle daily goals.',
    category: 'Health & Fitness',
    icon: '/icons/pulse.png',
    rating: 4.6,
    ratingCount: '310K',
    downloads: '50M+',
    age: '4+',
    builds: {
      android: { version: '12.0.5', size: '71 MB', minOS: 'Android 10' },
      ios: { version: '12.0.5', size: '88 MB', minOS: 'iOS 17' },
    },
  },
  {
    slug: 'harbor',
    name: 'Harbor VPN',
    developer: 'Harbor Privacy AG',
    tagline: 'One tap. Total privacy.',
    description:
      'Harbor encrypts your connection with WireGuard and a strict no-logs policy audited annually. Servers in 90 countries, a built-in tracker blocker, and zero setup.',
    category: 'Utilities',
    icon: '/icons/harbor.png',
    rating: 4.7,
    ratingCount: '520K',
    downloads: '50M+',
    age: '4+',
    builds: {
      android: { version: '7.3.0', size: '29 MB', minOS: 'Android 8' },
      ios: { version: '7.3.0', size: '36 MB', minOS: 'iOS 15' },
      macos: { version: '7.2.8', size: '58 MB', minOS: 'macOS 12' },
      windows: { version: '7.2.8', size: '64 MB', minOS: 'Windows 10' },
    },
  },
  {
    slug: 'nimbus',
    name: 'Nimbus',
    developer: 'Skyward Labs',
    tagline: 'Hyperlocal weather, minute by minute.',
    description:
      'Down-to-the-minute rain forecasts, radar you can scrub through time, and serene animated skies. Nimbus widgets look stunning on every home screen and desktop.',
    category: 'Weather',
    icon: '/icons/nimbus.png',
    rating: 4.8,
    ratingCount: '740K',
    downloads: '10M+',
    age: '4+',
    builds: {
      android: { version: '5.6.2', size: '33 MB', minOS: 'Android 9' },
      ios: { version: '5.6.2', size: '41 MB', minOS: 'iOS 16' },
      macos: { version: '5.6.0', size: '49 MB', minOS: 'macOS 13' },
    },
  },
  {
    slug: 'quill',
    name: 'Quill',
    developer: 'Quill Software',
    tagline: 'The code editor that gets out of your way.',
    description:
      'A blazing-fast native editor with built-in AI pair programming, multiplayer sessions and a terminal that feels at home. Opens a 1GB file in under a second.',
    category: 'Developer Tools',
    icon: '/icons/quill.png',
    rating: 4.9,
    ratingCount: '64K',
    downloads: '1M+',
    age: '4+',
    builds: {
      macos: { version: '1.18.0', size: '118 MB', minOS: 'macOS 13' },
      windows: { version: '1.18.0', size: '134 MB', minOS: 'Windows 10' },
    },
  },
]

export const FEATURED_SLUGS = ['lumen', 'tidewave', 'kiln'] as const

export function getApp(slug: string) {
  return APPS.find((app) => app.slug === slug)
}
