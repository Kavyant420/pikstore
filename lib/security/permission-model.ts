// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
/**
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
