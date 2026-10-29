// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
/**
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
