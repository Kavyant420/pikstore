// ---------------------------------------------------------------------------
// Copyright (c) 2026 Kavyant420. All rights reserved.
// Licensed under the MIT License. See LICENSE file in the project root.
// SPDX-License-Identifier: MIT
// ---------------------------------------------------------------------------
/**
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
