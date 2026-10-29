// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
/**
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
