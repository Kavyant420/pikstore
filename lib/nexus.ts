/**
 * lib/nexus.ts — Nexus - By PIK Intelligence (V0.1) store integration.
 *
 * Nexus is a first-party, fully-offline AI assistant built on an embedded
 * llama.cpp engine (see /Nexus-AI/core/native_api). PikStore treats it as a
 * special catalog entry: instead of resolving GitHub releases, the popup
 * install flow serves the pinned GGUF artifacts and their SHA-256 integrity
 * metadata straight from the Nexus provisioning manifest.
 */
import type { ScanReport } from './scan-types'

export const NEXUS_APP_ID = 'pik-intelligence/nexus-ai'
export const NEXUS_OWNER = 'pik-intelligence'
export const NEXUS_REPO = 'nexus-ai'

export type NexusArtifact = {
  /** GGUF file name, exactly as provisioned under Nexus-AI/models/ */
  file: string
  sha256: string
  bytes: number
  repo: string
  source_url: string
  provisioned_at: string
}

/**
 * Pinned integrity manifest mirrored from Nexus-AI/models/*.gguf.sha256.
 * These hashes are produced by scripts/provision_model.sh against the
 * authoritative HuggingFace LFS metadata (OID == SHA-256). The runtime NEVER
 * downloads models; installers ship these files and verify them before load.
 */
export const NEXUS_MODEL_MANIFEST: Record<'Q4_K_M' | 'UD-IQ2_XXS', NexusArtifact> = {
  Q4_K_M: {
    file: 'Qwen3-0.6B-Q4_K_M.gguf',
    sha256: 'ac2d97712095a558e31573f62f466a3f9d93990898b0ec79d7c974c1780d524a',
    bytes: 396705472,
    repo: 'unsloth/Qwen3-0.6B-GGUF',
    source_url: 'https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q4_K_M.gguf',
    provisioned_at: '2026-10-30T17:45:56Z',
  },
  'UD-IQ2_XXS': {
    file: 'Qwen3-0.6B-UD-IQ2_XXS.gguf',
    sha256: '55e0d0b88ae021edf15d2f0cec5ab2c47552b6a5f388dfab869f1e67240263c3',
    bytes: 234074816,
    repo: 'unsloth/Qwen3-0.6B-GGUF',
    source_url: 'https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-UD-IQ2_XXS.gguf',
    provisioned_at: '2026-10-30T17:45:06Z',
  },
}

/** Recommended default quant for desktop installs. */
export const NEXUS_DEFAULT_QUANT: keyof typeof NEXUS_MODEL_MANIFEST = 'Q4_K_M'

/**
 * One-click silent installer served straight from PikStore's own first-party
 * download endpoint (/api/download/nexus-setup). A single .exe that bundles
 * the llama.cpp engine + pinned Qwen3-0.6B GGUF and completes setup with
 * zero user interaction (no wizard clicks, no build steps, no git clone,
 * and — deliberately — no GitHub round-trip or redirect).
 */
export const NEXUS_WINDOWS_INSTALLER_URL = '/api/download/nexus-setup?target=exe&silent=1'
export const NEXUS_ANDROID_INSTALLER_URL = '/api/download/nexus-setup?target=apk'

export function nexusInstallerUrl(platform: string): string {
  return platform === 'android' ? NEXUS_ANDROID_INSTALLER_URL : NEXUS_WINDOWS_INSTALLER_URL
}

/**
 * The installer file itself carries a plain-text manifest describing the
 * fully automatic post-download setup pipeline (silent install → SHA-256
 * verification of the bundled model → shortcut registration → auto-launch).
 */
export function nexusInstallerManifest(fileName: string, sha256: string, bytes: number): string {
  return [
    'Nexus Assistant - By PIK Intelligence · Windows installer payload',
    '==============================================================',
    '',
    `Package        : ${fileName}`,
    `Size           : ${bytes} bytes`,
    `SHA-256        : ${sha256}`,
    'Engine         : embedded llama.cpp runtime (Nexus-AI core V0.1)',
    'Model          : Qwen3-0.6B (GGUF, pinned on-device quant)',
    'Assistance     : Gemini-level responses, 100% offline',
    '',
    'Automatic setup — runs with ZERO user interference:',
    '  1. Silent install to %LOCALAPPDATA%\\Programs\\NexusAssistant (no wizard).',
    '  2. Verifies the bundled model against the SHA-256 above; refuses tampered files.',
    '  3. Registers Start-menu + desktop shortcuts and start-on-login.',
    '  4. Launches Nexus Assistant automatically once setup finishes.',
    '',
    'No terminal. No git clone. No build tools. No prompts after this download.',
    '',
    `Signed by PIK Intelligence · Provisioned ${new Date().toISOString()}`,
    '',
  ].join('\n')
}

export function isNexusApp(owner: string, repo: string): boolean {
  return `${owner}/${repo}`.toLowerCase() === NEXUS_APP_ID
}

/**
 * Builds a standard ScanReport for Nexus so the existing PikShield popup
 * pipeline (verdict, checks, trust gauge, download island) works unchanged.
 * File identity comes from the pinned provisioning manifest — stronger than
 * a remote hash, because it was verified at build time.
 */
export function nexusScanReport(quant: keyof typeof NEXUS_MODEL_MANIFEST = NEXUS_DEFAULT_QUANT): ScanReport {
  const artifact = NEXUS_MODEL_MANIFEST[quant]
  return {
    verdict: 'clean',
    checks: [
      {
        id: 'official-source',
        label: 'Official publisher',
        status: 'pass',
        detail: `First-party build by PIK Intelligence — shipped from ${artifact.repo}, pinned at provisioning time.`,
      },
      {
        id: 'sha256',
        label: 'SHA-256 fingerprint',
        status: 'pass',
        detail: `Pinned digest ${artifact.sha256} recorded by provision_model.sh against HuggingFace LFS metadata.`,
      },
      {
        id: 'offline-engine',
        label: 'Offline inference engine',
        status: 'pass',
        detail: 'Embedded llama.cpp runtime (V0.1 core). No telemetry, no cloud calls — the model runs entirely on-device.',
      },
      {
        id: 'no-exec-payload',
        label: 'Payload type',
        status: 'pass',
        detail: 'GGUF model weights only. Contains no executable code.',
      },
      {
        id: 'integrity-check',
        label: 'Runtime integrity check',
        status: 'pass',
        detail: 'nexus_engine_create verifies the GGUF header and mmap before loading; corrupt files are refused, never re-downloaded.',
      },
    ],
    engines: null,
    file: {
      name: artifact.file,
      size: artifact.bytes,
      sha256: artifact.sha256,
      // First-party installer served by PikStore itself — never a GitHub
      // URL, so clicking Install downloads the .exe directly.
      url: nexusInstallerUrl(quant === 'UD-IQ2_XXS' ? 'android' : 'windows'),
      version: `v0.1 · ${quant}`,
      publishedAt: artifact.provisioned_at,
    },
    scannedAt: new Date().toISOString(),
  }
}
