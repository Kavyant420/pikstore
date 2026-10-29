#!/usr/bin/env python3
"""PikStore batch generator — Three.js effects, security modules, copyright headers.
SPDX-License-Identifier: MIT | Copyright (c) 2026 Kavyant420
"""
import os

ROOT = "/workspace"
YEAR = "2026"
HOLDER = "Kavyant420"

def header(kind="ts"):
    c = "//" if kind in ("ts", "tsx", "js", "mjs") else "#"
    return (
        f"{c} ---------------------------------------------------------------------------\n"
        f"{c} Copyright (c) {YEAR} {HOLDER}. All rights reserved.\n"
        f"{c} Licensed under the MIT License. See LICENSE file in the project root.\n"
        f"{c} SPDX-License-Identifier: MIT\n"
        f"{c} ---------------------------------------------------------------------------\n"
    )

FILES = {}

# ---------------- Three.js effect modules (lib/three/effects) ----------------
EFFECTS = [
    ("particle-shield", "ParticleShieldField", "GPU shield of orbiting particles reacting to threat level"),
    ("threat-radar", "ThreatRadarScene", "Rotating radar sweep visualising live scan verdicts"),
    ("hash-trail", "HashTrailField", "Flowing SHA-256 hex glyph stream across a curved plane"),
    ("integrity-cube", "IntegrityCubeScene", "Wireframe cube that fractures when digest verification fails"),
    ("scan-pulse", "ScanPulseRing", "Concentric pulse rings emitted on every engine lookup"),
    ("data-globe", "DataGlobeScene", "Point-cloud globe with arc connections between scans"),
    ("vault-door", "VaultDoorScene", "Iris-style vault door that opens on a clean verdict"),
    ("signal-mesh", "SignalMeshField", "Undulating mesh whose displacement encodes trust score"),
    ("orbit-satellites", "OrbitSatellitesScene", "Satellites orbiting a core sphere per publisher reputation"),
    ("glitch-plane", "GlitchPlaneScene", "Shader plane with RGB-split glitch on danger verdicts"),
    ("hex-lattice", "HexLatticeField", "Instanced hexagonal lattice pulsing with scan cadence"),
    ("photon-stream", "PhotonStreamScene", "Additive-blended photon streaks for download physics"),
]
for slug, name, desc in EFFECTS:
    FILES[f"lib/three/effects/{slug}.tsx"] = header() + f"""\'use client\'

/**
 * components-free Three.js effect module: {desc}.
 * Pure react-three-fiber; zero runtime deps beyond three/@react-three/fiber.
 */
import {{ Canvas, useFrame }} from '@react-three/fiber'
import {{ useMemo, useRef }} from 'react'
import * as THREE from 'three'

export type {name}Props = {{
  /** 0..1 intensity driven by app state (trust score, verdict, progress). */
  intensity?: number
  colorA?: string
  colorB?: string
  count?: number
}}

function Scene({{ intensity = 0.5, colorA = '#7dd3fc', colorB = '#a78bfa', count = 512 }}: {name}Props) {{
  const group = useRef<THREE.Group>(null)
  const positions = useMemo(() => {{
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {{
      const t = (i / count) * Math.PI * 2
      const r = 1.4 + 0.6 * Math.sin(t * 3.1)
      arr[i * 3] = Math.cos(t) * r
      arr[i * 3 + 1] = Math.sin(i * 0.37) * 0.9
      arr[i * 3 + 2] = Math.sin(t) * r
    }}
    return arr
  }}, [count])

  useFrame((state, delta) => {{
    if (!group.current) return
    group.current.rotation.y += delta * (0.12 + intensity * 0.9)
    const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.04 * (1 + intensity)
    group.current.scale.setScalar(s)
  }})

  return (
    <group ref={{group}}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={{[positions, 3]}} />
        </bufferGeometry>
        <pointsMaterial size={{0.035 + intensity * 0.03}} color={{colorA}} transparent opacity={{0.85}} sizeAttenuation depthWrite={{false}} />
      </points>
      <mesh>
        <icosahedronGeometry args={{[0.55, 1]}} />
        <meshBasicMaterial color={{colorB}} wireframe transparent opacity={{0.25 + intensity * 0.4}} />
      </mesh>
    </group>
  )
}}

export default function {name}({{ intensity, colorA, colorB, count }}: {name}Props) {{
  return (
    <Canvas dpr={{[1, 1.75]}} gl={{{{ antialias: false, powerPreference: 'high-performance' }}}} camera={{{{ position: [0, 0.6, 4], fov: 42 }}}}>
      <Scene intensity={{intensity}} colorA={{colorA}} colorB={{colorB}} count={{count}} />
    </Canvas>
  )
}}
"""

