// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
/**
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
