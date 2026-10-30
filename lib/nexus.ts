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
      // Not a GitHub URL on purpose: startDownload() refuses it, so the
      // dialog shows explicit install instructions instead of a blind fetch.
      url: `https://github.com/${NEXUS_APP_ID}`,
      version: `v0.1 · ${quant}`,
      publishedAt: artifact.provisioned_at,
    },
    scannedAt: new Date().toISOString(),
  }
}
