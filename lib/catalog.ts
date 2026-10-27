import type { Platform } from './platform'

export const CATEGORIES = ['All', 'Productivity', 'Utilities', 'Creative', 'Developer', 'Privacy', 'Media'] as const
export type Category = (typeof CATEGORIES)[number]

export type StoreApp = {
  /** owner/repo — unique and stable */
  id: string
  owner: string
  repo: string
  name: string
  tagline: string
  category?: Exclude<Category, 'All'>
  /** Declared platforms. Undefined means "resolve live from releases". */
  platforms?: Platform[]
  /** simple-icons export name, e.g. "siObsidian" */
  icon?: string
  avatar?: string
  appStoreId?: string
  stars?: number
  featured?: string
}

function app(
  owner: string,
  repo: string,
  data: Omit<StoreApp, 'id' | 'owner' | 'repo'>,
): StoreApp {
  return { id: `${owner}/${repo}`, owner, repo, ...data }
}

export const CATALOG: StoreApp[] = [
  app('obsidianmd', 'obsidian-releases', {
    name: 'Obsidian',
    tagline: 'A private, local-first second brain built on plain Markdown.',
    category: 'Productivity',
    platforms: ['macos', 'windows', 'ios'],
    icon: 'siObsidian',
    appStoreId: '1557175442',
    featured: 'Think in links, not folders.',
  }),
  app('localsend', 'localsend', {
    name: 'LocalSend',
    tagline: 'AirDrop for every device. Share files over your local network.',
    category: 'Utilities',
    platforms: ['android', 'ios', 'macos', 'windows'],
    icon: 'siLocalsend',
    appStoreId: '1661733229',
    featured: 'Send anything. No cloud. No cables.',
  }),
  app('obsproject', 'obs-studio', {
    name: 'OBS Studio',
    tagline: 'Professional live streaming and screen recording.',
    category: 'Creative',
    platforms: ['macos', 'windows'],
    icon: 'siObsstudio',
    featured: 'Broadcast like a studio.',
  }),
  app('rustdesk', 'rustdesk', {
    name: 'RustDesk',
    tagline: 'Open-source remote desktop with self-hosting built in.',
    category: 'Utilities',
    platforms: ['android', 'ios', 'macos', 'windows'],
    icon: 'siRustdesk',
    appStoreId: '1581225015',
  }),
  app('logseq', 'logseq', {
    name: 'Logseq',
    tagline: 'A privacy-first outliner for knowledge and journaling.',
    category: 'Productivity',
    platforms: ['android', 'ios', 'macos', 'windows'],
    icon: 'siLogseq',
    appStoreId: '1601013908',
  }),
  app('AppFlowy-IO', 'AppFlowy', {
    name: 'AppFlowy',
    tagline: 'The open workspace for docs, wikis and projects.',
    category: 'Productivity',
    platforms: ['android', 'ios', 'macos', 'windows'],
    appStoreId: '6457261352',
  }),
  app('VSCodium', 'vscodium', {
    name: 'VSCodium',
    tagline: 'VS Code, built from source, without the telemetry.',
    category: 'Developer',
    platforms: ['macos', 'windows'],
    icon: 'siVscodium',
  }),
  app('zen-browser', 'desktop', {
    name: 'Zen Browser',
    tagline: 'A calm, beautifully focused Firefox-based browser.',
    category: 'Utilities',
    platforms: ['macos', 'windows'],
    icon: 'siZenbrowser',
  }),
  app('keepassxreboot', 'keepassxc', {
    name: 'KeePassXC',
    tagline: 'Offline password manager. Your vault never leaves you.',
    category: 'Privacy',
    platforms: ['macos', 'windows'],
    icon: 'siKeepassxc',
  }),
  app('audacity', 'audacity', {
    name: 'Audacity',
    tagline: 'The classic multi-track audio editor and recorder.',
    category: 'Creative',
    platforms: ['macos', 'windows'],
    icon: 'siAudacity',
  }),
  app('upscayl', 'upscayl', {
    name: 'Upscayl',
    tagline: 'Upscale low-resolution images with on-device AI.',
    category: 'Creative',
    platforms: ['macos', 'windows'],
  }),
  app('ollama', 'ollama', {
    name: 'Ollama',
    tagline: 'Run large language models locally, entirely offline.',
    category: 'Developer',
    platforms: ['macos', 'windows'],
    icon: 'siOllama',
  }),
  app('janhq', 'jan', {
    name: 'Jan',
    tagline: 'An open-source ChatGPT alternative that runs on your machine.',
    category: 'Developer',
    platforms: ['macos', 'windows'],
  }),
  app('laurent22', 'joplin', {
    name: 'Joplin',
    tagline: 'End-to-end encrypted notes and to-dos that sync anywhere.',
    category: 'Productivity',
    platforms: ['macos', 'windows', 'ios'],
    icon: 'siJoplin',
    appStoreId: '1315599797',
  }),
  app('telegramdesktop', 'tdesktop', {
    name: 'Telegram',
    tagline: 'Fast, synced messaging. The official desktop client.',
    category: 'Utilities',
    platforms: ['macos', 'windows', 'ios'],
    icon: 'siTelegram',
    appStoreId: '686449807',
  }),
  app('hiddify', 'hiddify-app', {
    name: 'Hiddify',
    tagline: 'A multi-protocol proxy client for an open internet.',
    category: 'Privacy',
    platforms: ['android', 'ios', 'macos', 'windows'],
    appStoreId: '6596777532',
  }),
  app('TeamNewPipe', 'NewPipe', {
    name: 'NewPipe',
    tagline: 'A lightweight, ad-free streaming front-end for Android.',
    category: 'Media',
    platforms: ['android'],
    icon: 'siNewpipe',
  }),
  app('mihonapp', 'mihon', {
    name: 'Mihon',
    tagline: 'A free and open-source manga reader.',
    category: 'Media',
    platforms: ['android'],
    icon: 'siMihon',
  }),
  app('termux', 'termux-app', {
    name: 'Termux',
    tagline: 'A full Linux terminal environment on Android.',
    category: 'Developer',
    platforms: ['android'],
  }),
  app('beemdevelopment', 'Aegis', {
    name: 'Aegis',
    tagline: 'Secure, open-source two-factor authenticator.',
    category: 'Privacy',
    platforms: ['android'],
  }),
  app('iina', 'iina', {
    name: 'IINA',
    tagline: 'The modern media player designed for macOS.',
    category: 'Media',
    platforms: ['macos'],
  }),
  app('exelban', 'stats', {
    name: 'Stats',
    tagline: 'System monitor that lives quietly in your menu bar.',
    category: 'Utilities',
    platforms: ['macos'],
  }),
  app('rxhanson', 'Rectangle', {
    name: 'Rectangle',
    tagline: 'Snap and move windows with keyboard shortcuts.',
    category: 'Utilities',
    platforms: ['macos'],
  }),
  app('notepad-plus-plus', 'notepad-plus-plus', {
    name: 'Notepad++',
    tagline: 'A fast, feature-rich source code editor for Windows.',
    category: 'Developer',
    platforms: ['windows'],
    icon: 'siNotepadplusplus',
  }),
  app('ShareX', 'ShareX', {
    name: 'ShareX',
    tagline: 'Screenshots, recordings and uploads in a single keystroke.',
    category: 'Utilities',
    platforms: ['windows'],
    icon: 'siSharex',
  }),
  app('microsoft', 'PowerToys', {
    name: 'PowerToys',
    tagline: 'Power-user utilities for tuning and streamlining Windows.',
    category: 'Utilities',
    platforms: ['windows'],
  }),
]

export function findCatalogApp(owner: string, repo: string) {
  const key = `${owner}/${repo}`.toLowerCase()
  return CATALOG.find((a) => a.id.toLowerCase() === key)
}