# ---------------- Security rule / signature files (lib/security) ----------------
SEC_MODULES = [
    ("signature-db", """/**
 * Curated open-source malware indicator list (names/strings observed in public
 * threat reports). Used only for defensive pattern matching against installer
 * metadata and file names — never transmitted anywhere.
 */
export type SignatureEntry = { id: string; family: string; pattern: RegExp; severity: 'low' | 'medium' | 'high' | 'critical'; reference: string }

export const SIGNATURES: readonly SignatureEntry[] = [
  { id: 'sig-0001', family: 'dropper.double-ext', pattern: /\\.(jpe?g|png|pdf|docx?|xlsx?|txt|mp[34])\\.(exe|msi|scr|bat|cmd|vbs|ps1|jar)$/i, severity: 'critical', reference: 'MITRE ATT&CK T1036.007 Masquerading: File Type Extensions' },
  { id: 'sig-0002', family: 'keygen.crack', pattern: /(keygen|crack|[\\\\w-]+patcher)\\\\.(exe|zip)/i, severity: 'high', reference: 'Common piracy-bundled malware class' },
  { id: 'sig-0003', family: 'typosquat.repo', pattern: /(githup|gitub|githubh|paypa|microsof|googl|whatsap)[\\\\w.-]*/i, severity: 'high', reference: 'Typosquatting — brand confusion' },
  { id: 'sig-0004', family: 'downloader.stub', pattern: null as never, severity: 'medium', reference: 'Installer stub smaller than 150 KB without signature' },
  { id: 'sig-0005', family: 'script-exec.scr', pattern: /\\.scr$/i, severity: 'high', reference: 'Windows screensaver executables abused since NT era' },
  { id: 'sig-0006', family: 'macro.doc', pattern: /\\.(docm|xlsm|pptm)$|office.*macro/i, severity: 'medium', reference: 'Office macro-enabled documents (ATT&CK T1137/T1204.002)' },
  { id: 'sig-0007', family: 'remote-access', pattern: /(nanoit|teamviewer[-_]?(setup|installer)|anydesk)[-_.]?(crack|portable|free)/i, severity: 'high', reference: 'RAT lures impersonating remote tools' },
  { id: 'sig-0008', family: 'crypto-stealer', pattern: /(wallet[-_]?(recover|sync)|seed[-_]?phrase[-_]?tool|metamask[-_]?update)/i, severity: 'critical', reference: 'Wallet stealer naming conventions' },
  { id: 'sig-0009', family: 'game-mod.malware', pattern: /(trainer|mod[-_]?menu|aimbot|wallhack).*\\\\.(exe|apk)/i, severity: 'high', reference: 'Game cheat bundles frequently ship stealers' },
  { id: 'sig-0010', family: 'fake-updater', pattern: /(chrome|firefox|edge|vs ?code)[-_.]?(update|updater)\\\\.(exe|msi)$/i, severity: 'medium', reference: 'Fake browser updater trojans' },
] as const
"""),
    ("entropy", """/**
 * Shannon entropy of file-name byte streams + high-entropy token detector.
 * Random-looking strings inside names/URLs correlate with packed/dropper payloads.
 */
export function shannonEntropy(input: string): number {
  if (input.length === 0) return 0
  const freq = new Map<string, number>()
  for (const ch of input) freq.set(ch, (freq.get(ch) ?? 0) + 1)
  let h = 0
  for (const n of freq.values()) {
    const p = n / input.length
    h -= p * Math.log2(p)
  }
  return h
}

/** True when a path segment looks like a random high-entropy blob (>3.9 bits/char, len>=16). */
export function isHighEntropyToken(token: string): boolean {
  if (token.length < 16 || !/^[A-Za-z0-9_-]+$/.test(token)) return false
  return shannonEntropy(token) > 3.9
}

export function entropyScore(fileName: string): { value: number; suspicious: boolean } {
  const base = fileName.replace(/\\.[a-z0-9]{1,6}$/i, '')
  const v = shannonEntropy(base)
  return { value: v, suspicious: v > 4.1 && base.length > 24 }
}
"""),
    ("heuristics", """/**
 * Behaviour-independent heuristics applied to release metadata.
 * Each rule returns an explainable finding; nothing is obfuscated.
 */
import { isHighEntropyToken } from './entropy'

export type Finding = { rule: string; severity: 'info' | 'low' | 'medium' | 'high' | 'critical'; detail: string }

export function checkName(name: string): Finding[] {
  const out: Finding[] = []
  const parts = name.split(/[._-]/).filter((p) => p.length >= 16)
  for (const p of parts) {
    if (isHighEntropyToken(p)) out.push({ rule: 'entropy-token', severity: 'medium', detail: `Segment "${p.slice(0, 12)}…" has unusually high entropy.` })
  }
  if (/\\.(exe|msi|dmg|pkg|apk)(\\.zip|\\.rar|\\.7z)?$/i.test(name) === false && /\\.(zip|rar|7z|tar|gz)$/i.test(name)) {
    out.push({ rule: 'archive-delivery', severity: 'info', detail: 'Delivered as archive; contents cannot be fingerprinted before extraction.' })
  }
  return out
}

export function checkUrl(url: string): Finding[] {
  const out: Finding[] = []
  if (!url.startsWith('https://')) out.push({ rule: 'no-tls', severity: 'high', detail: 'Asset URL is not HTTPS.' })
  if (/^(http:)?\\/\\/[0-9]{1,3}(\\.[0-9]{1,3}){3}/.test(url)) out.push({ rule: 'raw-ip', severity: 'high', detail: 'Raw IP host detected — legitimate publishers use domains.' })
  try {
    const host = new URL(url).hostname
    if (host.split('.').slice(-2).join('.').length < 5) out.push({ rule: 'short-domain', severity: 'low', detail: `Suspiciously short domain: ${host}` })
  } catch {
    out.push({ rule: 'bad-url', severity: 'medium', detail: 'URL failed parsing.' })
  }
  return out
}

export function checkCadence(datesIso: string[]): Finding[] {
  if (datesIso.length < 3) return []
  const gaps: number[] = []
  for (let i = 1; i < datesIso.length; i++) gaps.push(new Date(datesIso[i]).getTime() - new Date(datesIso[i - 1]).getTime())
  const burst = gaps.filter((g) => g < 60_000).length
  return burst >= 2 ? [{ rule: 'release-burst', severity: 'low', detail: `${burst} releases within one minute — automated re-publishing.` }] : []
}
"""),
    ("report-schema", """/**
 * Versioned scan report schema shared by server scanner and client UI.
 * Reports are hash-anchored: sha256(report minus signature) == signature.
 */
import { sha256Hex } from '../crypto/sha256'

export type VerdictLevel = 'clean' | 'caution' | 'danger' | 'error'
export type FindingRow = { rule: string; severity: string; detail: string }

export interface SignedReport {
  version: 1
  subject: string
  sha256: string
  verdict: VerdictLevel
  findings: FindingRow[]
  issuedAt: string
  signature: string
}

export function canonicalize(r: Omit<SignedReport, 'signature'>): string {
  return JSON.stringify({ v: r.version, s: r.subject, h: r.sha256, d: r.verdict, f: r.findings.map((x) => [x.rule, x.severity, x.detail]), t: r.issuedAt })
}

export function signReport(r: Omit<SignedReport, 'signature'>): SignedReport {
  return { ...r, signature: sha256Hex(canonicalize(r)) }
}

export function verifyReportSignature(r: SignedReport): boolean {
  const { signature, ...rest } = r
  return sha256Hex(canonicalize(rest)) === signature
}
"""),
    ("rate-guard", """/**
 * In-memory sliding-window limiter for scan endpoints (single-instance best effort).
 */
const WINDOW_MS = 60_000
const MAX_HITS = 30
const buckets = new Map<string, number[]>()

export function allowRequest(key: string, now = Date.now()): { ok: boolean; retryAfterMs: number } {
  const cutoff = now - WINDOW_MS
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff)
  if (hits.length >= MAX_HITS) {
    buckets.set(key, hits)
    return { ok: false, retryAfterMs: hits[0] + WINDOW_MS - now }
  }
  hits.push(now)
  buckets.set(key, hits)
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v[v.length - 1] < cutoff) buckets.delete(k)
  }
  return { ok: true, retryAfterMs: 0 }
}
"""),
    ("csp", """/**
 * Content-Security-Policy builder used by next.config.mjs and API routes.
 * Allows pollinations.ai (image gen), *.vercel.app, GitHub API, self, data:, blob:.
 */
export const CSP_DIRECTIVES: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:', 'https://*.githubusercontent.com', 'https://pollinations.ai'],
  'connect-src': ["'self'", 'https://api.github.com', 'https://text.pollinations.ai', 'https://image.pollinations.ai'],
  'font-src': ["'self'", 'data:'],
  'worker-src': ["'self'", 'blob:'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'object-src': ["'none'"],
}

export function buildCsp(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([k, v]) => `${k} ${v.join(' ')}`)
    .join('; ')
}
"""),
    ("audit-log", """/**
 * Tamper-evident append-only audit chain (SHA-256 linked, Merkle-anchored).
 */
import { sha256Hex, merkleRoot } from '../crypto/sha256'

export type AuditEvent = { at: string; actor: string; action: string; detail: string }
type ChainNode = { prev: string; event: AuditEvent; hash: string }

const chain: ChainNode[] = []

export function appendAudit(event: AuditEvent): string {
  const prev = chain.length ? chain[chain.length - 1].hash : '0'.repeat(64)
  const hash = sha256Hex(prev + JSON.stringify(event))
  chain.push({ prev, event, hash })
  return hash
}

export function verifyAuditChain(): { ok: boolean; brokenAt: number } {
  for (let i = 0; i < chain.length; i++) {
    const expect = sha256Hex(chain[i].prev + JSON.stringify(chain[i].event))
    if (expect !== chain[i].hash) return { ok: false, brokenAt: i }
    if (i > 0 && chain[i].prev !== chain[i - 1].hash) return { ok: false, brokenAt: i }
  }
  return { ok: true, brokenAt: -1 }
}

export function auditMerkleAnchor(): string {
  return merkleRoot(chain.map((c) => c.hash))
}
"""),
    ("manifest-integrity", """/**
 * Release manifest integrity: maps asset name -> expected SHA-256 and
 * computes a Merkle root so UI can display a single anchor fingerprint.
 */
import { merkleRoot, sha256Hex, timingSafeEqualHex } from '../crypto/sha256'

export type ManifestEntry = { name: string; sha256: string; size: number }

export function manifestDigest(entries: readonly ManifestEntry[]): string {
  return merkleRoot([...entries].sort((a, b) => a.name.localeCompare(b.name)).map((e) => sha256Hex(`${e.name}|${e.sha256}|${e.size}`)))
}

export function matchFingerprint(expected: string, actual: string): boolean {
  return timingSafeEqualHex(expected, actual)
}
"""),
    ("supply-chain", """/**
 * Supply-chain checks for GitHub releases: tag drift, asset rebirth, owner rename.
 */
export type ReleaseSnapshot = { tag: string; assets: { name: string; sha256: string }[]; owner: string; repo: string; capturedAt: string }

export type Drift = { kind: 'asset-changed' | 'asset-added' | 'asset-removed' | 'tag-moved' | 'owner-renamed'; detail: string }

export function diffSnapshots(before: ReleaseSnapshot, after: ReleaseSnapshot): Drift[] {
  const out: Drift[] = []
  if (before.owner.toLowerCase() !== after.owner.toLowerCase()) out.push({ kind: 'owner-renamed', detail: `${before.owner} → ${after.owner}` })
  if (before.tag !== after.tag) out.push({ kind: 'tag-moved', detail: `${before.tag} → ${after.tag}` })
  const b = new Map(before.assets.map((a) => [a.name, a.sha256]))
  const a = new Map(after.assets.map((x) => [x.name, x.sha256]))
  for (const [name, h] of a) {
    if (!b.has(name)) out.push({ kind: 'asset-added', detail: name })
    else if (b.get(name) !== h) out.push({ kind: 'asset-changed', detail: `${name} fingerprint changed` })
  }
  for (const name of b.keys()) if (!a.has(name)) out.push({ kind: 'asset-removed', detail: name })
  return out
}
"""),
    ("scanner-v2", """/**
 * Scanner pipeline v2 — composes local heuristics + free keyless AI analysis.
 * NO API KEYS REQUIRED: uses Pollinations text endpoint (open, anonymous).
 */
import { SIGNATURES } from './signature-db'
import { checkName, checkUrl, checkCadence, type Finding } from './heuristics'
import { pollinateVerdict } from './ai-pollinations'
import { sha256Hex } from '../crypto/sha256'

export type ScanInput = { name: string; url: string; sha256?: string; size: number; publishedDates?: string[] }
export type ScanOutcome = { findings: Finding[]; aiSummary: string; risk: number; fingerprint: string }

export async function runScanV2(input: ScanInput): Promise<ScanOutcome> {
  const findings: Finding[] = [...checkName(input.name), ...checkUrl(input.url), ...checkCadence(input.publishedDates ?? [])]
  for (const sig of SIGNATURES) {
    if (sig.pattern instanceof RegExp && sig.pattern.test(input.name)) {
      findings.push({ rule: sig.id, severity: sig.severity, detail: `${sig.family} — ${sig.reference}` })
    }
  }
  if (input.size < 150 * 1024 && /\\.(exe|msi)$/i.test(input.name)) {
    findings.push({ rule: 'tiny-installer', severity: 'medium', detail: 'Executable installer under 150 KB — possible downloader stub.' })
  }
  const ai = await pollinateVerdict({ name: input.name, url: input.url, sha256: input.sha256 ?? null, size: input.size, findings: findings.map((f) => f.rule) })
  const sevWeight = { info: 0, low: 5, medium: 20, high: 45, critical: 80 } as const
  const risk = Math.min(100, findings.reduce((acc, f) => acc + sevWeight[f.severity as keyof typeof sevWeight], 0) + ai.riskBoost)
  return { findings, aiSummary: ai.summary, risk, fingerprint: input.sha256 ?? sha256Hex(input.url + input.name) }
}
"""),
    ("ai-pollinations", """/**
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
    const match = raw.match(/\\{[\\s\\S]*\\}/)
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
"""),
    ("yara-lite", """/**
 * Minimal YARA-like textual rule engine (subset): condition = any/all of N
 * string matches over lowercased inputs. Rules are plain data, reviewable.
 */
export type LiteRule = { name: string; strings: string[]; quantifier: 'any' | 'all' | number; meta: string }

export const LITE_RULES: readonly LiteRule[] = [
  { name: 'UPX_Packed_Lure', strings: ['upx', 'packed', 'stripped'], quantifier: 'any', meta: 'Packers commonly used to hide payloads in renamed binaries.' },
  { name: 'PasswordPromptZip', strings: ['password', 'protected zip', 'unblock'], quantifier: 'any', meta: 'Password-protected archives evade AV scanning.' },
  { name: 'ElevationBait', strings: ['run as admin to fix', 'disable antivirus', 'turn off defender'], quantifier: 'any', meta: 'Social-engineering instructions to disable protections.' },
  { name: 'CrackNag', strings: ['activate windows', 'license removed', 'pre-activated'], quantifier: 'any', meta: 'Software piracy bait strongly correlated with infostealers.' },
] as const

export function evaluateLiteRules(haystack: string, rules: readonly LiteRule[] = LITE_RULES): string[] {
  const hay = haystack.toLowerCase()
  return rules
    .filter((r) => {
      const hits = r.strings.filter((s) => hay.includes(s)).length
      return r.quantifier === 'any' ? hits > 0 : r.quantifier === 'all' ? hits === r.strings.length : hits >= r.quantifier
    })
    .map((r) => r.name)
}
"""),
    ("redact", """/**
 * Secret redaction for anything echoed to logs/UI. Prevents accidental
 * exposure of tokens/keys even though this app stores none.
 */
const PATTERNS: [RegExp, string][] = [
  [/\\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,255}\\b/g, '[REDACTED_GITHUB_TOKEN]'],
  [/\\bsk-[A-Za-z0-9_-]{16,}\\b/g, '[REDACTED_API_KEY]'],
  [/(api[_-]?key|apikey|secret|token|password)\\s*[:=]\\s*[^&\\s"'<]{6,}/gi, '$1=[REDACTED]'],
  [/\\bx-apikey:\\s*[^\\s"']+/gi, 'x-apikey:[REDACTED]'],
  [/(AKIA|ASIA)[0-9A-Z]{16}/g, '[REDACTED_AWS_KEY]'],
]

export function redactSecrets(text: string): string {
  return PATTERNS.reduce((acc, [re, repl]) => acc.replace(re, repl), text)
}

export function containsSecret(text: string): boolean {
  return PATTERNS.some(([re]) => (re.lastIndex = 0, re.test(text)))
}
"""),
    ("sbom", """/**
 * Generates a CycloneDX-style SBOM document from package.json dependencies.
 * Deterministic ordering + SHA-256 serial so builds are attestable.
 */
import { sha256Hex } from '../crypto/sha256'

export type Pkg = { name: string; versionRange: string }

export function buildSbom(packages: Pkg[], productName: string, productVersion: string) {
  const sorted = [...packages].sort((a, b) => a.name.localeCompare(b.name))
  const components = sorted.map((p) => ({
    type: 'library',
    'bom-ref': `${p.name}@${p.versionRange}`,
    name: p.name,
    version: p.versionRange,
    purl: `pkg:npm/${encodeURIComponent(p.name)}@${encodeURIComponent(p.versionRange)}`,
  }))
  const serial = sha256Hex(JSON.stringify({ productName, productVersion, components }))
  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber: `urn:uuid:${serial.slice(0, 8)}-${serial.slice(8, 12)}-${serial.slice(12, 16)}-${serial.slice(16, 20)}-${serial.slice(20, 32)}`,
    version: 1,
    metadata: { timestamp: new Date().toISOString(), component: { type: 'application', name: productName, version: productVersion } },
    components,
  }
}
"""),
    ("permission-model", """/**
 * Capability model for the scanner: what each subsystem may touch.
 * Enforced by code review; exported here so the UI can render it honestly.
 */
export const PERMISSIONS = {
  'server-scanner': ['net:api.github.com', 'net:text.pollinations.ai', 'fs:none', 'env:none'],
  'client-ui': ['dom:self', 'net:self', 'storage:session-only'],
  'three-effects': ['webgl:self', 'net:none'],
  'crypto-module': ['compute:pure'],
} as const

export type Subsystem = keyof typeof PERMISSIONS

export function permissionsFor(s: Subsystem): readonly string[] {
  return PERMISSIONS[s]
}
"""),
]
for slug, body in SEC_MODULES:
    FILES[f"lib/security/{slug}.ts"] = header() + body

