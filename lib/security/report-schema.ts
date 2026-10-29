// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
/**
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
