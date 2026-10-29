// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
/**
 * Curated open-source malware indicator list (names/strings observed in public
 * threat reports). Used only for defensive pattern matching against installer
 * metadata and file names — never transmitted anywhere.
 */
export type SignatureEntry = { id: string; family: string; pattern: RegExp | null; severity: 'low' | 'medium' | 'high' | 'critical'; reference: string }

export const SIGNATURES: readonly SignatureEntry[] = [
  { id: 'sig-0001', family: 'dropper.double-ext', pattern: /\.(jpe?g|png|pdf|docx?|xlsx?|txt|mp[34])\.(exe|msi|scr|bat|cmd|vbs|ps1|jar)$/i, severity: 'critical', reference: 'MITRE ATT&CK T1036.007 Masquerading: File Type Extensions' },
  { id: 'sig-0002', family: 'keygen.crack', pattern: /(keygen|crack|[\\w-]+patcher)\\.(exe|zip)/i, severity: 'high', reference: 'Common piracy-bundled malware class' },
  { id: 'sig-0003', family: 'typosquat.repo', pattern: /(githup|gitub|githubh|paypa|microsof|googl|whatsap)[\\w.-]*/i, severity: 'high', reference: 'Typosquatting — brand confusion' },
  { id: 'sig-0004', family: 'downloader.stub', pattern: null, severity: 'medium', reference: 'Installer stub smaller than 150 KB without signature' },
  { id: 'sig-0005', family: 'script-exec.scr', pattern: /\.scr$/i, severity: 'high', reference: 'Windows screensaver executables abused since NT era' },
  { id: 'sig-0006', family: 'macro.doc', pattern: /\.(docm|xlsm|pptm)$|office.*macro/i, severity: 'medium', reference: 'Office macro-enabled documents (ATT&CK T1137/T1204.002)' },
  { id: 'sig-0007', family: 'remote-access', pattern: /(nanoit|teamviewer[-_]?(setup|installer)|anydesk)[-_.]?(crack|portable|free)/i, severity: 'high', reference: 'RAT lures impersonating remote tools' },
  { id: 'sig-0008', family: 'crypto-stealer', pattern: /(wallet[-_]?(recover|sync)|seed[-_]?phrase[-_]?tool|metamask[-_]?update)/i, severity: 'critical', reference: 'Wallet stealer naming conventions' },
  { id: 'sig-0009', family: 'game-mod.malware', pattern: /(trainer|mod[-_]?menu|aimbot|wallhack).*\\.(exe|apk)/i, severity: 'high', reference: 'Game cheat bundles frequently ship stealers' },
  { id: 'sig-0010', family: 'fake-updater', pattern: /(chrome|firefox|edge|vs ?code)[-_.]?(update|updater)\\.(exe|msi)$/i, severity: 'medium', reference: 'Fake browser updater trojans' },
]