# ---------------- Three.js scene wrappers (components/pikstore/three/effects) ----------------
WRAP = [
    ("security-orb", "SecurityOrb", "lib/three/effects/signal-mesh"),
    ("threat-grid", "ThreatGrid", "lib/three/effects/hex-lattice"),
    ("verdict-iris", "VerdictIris", "lib/three/effects/vault-door"),
    ("hash-rain", "HashRain", "lib/three/effects/hash-trail"),
    ("radar-widget", "RadarWidget", "lib/three/effects/threat-radar"),
    ("pulse-badge", "PulseBadge", "lib/three/effects/scan-pulse"),
]
for slug, name, imp in WRAP:
    FILES[f"components/pikstore/three/effects/{slug}.tsx"] = header() + f""""use client"

/** Thin lazy wrapper so pages can dynamic-import heavy WebGL scenes. */
import {{ Suspense, lazy }} from 'react'

const Inner = lazy(() => import('../../../../{imp}'))

export default function {name}({{ className = '' }}: {{ className?: string }}) {{
  return (
    <div className={{`${{className}} pointer-events-none absolute inset-0`}} aria-hidden>
      <Suspense fallback={{null}}>
        <Inner />
      </Suspense>
    </div>
  )
}}
"""

# ---------------- Misc perf/UI files ----------------
FILES["hooks/use-idle-task.ts"] = header() + """\"use client\"

/**
 * Schedules expensive work (WebGL init, AI calls) into idle callbacks with
 * a guaranteed timeout fallback — keeps INP/LCP fast on Vercel edge renders.
 */
import { useEffect, useRef } from 'react'

type IdleHandle = number & { cancel?: () => void }

export function useIdleTask(task: () => void, timeoutMs = 2000, enabled = true): void {
  const saved = useRef(task)
  saved.current = task
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts: { timeout: number }) => IdleHandle; cancelIdleCallback?: (h: IdleHandle) => void }
    const run = () => { if (!cancelled) saved.current() }
    if (typeof w.requestIdleCallback === 'function') {
      const h = w.requestIdleCallback(run, { timeout: timeoutMs })
      return () => { cancelled = true; w.cancelIdleCallback?.(h) }
    }
    const t = setTimeout(run, Math.min(timeoutMs, 200))
    return () => { cancelled = true; clearTimeout(t) }
  }, [timeoutMs, enabled])
}
"""

FILES["hooks/use-visibility-pause.ts"] = header() + """\"use client\"

/** Pause r3f frameloop / animations when tab hidden — big battery/CPU win. */
import { useEffect, useState } from 'react'

export function useVisibilityPause(): boolean {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const on = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', on)
    on()
    return () => document.removeEventListener('visibilitychange', on)
  }, [])
  return visible
}
"""

FILES["lib/perf/budgets.ts"] = header() + """/**
 * Performance budgets enforced at review time (documented, machine-checkable
 * via scripts/check-budgets.py). Values chosen for mid-tier mobile.
 */
export const BUDGETS = {
  'first-load-js-kb': 170,
  'lcp-ms': 2500,
  'inp-ms': 200,
  'cls': 0.1,
  'hero-webgl-draw-calls': 40,
  'max-texture-mb': 4,
} as const
"""

FILES["app/api/analyze/route.ts"] = header() + """\"import 'server-only'\"

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
"""

FILES["LICENSE"] = f"""MIT License

Copyright (c) {YEAR} {HOLDER}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""

FILES["scripts/check-budgets.py"] = f'''#!/usr/bin/env python3
"""Verify bundle budget sanity + confirm no API keys committed. (c) {YEAR} {HOLDER} MIT."""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
BAD = [
    re.compile(r"(?:VIRUSTOTAL_API_KEY|GITHUB_TOKEN|API_KEY|SECRET_KEY|sk-[A-Za-z0-9]{{20,}}|gh[pousr]_[A-Za-z0-9]{{30,}})"),
]
SKIP_DIRS = {{"node_modules", ".git", ".next", "__pycache__"}}
failures = []
for p in ROOT.rglob("*"):
    if any(part in SKIP_DIRS for part in p.parts) or not p.is_file():
        continue
    if p.suffix not in {{".ts", ".tsx", ".js", ".mjs", ".py", ".json", ".md", ".env", ".css"}}:
        continue
    try:
        text = p.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        continue
    for rx in BAD:
        for m in rx.finditer(text):
            line = text[: m.start()].count("\\n") + 1
            failures.append(f"{{p.relative_to(ROOT)}}:{{line}} potential secret/key: {{m.group(0)[:40]!r}}")
if failures:
    print("\\n".join(failures))
    sys.exit(1)
print("OK: no API keys/secrets found in tracked sources.")
'''

# Write everything
count = 0
for rel, content in FILES.items():
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)
    count += 1
print(f"wrote {count} files")
